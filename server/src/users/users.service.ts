import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, AuthProvider, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HubService } from './hub.service';
import { AdjustCreditsDto, AdjustmentAction } from './dto/adjust-credits.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hubService: HubService,
    private readonly dataSource: DataSource,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);

    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    }

    const user = this.userRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email?.toLowerCase(),
      phone: createUserDto.phone,
      password: hashedPassword,
      googleId: createUserDto.googleId,
      profilePicture: createUserDto.profilePicture,
      verificationToken: createUserDto.verificationToken,
      credits: createUserDto.credits,
      role: createUserDto.role as UserRole,
      costPerMinute: createUserDto.costPerMinute,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created successfully with ID: ${savedUser.id}`);

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Sync admin balance and credits from Hub only if configured
    if (user.role === UserRole.ADMIN && this.hubService.isHubConfigured()) {
      try {
        const hubData = await this.hubService.getBalance(user.email);
        let hasChanges = false;

        if (user.credits !== hubData.credits) {
          user.credits = hubData.credits;
          hasChanges = true;
        }

        if (user.balance !== hubData.balance) {
          user.balance = hubData.balance;
          hasChanges = true;
        }

        if (hubData.costPerMinute > 0 && Number(user.costPerMinute) !== Number(hubData.costPerMinute)) {
          user.costPerMinute = hubData.costPerMinute;
          hasChanges = true;
        }

        if (hasChanges) {
          await this.userRepository.save(user);
          this.logger.log(
            `Synced balance (₹${hubData.balance}), credits (${hubData.credits}), and rate (₹${hubData.costPerMinute}/min) from Hub for admin ${user.email}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Failed to sync credits with Hub for admin ${user.email}: ${error.message}`,
        );
        // Don't throw - return user with local data if Hub is unavailable
      }
    }

    // If user is a sub-user, fetch their admin's credits and balance
    if (user.role === UserRole.USER && user.adminId) {
      try {
        // adminId now stores the admin's email for stability
        const admin = await this.userRepository.findOne({
          where: { email: user.adminId, isActive: true },
        });
        if (admin) {
          (user as any).adminCredits = admin.credits;
          (user as any).adminBalance = admin.balance;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch admin data for sub-user ${user.email}: ${error.message}`,
        );
      }
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }
    return this.userRepository.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { googleId, isActive: true },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        isActive: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    const user = await this.findById(id);

    // Hash password if being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User updated successfully with ID: ${id}`);
    return updatedUser;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async setResetPasswordToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async clearResetPasswordToken(id: string): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async verifyUser(id: string): Promise<void> {
    await this.userRepository.update(id, {
      isVerified: true,
      verificationToken: null,
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting user with ID: ${id}`);

    const user = await this.findById(id);
    await this.userRepository.update(id, { isActive: false });

    this.logger.log(`User soft deleted successfully with ID: ${id}`);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async createSubUser(adminId: string, createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Admin ${adminId} initiating sub-user creation.`);

    if (!createUserDto.email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const admin = await this.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admins can create sub-users');
    }

    const requestedAmount = Number(createUserDto.amount || 0);
    const costPerMinute = Number(createUserDto.costPerMinute || 5.00);
    const calculatedCredits = Math.floor(requestedAmount / costPerMinute);

    if (admin.balance < requestedAmount) {
      throw new ConflictException(`Insufficient balance. You only have ₹${admin.balance} available.`);
    }

    if (admin.credits < calculatedCredits) {
      throw new ConflictException(`Insufficient credits. You only have ${admin.credits} minutes available.`);
    }

    return await this.dataSource.transaction(async (manager) => {
      admin.balance = Number(admin.balance) - requestedAmount;
      admin.credits = Number(admin.credits) - calculatedCredits;
      await manager.save(admin);

      const hashedPassword = await bcrypt.hash(createUserDto.password || 'defaultPassword123', 12);
      const subUserEmail = createUserDto.email?.toLowerCase();
      const parentAdminEmail = admin.email.toLowerCase();

      const user = manager.create(User, {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: subUserEmail,
        phone: createUserDto.phone,
        password: hashedPassword,
        adminId: parentAdminEmail,
        role: UserRole.USER,
        isVerified: true,
        credits: calculatedCredits,
        costPerMinute: costPerMinute,
      });

      const savedUser = await manager.save(user);

      try {
        await this.hubService.deductCredits(
          admin.email,
          requestedAmount,
          calculatedCredits,
          `Provisioned sub-user: ${savedUser.email}`,
        );
      } catch (error) {
        this.logger.error(`Failed to sync admin deduction to Hub: ${error.message}`);
      }

      return savedUser;
    });
  }

  async adjustSubUserCredits(adminId: string, subUserId: string, adjustCreditsDto: AdjustCreditsDto): Promise<User> {
    const { amount, action, description } = adjustCreditsDto;

    const admin = await this.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admins can adjust sub-user credits');
    }

    const subUser = await this.findById(subUserId);
    if (subUser.adminId !== admin.email.toLowerCase()) {
      throw new ConflictException('You can only adjust credits for your own sub-users');
    }

    const costPerMinute = Number(subUser.costPerMinute) || 5.00;

    return await this.dataSource.transaction(async (manager) => {
      if (action === AdjustmentAction.ADD) {
        const requestedAmount = Number(amount);
        const calculatedCredits = Math.floor(requestedAmount / costPerMinute);

        if (admin.balance < requestedAmount) {
          throw new BadRequestException(`Insufficient admin balance`);
        }
        if (admin.credits < calculatedCredits) {
          throw new BadRequestException(`Insufficient admin credits`);
        }

        admin.balance = Number(admin.balance) - requestedAmount;
        admin.credits = Number(admin.credits) - calculatedCredits;
        await manager.save(admin);

        subUser.credits = Number(subUser.credits) + calculatedCredits;
        const savedSubUser = await manager.save(subUser);

        try {
          await this.hubService.deductCredits(
            admin.email,
            requestedAmount,
            calculatedCredits,
            description || `Provisioned credits to ${subUser.email}`,
          );
        } catch (error) {
          this.logger.error(`Failed to sync admin deduction to Hub: ${error.message}`);
        }

        return savedSubUser;
      } else {
        const creditsToDeduct = Math.floor(Number(amount));
        if (subUser.credits < creditsToDeduct) {
          throw new BadRequestException(`Sub-user has insufficient credits`);
        }

        subUser.credits = Number(subUser.credits) - creditsToDeduct;
        return await manager.save(subUser);
      }
    });
  }

  async findSubUsers(adminId: string): Promise<User[]> {
    const admin = await this.findById(adminId);
    this.logger.log(`Fetching sub-users for admin: ${admin.email} (processed: ${admin.email.toLowerCase()})`);

    const subUsers = await this.userRepository.find({
      where: {
        adminId: admin.email.toLowerCase(),
        isActive: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    this.logger.log(`Found ${subUsers.length} sub-users for admin ${admin.email}`);
    return subUsers;
  }

  async deductUsage(userId: string, durationSeconds: number): Promise<number> {
    const user = await this.findById(userId);
    const minutesUsed = parseFloat((durationSeconds / 60).toFixed(4));
    const rate = Number(user.costPerMinute) || 5.0;
    const costInRupees = parseFloat((minutesUsed * rate).toFixed(4));

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        credits: () => `credits - ${minutesUsed}`,
        balance: () => `balance - ${costInRupees}`,
      })
      .where("id = :id", { id: userId })
      .execute();

    if (user.role === UserRole.ADMIN) {
      try {
        await this.hubService.deductCredits(
          user.email,
          costInRupees,
          minutesUsed,
          `Voice Call Usage: ${durationSeconds}s`,
        );
      } catch (e) {
        this.logger.error(`Hub sync failed for admin ${user.email}: ${e.message}`);
      }
    }

    return costInRupees;
  }

  async updateSubUser(adminId: string, subUserId: string, updateDto: UpdateUserDto): Promise<User> {
    const admin = await this.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admins can update sub-users');
    }

    const subUser = await this.findById(subUserId);
    if (subUser.adminId !== admin.email.toLowerCase()) {
      throw new ConflictException('You can only update your own sub-users');
    }

    // Only allow updating specific fields
    const { firstName, lastName, costPerMinute, password } = updateDto;

    if (firstName) subUser.firstName = firstName;
    if (lastName) subUser.lastName = lastName;
    if (costPerMinute) subUser.costPerMinute = costPerMinute;

    if (password) {
      subUser.password = await bcrypt.hash(password, 12);
    }

    return await this.userRepository.save(subUser);
  }

  async deleteSubUser(adminId: string, subUserId: string): Promise<void> {
    const admin = await this.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admins can delete sub-users');
    }

    const subUser = await this.findById(subUserId);
    if (subUser.adminId !== admin.email.toLowerCase()) {
      throw new ConflictException('You can only delete your own sub-users');
    }

    await this.userRepository.remove(subUser);
  }

  async validateAdminWithHub(email: string, password: string): Promise<any> {
    return this.hubService.validateAdmin(email, password);
  }
}