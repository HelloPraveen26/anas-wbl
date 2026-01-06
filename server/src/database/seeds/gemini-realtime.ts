import { DataSource } from "typeorm";
import {
  RealtimeProvider,
  RealtimeModel,
  RealtimeConfig,
  ConfigFieldType,
} from "../../realtime/entities";

export class GeminiRealtimeSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const realtimeProviderRepository =
      dataSource.getRepository(RealtimeProvider);
    const realtimeModelRepository = dataSource.getRepository(RealtimeModel);
    const realtimeConfigRepository = dataSource.getRepository(RealtimeConfig);

    // Check if Gemini Realtime provider already exists
    const existingProvider = await realtimeProviderRepository.findOne({
      where: { name: "Gemini Realtime" },
    });

    if (existingProvider) {
      console.log("Gemini Realtime provider already exists, skipping seed...");
      return;
    }

    // Create Gemini Realtime provider
    const geminiRealtimeProvider = realtimeProviderRepository.create({
      name: "Gemini Realtime",
      isActive: true,
    });
    await realtimeProviderRepository.save(geminiRealtimeProvider);
    console.log("Gemini Realtime provider created successfully!");

    // Create Gemini Realtime models
    const modelNames = [
      "gemini-2.5-flash-native-audio-preview-09-2025",
      "gemini-2.0-flash-live-001",
      "gemini-live-2.5-flash-preview",
      "gemini-2.0-flash-exp",
      "gemini-2.5-flash-native-audio-preview-12-2025",
    ];

    const createdModels = [];
    for (const modelName of modelNames) {
      const geminiModel = realtimeModelRepository.create({
        name: modelName,
        realtimeProvider: geminiRealtimeProvider,
        isActive: true,
      });
      await realtimeModelRepository.save(geminiModel);
      createdModels.push(geminiModel);
      console.log(`Gemini Realtime model '${modelName}' created successfully!`);
    }

    // Voice options for select type
    const voiceOptions = [
      { displayName: "Puck (Upbeat)", value: "Puck" },
      { displayName: "Zephyr (Bright)", value: "Zephyr" },
      { displayName: "Charon (Informative)", value: "Charon" },
      { displayName: "Kore (Firm)", value: "Kore" },
      { displayName: "Fenrir (Excitable)", value: "Fenrir" },
      { displayName: "Leda (Youthful)", value: "Leda" },
      { displayName: "Orus (Firm)", value: "Orus" },
      { displayName: "Aoede (Breezy)", value: "Aoede" },
      { displayName: "Callirrhoe (Easy-going)", value: "Callirrhoe" },
      { displayName: "Autonoe (Bright)", value: "Autonoe" },
      { displayName: "Enceladus (Breathy)", value: "Enceladus" },
      { displayName: "Iapetus (Clear)", value: "Iapetus" },
      { displayName: "Umbriel (Easy-going)", value: "Umbriel" },
      { displayName: "Algieba (Smooth)", value: "Algieba" },
      { displayName: "Despina (Smooth)", value: "Despina" },
      { displayName: "Erinome (Clear)", value: "Erinome" },
      { displayName: "Algenib (Gravelly)", value: "Algenib" },
      { displayName: "Rasalgethi (Informative)", value: "Rasalgethi" },
      { displayName: "Laomedeia (Upbeat)", value: "Laomedeia" },
      { displayName: "Achernar (Soft)", value: "Achernar" },
      { displayName: "Alnilam (Firm)", value: "Alnilam" },
      { displayName: "Schedar (Even)", value: "Schedar" },
      { displayName: "Gacrux (Mature)", value: "Gacrux" },
      { displayName: "Pulcherrima (Forward)", value: "Pulcherrima" },
      { displayName: "Achird (Friendly)", value: "Achird" },
      { displayName: "Zubenelgenubi (Casual)", value: "Zubenelgenubi" },
      { displayName: "Vindemiatrix (Gentle)", value: "Vindemiatrix" },
      { displayName: "Sadachbia (Lively)", value: "Sadachbia" },
      { displayName: "Sadaltager (Knowledgeable)", value: "Sadaltager" },
      { displayName: "Sulafat (Warm)", value: "Sulafat" },
    ];

    // Create Voice config
    const voiceConfig = realtimeConfigRepository.create({
      label: "Voice",
      key: "voice",
      type: ConfigFieldType.SELECT,
      list: voiceOptions,
      defaultValue: "Puck",
      active: true,
      realtimeProvider: geminiRealtimeProvider,
    });
    await realtimeConfigRepository.save(voiceConfig);
    console.log("Voice config created successfully!");

    const languageOptions = [
      { displayName: "Hindi", value: "hi-IN" },
      { displayName: "Telugu", value: "te-IN" },
      { displayName: "Tamil", value: "ta-IN" },
      { displayName: "Marathi", value: "mr-IN" },
      { displayName: "English (India)", value: "en-IN" },
    ];

    // Create Language config
    const languageConfig = realtimeConfigRepository.create({
      label: "Language",
      key: "language",
      type: ConfigFieldType.SELECT,
      list: languageOptions,
      defaultValue: "en-IN",
      active: true,
      realtimeProvider: geminiRealtimeProvider,
    });
    await realtimeConfigRepository.save(languageConfig);
    console.log("Language config created successfully!");

    console.log("Gemini Realtime configs have been seeded successfully!");
    console.log("Created 1 realtime provider (Gemini Realtime)");
    console.log(`Created ${modelNames.length} realtime models`);
    console.log("Created 3 realtime configs (Voice, Instructions, Language)");
  }
}
