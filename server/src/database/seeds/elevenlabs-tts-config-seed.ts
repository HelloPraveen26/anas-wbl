import { DataSource } from "typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
  TtsConfig,
  ConfigFieldType,
} from "../../synthesizer/entities";

export class ElevenLabsTtsConfigSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository =
      dataSource.getRepository(SynthesizerModel);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    const provider = await synthesizerProviderRepository.findOne({
      where: { name: "ElevenLabs", isActive: true },
    });

    if (!provider) {
      console.log(
        "ElevenLabs provider not found or not active, skipping seed...",
      );
      return;
    }

    const existingConfigs = await ttsConfigRepository.find({
      where: { synthesizerProvider: { id: provider.id } },
    });

    if (existingConfigs.length > 0) {
      console.log("ElevenLabs TTS configs already exist, skipping seed...");
      return;
    }

    // Create eleven_flash_v2_5 model if it doesn't exist
    const existingModel = await synthesizerModelRepository.findOne({
      where: {
        name: "eleven_flash_v2_5",
        synthesizerProvider: { id: provider.id },
      },
    });

    if (!existingModel) {
      const elevenFlashModel = synthesizerModelRepository.create({
        name: "eleven_flash_v2_5",
        synthesizerProvider: provider,
        isActive: true,
      });
      await synthesizerModelRepository.save(elevenFlashModel);
      console.log("Created eleven_flash_v2_5 model");
    }

    const voiceOptions = [
      { displayName: "Vanishree", value: "OUBMjq0LvBjb07bhwD3H" },
      { displayName: "Ramaa", value: "wiDlejywCB3MR5QRP1k5" },
      { displayName: "Mandira", value: "u7DoEF74Zzu8FP2dxDfk" },
      { displayName: "Meera", value: "gCr8TeSJgJaeaIoV4RWH" },
      { displayName: "Prashant", value: "yIFUVClxedWzoMYhk15k" },
      { displayName: "Bhuvan", value: "7m78ozESu9AeQo6phspi" },
      { displayName: "Ashwin", value: "yt40uMsmnhVftG8ngHsz" },
      { displayName: "Mandria", value: "IC6fkbI5BN65xFmhUCbY" },
      { displayName: "Yazhini", value: "a49ffQsGpRBw28CL67GF" },
      { displayName: "Muthu", value: "gJvkwI7wGFW2czmyfJhp" },
      { displayName: "Harini", value: "Nda4CxqYPMJ65wadFnhJ" },
      { displayName: "Samarath", value: "0Xr3l2lRTBCHqKRYOVtZ" },
    ];

    const voiceConfig = ttsConfigRepository.create({
      label: "Voice",
      key: "voice_id",
      type: ConfigFieldType.SELECT,
      list: voiceOptions,
      defaultValue: "OUBMjq0LvBjb07bhwD3H",
      active: true,
      synthesizerProvider: provider,
    });
    await ttsConfigRepository.save(voiceConfig);

    console.log("ElevenLabs TTS configs have been seeded successfully!");
  }
}
