import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContactNumber } from "./entities/contact-number.entity";
import { CreateContactNumberDto } from "./dto/create-contact-number.dto";
import { UpdateContactNumberDto } from "./dto/update-contact-number.dto";

@Injectable()
export class ContactNumbersService {
  constructor(
    @InjectRepository(ContactNumber)
    private contactNumberRepository: Repository<ContactNumber>,
  ) {}

  async create(
    createContactNumberDto: CreateContactNumberDto,
    userId: string,
  ): Promise<ContactNumber> {
    const contactNumber = this.contactNumberRepository.create({
      ...createContactNumberDto,
      userId,
    });

    return this.contactNumberRepository.save(contactNumber);
  }

  async findAllByUser(userId: string): Promise<ContactNumber[]> {
    return this.contactNumberRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<ContactNumber> {
    const contactNumber = await this.contactNumberRepository.findOne({
      where: { id, userId },
    });

    if (!contactNumber) {
      throw new NotFoundException(`Contact number with ID ${id} not found`);
    }

    return contactNumber;
  }

  async update(
    id: string,
    updateContactNumberDto: UpdateContactNumberDto,
    userId: string,
  ): Promise<ContactNumber> {
    const contactNumber = await this.findOne(id, userId);

    Object.assign(contactNumber, updateContactNumberDto);

    return this.contactNumberRepository.save(contactNumber);
  }

  async remove(id: string, userId: string): Promise<void> {
    const contactNumber = await this.findOne(id, userId);
    await this.contactNumberRepository.remove(contactNumber);
  }
}
