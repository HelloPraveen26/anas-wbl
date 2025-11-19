import { DataSource } from "typeorm";
import {
  SynthesizerProvider,
  TtsConfig,
  ConfigFieldType,
} from "../../synthesizer/entities";

export class TtsConfigSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    // Check if TTS configs already exist
    const existingConfigs = await ttsConfigRepository.find();
    if (existingConfigs.length > 0) {
      console.log("TTS configs already exist, skipping seed...");
      return;
    }

    const provider = await synthesizerProviderRepository.findOne({
      where: { name: "Sarvam", isActive: true },
    });

    if (!provider) {
      console.log("Sarvam provider not found or not active, skipping seed...");
      return;
    }
    // Speaker options for select type
    const speakerOptions = [
      { displayName: "Anushka(F)", value: "anushka" },
      { displayName: "Manisha(F)", value: "manisha" },
      { displayName: "Abhilash(M)", value: "abhilash" },
      { displayName: "Karun(M)", value: "karun" },
    ];
    const speakerConfig = ttsConfigRepository.create({
      label: "Speaker",
      key: "speaker",
      type: ConfigFieldType.SELECT,
      list: speakerOptions,
      defaultValue: "anushka",
      active: true,
      synthesizerProvider: provider,
    });
    await ttsConfigRepository.save(speakerConfig);

    console.log("TTS configs have been seeded successfully!");
  }
}
