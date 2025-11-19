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

    // Get all transcriber providers
    const providers = await transcriberProviderRepository.find({
      where: { isActive: true },
    });

    if (providers.length === 0) {
      console.log(
        "No transcriber providers found. Please run transcriber seed first.",
      );
      return;
    }

    // Language options for select type
    const languageOptions = [
      { displayName: "English (US)", value: "en-US" },
      { displayName: "English (UK)", value: "en-GB" },
      { displayName: "Hindi (India)", value: "hi-IN" },
      { displayName: "Spanish", value: "es-ES" },
      { displayName: "French", value: "fr-FR" },
      { displayName: "German", value: "de-DE" },
      { displayName: "Italian", value: "it-IT" },
      { displayName: "Portuguese", value: "pt-PT" },
      { displayName: "Japanese", value: "ja-JP" },
      { displayName: "Korean", value: "ko-KR" },
      { displayName: "Chinese (Mandarin)", value: "zh-CN" },
      { displayName: "Russian", value: "ru-RU" },
      { displayName: "Arabic", value: "ar-SA" },
    ];

    let totalConfigsCreated = 0;

    // Create language config for each provider
    for (const provider of providers) {
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
      totalConfigsCreated++;
    }

    console.log("STT configs have been seeded successfully!");
    console.log(
      `Created ${totalConfigsCreated} STT configs across ${providers.length} providers`,
    );
  }
}
