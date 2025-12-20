import { DataSource } from "typeorm";
import {
  TranscriberProvider,
  TranscriberModel,
  SttConfig,
  ConfigFieldType,
} from "../../transcriber/entities";
import {
  SynthesizerProvider,
  SynthesizerModel,
  TtsConfig,
} from "../../synthesizer/entities";

export class DeepgramSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const transcriberProviderRepository =
      dataSource.getRepository(TranscriberProvider);
    const transcriberModelRepository =
      dataSource.getRepository(TranscriberModel);
    const sttConfigRepository = dataSource.getRepository(SttConfig);
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository =
      dataSource.getRepository(SynthesizerModel);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    // 1. Create transcriber Provider with name Deepgram if not exist
    let deepgramTranscriberProvider =
      await transcriberProviderRepository.findOne({
        where: { name: "Deepgram" },
      });

    if (!deepgramTranscriberProvider) {
      deepgramTranscriberProvider = transcriberProviderRepository.create({
        name: "Deepgram",
        isActive: true,
      });
      await transcriberProviderRepository.save(deepgramTranscriberProvider);
      console.log("Deepgram transcriber provider created successfully!");
    } else {
      console.log("Deepgram transcriber provider already exists");
    }

    // 2. Create transcriber model for Deepgram - nova-3
    const existingTranscriberModel = await transcriberModelRepository.findOne({
      where: {
        name: "nova-3",
        transcriberProvider: deepgramTranscriberProvider,
      },
    });

    if (!existingTranscriberModel) {
      const deepgramTranscriberModel = transcriberModelRepository.create({
        name: "nova-3",
        transcriberProvider: deepgramTranscriberProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(deepgramTranscriberModel);
      console.log("Deepgram transcriber model 'nova-3' created successfully!");
    } else {
      console.log("Deepgram transcriber model 'nova-3' already exists");
    }

    // 3. Create language configuration for transcriber
    const existingSttLanguageConfig = await sttConfigRepository.findOne({
      where: {
        key: "language",
        transcriberProvider: deepgramTranscriberProvider,
      },
    });

    if (!existingSttLanguageConfig) {
      const languageOptions = [
        { displayName: "English (India)", value: "en-IN" },
        { displayName: "Hindi", value: "hi" },
        { displayName: "English", value: "en" },
        { displayName: "Urdu", value: "ur" },
      ];
      const languageConfig = sttConfigRepository.create({
        label: "Language",
        key: "language",
        type: ConfigFieldType.SELECT,
        list: languageOptions,
        defaultValue: "en",
        active: true,
        transcriberProvider: deepgramTranscriberProvider,
      });
      await sttConfigRepository.save(languageConfig);
      console.log("Deepgram transcriber language config created successfully!");
    } else {
      console.log("Deepgram transcriber language config already exists");
    }

    // 4. Create synthesizer Provider with name Deepgram if not exist
    let deepgramSynthesizerProvider =
      await synthesizerProviderRepository.findOne({
        where: { name: "Deepgram" },
      });

    if (!deepgramSynthesizerProvider) {
      deepgramSynthesizerProvider = synthesizerProviderRepository.create({
        name: "Deepgram",
        isActive: true,
      });
      await synthesizerProviderRepository.save(deepgramSynthesizerProvider);
      console.log("Deepgram synthesizer provider created successfully!");
    } else {
      console.log("Deepgram synthesizer provider already exists");
    }

    // 5. Create synthesizer model for Deepgram - aura-asteria-en
    const existingSynthesizerModel = await synthesizerModelRepository.findOne({
      where: {
        name: "aura-asteria-en",
        synthesizerProvider: deepgramSynthesizerProvider,
      },
    });

    if (!existingSynthesizerModel) {
      const deepgramSynthesizerModel = synthesizerModelRepository.create({
        name: "aura-asteria-en",
        synthesizerProvider: deepgramSynthesizerProvider,
        isActive: true,
      });
      await synthesizerModelRepository.save(deepgramSynthesizerModel);
      console.log(
        "Deepgram synthesizer model 'aura-asteria-en' created successfully!",
      );
    } else {
      console.log(
        "Deepgram synthesizer model 'aura-asteria-en' already exists",
      );
    }

    console.log("Deepgram seed completed successfully!");
    console.log("Created Deepgram transcriber provider and nova-3 model");
    console.log(
      "Created Deepgram synthesizer provider and aura-asteria-en model",
    );
    console.log("Created language configuration for transcriber");
  }
}
