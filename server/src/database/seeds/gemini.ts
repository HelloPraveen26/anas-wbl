import { DataSource } from "typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
  TtsConfig,
  ConfigFieldType,
} from "../../synthesizer/entities";

export class GeminiSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository =
      dataSource.getRepository(SynthesizerModel);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    // Check if Gemini provider already exists
    const existingProvider = await synthesizerProviderRepository.findOne({
      where: { name: "Gemini" },
    });

    if (existingProvider) {
      console.log("Gemini provider already exists, skipping seed...");
      return;
    }

    // Create Gemini provider
    const geminiProvider = synthesizerProviderRepository.create({
      name: "Gemini",
      isActive: true,
    });
    await synthesizerProviderRepository.save(geminiProvider);
    console.log("Gemini provider created successfully!");

    // Create Gemini model
    const geminiModel = synthesizerModelRepository.create({
      name: "gemini-2.5-flash-preview-tts",
      synthesizerProvider: geminiProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(geminiModel);
    console.log("Gemini model 'gemini-2.5-flash-preview-tts' created successfully!");

    // Voice options for select type
    const voiceOptions = [
      { displayName: "Zephyr (Bright)", value: "Zephyr" },
      { displayName: "Puck (Upbeat)", value: "Puck" },
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

    // Create Voice Name config
    const voiceConfig = ttsConfigRepository.create({
      label: "Voice Name",
      key: "voice_name",
      type: ConfigFieldType.SELECT,
      list: voiceOptions,
      defaultValue: "Zephyr",
      active: true,
      synthesizerProvider: geminiProvider,
    });
    await ttsConfigRepository.save(voiceConfig);
    console.log("Voice Name config created successfully!");

    // Create Instructions config
    const instructionsConfig = ttsConfigRepository.create({
      label: "Instructions",
      key: "instructions",
      type: ConfigFieldType.STRING,
      list: null,
      defaultValue: "Speak in a friendly and engaging tone.",
      active: true,
      synthesizerProvider: geminiProvider,
    });
    await ttsConfigRepository.save(instructionsConfig);
    console.log("Instructions config created successfully!");

    console.log("Gemini TTS configs have been seeded successfully!");
    console.log("Created 1 synthesizer provider (Gemini)");
    console.log("Created 1 synthesizer model (gemini-2.5-flash-preview-tts)");
    console.log("Created 2 TTS configs (Voice Name, Instructions)");
  }
}
