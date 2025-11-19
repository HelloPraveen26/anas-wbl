import { DataSource } from "typeorm";
import {
  TranscriberProvider,
  SttConfig,
  ConfigFieldType,
} from "../../transcriber/entities";

export class SttConfigSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const transcriberProviderRepository =
      dataSource.getRepository(TranscriberProvider);
    const sttConfigRepository = dataSource.getRepository(SttConfig);

    // Check if STT configs already exist
    const existingConfigs = await sttConfigRepository.find();
    if (existingConfigs.length > 0) {
      console.log("STT configs already exist, skipping seed...");
      return;
    }

    // Get Sarvam transcriber provider
    const provider = await transcriberProviderRepository.findOne({
      where: { name: "Sarvam", isActive: true },
    });

    if (!provider) {
      console.log("Sarvam provider not found or not active, skipping seed...");
      return;
    }

    // Language options for select type
    const languageOptions = [
      { displayName: "English (India)", value: "en-IN" },
      { displayName: "Hindi", value: "hi-IN" },
      { displayName: "Bengali", value: "bn-IN" },
      { displayName: "Tamil", value: "ta-IN" },
      { displayName: "Telugu", value: "te-IN" },
      { displayName: "Gujarati", value: "gu-IN" },
      { displayName: "Kannada", value: "kn-IN" },
      { displayName: "Malayalam", value: "ml-IN" },
      { displayName: "Marathi", value: "mr-IN" },
      { displayName: "Punjabi", value: "pb-IN" },
      { displayName: "Odia", value: "od-IN" },
      { displayName: "Auto-detect", value: "unknown" },
    ];

    // Create language config for each provider
    const languageConfig = sttConfigRepository.create({
      label: "Language",
      key: "language",
      type: ConfigFieldType.SELECT,
      list: languageOptions,
      defaultValue: "en-US",
      active: true,
      transcriberProvider: provider,
    });
    await sttConfigRepository.save(languageConfig);
    console.log("STT configs have been seeded successfully!");
  }
}
