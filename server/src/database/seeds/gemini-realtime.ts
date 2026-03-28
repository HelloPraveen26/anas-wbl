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

    // Get or create Gemini Realtime provider
    let geminiRealtimeProvider = await realtimeProviderRepository.findOne({
      where: { name: "Gemini Realtime" },
    });

    if (!geminiRealtimeProvider) {
      geminiRealtimeProvider = realtimeProviderRepository.create({
        name: "Gemini Realtime",
        isActive: true,
      });
      await realtimeProviderRepository.save(geminiRealtimeProvider);
      console.log("Gemini Realtime provider created successfully!");
    } else {
      console.log("Gemini Realtime provider already exists, updating models...");
    }

    // Requested Model Whitelist
    const modelNames = [
      "gemini-2.5-flash-native-audio-preview-09-2025",
      "gemini-2.5-flash-native-audio-preview-12-2025",
      "gemini-3.1-flash-live-preview",
    ];

    // 1. Deactivate all existing models for this provider first to ensure a clean state
    await realtimeModelRepository.update(
      { realtimeProvider: { id: geminiRealtimeProvider.id } },
      { isActive: false }
    );

    // 2. Ensure each model in the whitelist exists and is active
    for (const modelName of modelNames) {
      let geminiModel = await realtimeModelRepository.findOne({
        where: { name: modelName, realtimeProvider: { id: geminiRealtimeProvider.id } },
      });

      if (geminiModel) {
        geminiModel.isActive = true;
        await realtimeModelRepository.save(geminiModel);
        console.log(`Gemini Realtime model '${modelName}' reactivated.`);
      } else {
        geminiModel = realtimeModelRepository.create({
          name: modelName,
          realtimeProvider: geminiRealtimeProvider,
          isActive: true,
        });
        await realtimeModelRepository.save(geminiModel);
        console.log(`Gemini Realtime model '${modelName}' created successfully!`);
      }
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

    // Delete existing Voice configs to prevent duplicates
    await realtimeConfigRepository.delete({
      key: "voice",
      realtimeProvider: { id: geminiRealtimeProvider.id },
    });

    // Create unique Voice config
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
    console.log("Voice config synchronized successfully!");

    const languageOptions = [
      { displayName: "Hindi", value: "hi-IN" },
      { displayName: "Telugu", value: "te-IN" },
      { displayName: "Tamil", value: "ta-IN" },
      { displayName: "Marathi", value: "mr-IN" },
      { displayName: "English (India)", value: "en-IN" },
    ];

    // Delete existing Language configs to prevent duplicates
    await realtimeConfigRepository.delete({
      key: "language",
      realtimeProvider: { id: geminiRealtimeProvider.id },
    });

    // Create unique Language config
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
    console.log("Language config synchronized successfully!");

    console.log("Gemini Realtime configs have been seeded successfully!");
    console.log("Created 1 realtime provider (Gemini Realtime)");
    console.log(`Created ${modelNames.length} realtime models`);
    console.log("Created 3 realtime configs (Voice, Instructions, Language)");
  }
}
