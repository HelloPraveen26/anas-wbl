import { DataSource } from "typeorm";
import { ContactNumber } from "../../contact-numbers/entities/contact-number.entity";
import { User } from "../../users/entities/user.entity";

export class ContactNumbersSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const contactNumberRepository = dataSource.getRepository(ContactNumber);
    const userRepository = dataSource.getRepository(User);

    // Get the first user from the database (you might want to modify this logic)
    const user = await userRepository.findOne({
      where: {},
      order: { createdAt: "ASC" },
    });

    if (!user) {
      console.log("No users found. Please seed users first.");
      return;
    }

    const contactNumbersData = [
      { name: "Hari", phoneNo: "+919566999018" },
      { name: "Praveen", phoneNo: "+919994081905" },
      { name: "Bamini", phoneNo: "+919840653588" },
    ];

    for (const contactData of contactNumbersData) {
      const existingContact = await contactNumberRepository.findOne({
        where: {
          name: contactData.name,
          phoneNo: contactData.phoneNo,
          userId: user.id,
        },
      });

      if (!existingContact) {
        const contactNumber = contactNumberRepository.create({
          name: contactData.name,
          phoneNo: contactData.phoneNo,
          userId: user.id,
        });

        await contactNumberRepository.save(contactNumber);
        console.log(`Created contact number: ${contactData.name} - ${contactData.phoneNo}`);
      } else {
        console.log(`Contact number already exists: ${contactData.name} - ${contactData.phoneNo}`);
      }
    }

    console.log("Contact numbers seed completed.");
  }
}
