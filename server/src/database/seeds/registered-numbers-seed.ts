import { DataSource } from "typeorm";
import { RegisteredNumber } from "../../registered-numbers/entities/registered-number.entity";
import { User } from "../../users/entities/user.entity";

export class RegisteredNumbersSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const registeredNumberRepository = dataSource.getRepository(RegisteredNumber);
    const userRepository = dataSource.getRepository(User);

    // Check if registered numbers already exist
    const existingNumbers = await registeredNumberRepository.find();
    if (existingNumbers.length > 0) {
      console.log("Registered numbers already exist, skipping seed...");
      return;
    }

    // Find the first active user to associate with the registered number
    const user = await userRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' }
    });

    if (!user) {
      console.log("No active user found, skipping registered numbers seed...");
      return;
    }

    // Create the registered number with the provided data
    const registeredNumber = registeredNumberRepository.create({
      providerName: "twilio",
      friendlyName: "Balaji k",
      phoneNo: "+19282185402",
      livekitOutboundTrunkId: "ST_xn9xEW6gFR3R",
      active: true,
      userId: user.id,
    });

    await registeredNumberRepository.save(registeredNumber);

    console.log("Registered numbers have been seeded successfully!");
    console.log(`Created registered number: ${registeredNumber.phoneNo} (${registeredNumber.friendlyName})`);
  }
}
