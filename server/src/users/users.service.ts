import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, AuthProvider } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
      ...createUserDto,
      password: hashedPassword,
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

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
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

  async createGoogleUser(profile: any): Promise<User> {
    this.logger.log(`Creating Google user with email: ${profile.emails[0].value}`);

    const userData = {
      email: profile.emails[0].value.toLowerCase(),
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      googleId: profile.id,
      authProvider: AuthProvider.GOOGLE,
      isVerified: true,
      profilePicture: profile.photos?.[0]?.value,
    };

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`Google user created successfully with ID: ${savedUser.id}`);
    return savedUser;
  }
}