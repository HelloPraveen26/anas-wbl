import { DataSource } from "typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
  TtsConfig,
  ConfigFieldType,
} from "../../synthesizer/entities";

export class LmntSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository =
      dataSource.getRepository(SynthesizerModel);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    // Check if LMNT provider already exists
    const existingProvider = await synthesizerProviderRepository.findOne({
      where: { name: "LMNT" },
    });

    if (existingProvider) {
      console.log("LMNT provider already exists, skipping seed...");
      return;
    }

    // Create LMNT provider
    const lmntProvider = synthesizerProviderRepository.create({
      name: "LMNT",
      isActive: true,
    });
    await synthesizerProviderRepository.save(lmntProvider);
    console.log("LMNT provider created successfully!");

    // Create blizzard model
    const blizzardModel = synthesizerModelRepository.create({
      name: "blizzard",
      synthesizerProvider: lmntProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(blizzardModel);
    console.log("LMNT model 'blizzard' created successfully!");

    // Voice options
    const voiceNames = [
      "ansel",
      "autumn",
      "bella",
      "brandon",
      "cassian",
      "elowen",
      "evander",
      "huxley",
      "jacob",
      "juniper",
      "kennedy",
      "leah",
      "lucas",
      "morgan",
      "natalie",
      "nyssa",
      "ryan",
      "sadie",
      "stella",
      "tyler",
      "vesper",
      "violet",
      "warrick",
      "zain",
    ];

    const voiceOptions = voiceNames.map((name) => ({
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      value: name,
    }));

    const voiceConfig = ttsConfigRepository.create({
      label: "Voice",
      key: "voice",
      type: ConfigFieldType.SELECT,
      list: voiceOptions,
      defaultValue: "leah",
      active: true,
      synthesizerProvider: lmntProvider,
    });
    await ttsConfigRepository.save(voiceConfig);
    console.log("Voice config created successfully!");

    // Language options
    const languageOptions = [
      { displayName: "Arabic", value: "ar" },
      { displayName: "Hindi", value: "hi" },
      { displayName: "English", value: "en" },
      { displayName: "Urdu", value: "ur" },
      { displayName: "Chinese", value: "zh" },
      { displayName: "Dutch", value: "nl" },
      { displayName: "French", value: "fr" },
      { displayName: "German", value: "de" },
      { displayName: "Italian", value: "it" },
      { displayName: "Japanese", value: "ja" },
      { displayName: "Korean", value: "ko" },
      { displayName: "Polish", value: "pl" },
      { displayName: "Portuguese", value: "pt" },
      { displayName: "Russian", value: "ru" },
      { displayName: "Spanish", value: "es" },
      { displayName: "Swedish", value: "sv" },
      { displayName: "Thai", value: "th" },
      { displayName: "Turkish", value: "tr" },
      { displayName: "Ukrainian", value: "uk" },
      { displayName: "Vietnamese", value: "vi" },
    ];

    const languageConfig = ttsConfigRepository.create({
      label: "Language",
      key: "language",
      type: ConfigFieldType.SELECT,
      list: languageOptions,
      defaultValue: "en",
      active: true,
      synthesizerProvider: lmntProvider,
    });
    await ttsConfigRepository.save(languageConfig);
    console.log("Language config created successfully!");

    // Temperature config
    const temperatureConfig = ttsConfigRepository.create({
      label: "Temperature",
      key: "temperature",
      type: ConfigFieldType.NUMBER,
      list: null,
      defaultValue: "0.3",
      active: true,
      synthesizerProvider: lmntProvider,
    });
    await ttsConfigRepository.save(temperatureConfig);
    console.log("Temperature config created successfully!");

    console.log("LMNT TTS configs have been seeded successfully!");
    console.log("Created 1 synthesizer provider (LMNT)");
    console.log("Created 1 synthesizer model (blizzard)");
    console.log("Created 3 TTS configs (Voice, Language, Temperature)");
  }
}
