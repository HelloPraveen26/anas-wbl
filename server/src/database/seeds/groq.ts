import { DataSource } from "typeorm";
import { LlmProvider, LlmModel } from "../../llm/entities";
import {
  TranscriberProvider,
  TranscriberModel,
  SttConfig,
  ConfigFieldType as SttConfigFieldType,
} from "../../transcriber/entities";
import {
  SynthesizerProvider,
  SynthesizerModel,
  TtsConfig,
  ConfigFieldType,
} from "../../synthesizer/entities";

export class GroqSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const llmProviderRepository = dataSource.getRepository(LlmProvider);
    const llmModelRepository = dataSource.getRepository(LlmModel);
    const transcriberProviderRepository =
      dataSource.getRepository(TranscriberProvider);
    const transcriberModelRepository =
      dataSource.getRepository(TranscriberModel);
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository =
      dataSource.getRepository(SynthesizerModel);
    const sttConfigRepository = dataSource.getRepository(SttConfig);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    // Create LLM Provider if not exists
    let groqLlmProvider = await llmProviderRepository.findOne({
      where: { name: "Groq" },
    });

    if (!groqLlmProvider) {
      groqLlmProvider = llmProviderRepository.create({
        name: "Groq",
        isActive: true,
      });
      await llmProviderRepository.save(groqLlmProvider);
      console.log("Groq LLM provider created successfully!");
    } else {
      console.log("Groq LLM provider already exists");
    }

    // Create LLM Models for Groq provider
    const llmModelNames = ["llama3-8b-8192", "llama-3.3-70b-versatile"];

    for (const modelName of llmModelNames) {
      const existingModel = await llmModelRepository.findOne({
        where: { name: modelName, llmProvider: { id: groqLlmProvider.id } },
      });

      if (!existingModel) {
        const llmModel = llmModelRepository.create({
          name: modelName,
          llmProvider: groqLlmProvider,
          isActive: true,
        });
        await llmModelRepository.save(llmModel);
        console.log(`Groq LLM model '${modelName}' created successfully!`);
      } else {
        console.log(`Groq LLM model '${modelName}' already exists`);
      }
    }

    // Create Transcriber Provider if not exists
    let groqTranscriberProvider = await transcriberProviderRepository.findOne({
      where: { name: "Groq" },
    });

    if (!groqTranscriberProvider) {
      groqTranscriberProvider = transcriberProviderRepository.create({
        name: "Groq",
        isActive: true,
      });
      await transcriberProviderRepository.save(groqTranscriberProvider);
      console.log("Groq Transcriber provider created successfully!");
    } else {
      console.log("Groq Transcriber provider already exists");
    }

    // Create Transcriber Models for Groq provider
    const transcriberModelNames = [
      "whisper-large-v3-turbo",
      "whisper-large-v3",
    ];

    for (const modelName of transcriberModelNames) {
      const existingModel = await transcriberModelRepository.findOne({
        where: {
          name: modelName,
          transcriberProvider: { id: groqTranscriberProvider.id },
        },
      });

      if (!existingModel) {
        const transcriberModel = transcriberModelRepository.create({
          name: modelName,
          transcriberProvider: groqTranscriberProvider,
          isActive: true,
        });
        await transcriberModelRepository.save(transcriberModel);
        console.log(
          `Groq Transcriber model '${modelName}' created successfully!`,
        );
      } else {
        console.log(`Groq Transcriber model '${modelName}' already exists`);
      }
    }

    // Create STT Language Config for Groq Transcriber
    const existingLanguageConfig = await sttConfigRepository.findOne({
      where: {
        key: "language",
        transcriberProvider: { id: groqTranscriberProvider.id },
      },
    });

    if (!existingLanguageConfig) {
      const languageOptions = [
        { displayName: "Hindi", value: "hi" },
        { displayName: "Telugu", value: "te" },
        { displayName: "Tamil", value: "ta" },
        { displayName: "Kannada", value: "kn" },
        { displayName: "Malayalam", value: "ml" },
        { displayName: "English", value: "en" },
        { displayName: "Urdu", value: "ur" },
      ];

      const languageConfig = sttConfigRepository.create({
        label: "Language",
        key: "language",
        type: SttConfigFieldType.SELECT,
        list: languageOptions,
        defaultValue: "en",
        active: true,
        transcriberProvider: groqTranscriberProvider,
      });
      await sttConfigRepository.save(languageConfig);
      console.log("Groq STT Language config created successfully!");
    } else {
      console.log("Groq STT Language config already exists");
    }

    // Create Synthesizer Provider if not exists
    let groqSynthesizerProvider = await synthesizerProviderRepository.findOne({
      where: { name: "Groq" },
    });

    if (!groqSynthesizerProvider) {
      groqSynthesizerProvider = synthesizerProviderRepository.create({
        name: "Groq",
        isActive: true,
      });
      await synthesizerProviderRepository.save(groqSynthesizerProvider);
      console.log("Groq Synthesizer provider created successfully!");
    } else {
      console.log("Groq Synthesizer provider already exists");
    }

    // Create Synthesizer Models for Groq provider
    const synthesizerModelNames = ["playai-tts", "playai-tts-arabic"];

    for (const modelName of synthesizerModelNames) {
      const existingModel = await synthesizerModelRepository.findOne({
        where: {
          name: modelName,
          synthesizerProvider: { id: groqSynthesizerProvider.id },
        },
      });

      if (!existingModel) {
        const synthesizerModel = synthesizerModelRepository.create({
          name: modelName,
          synthesizerProvider: groqSynthesizerProvider,
          isActive: true,
        });
        await synthesizerModelRepository.save(synthesizerModel);
        console.log(
          `Groq Synthesizer model '${modelName}' created successfully!`,
        );
      } else {
        console.log(`Groq Synthesizer model '${modelName}' already exists`);
      }
    }

    // Create TTS Speaker Config for Groq Synthesizer
    const existingSpeakerConfig = await ttsConfigRepository.findOne({
      where: {
        key: "speaker",
        synthesizerProvider: { id: groqSynthesizerProvider.id },
      },
    });

    if (!existingSpeakerConfig) {
      const speakerOptions = [
        { displayName: "Arista-PlayAI(F)", value: "Arista-PlayAI" },
        { displayName: "Atlas-PlayAI(M)", value: "Atlas-PlayAI" },
      ];

      const speakerConfig = ttsConfigRepository.create({
        label: "Voice",
        key: "voice",
        type: ConfigFieldType.SELECT,
        list: speakerOptions,
        defaultValue: "Arista-PlayAI",
        active: true,
        synthesizerProvider: groqSynthesizerProvider,
      });
      await ttsConfigRepository.save(speakerConfig);
      console.log("Groq TTS Speaker config created successfully!");
    } else {
      console.log("Groq TTS Speaker config already exists");
    }

    console.log("Groq seed completed successfully!");
    console.log("Created/verified 1 LLM provider (Groq)");
    console.log(
      "Created/verified 2 LLM models (llama3-8b-8192, llama-3.3-70b-versatile)",
    );
    console.log("Created/verified 1 Transcriber provider (Groq)");
    console.log(
      "Created/verified 2 Transcriber models (whisper-large-v3-turbo, whisper-large-v3)",
    );
    console.log("Created/verified 1 STT config (Language)");
    console.log("Created/verified 1 Synthesizer provider (Groq)");
    console.log(
      "Created/verified 2 Synthesizer models (playai-tts, playai-tts-arabic)",
    );
    console.log("Created/verified 1 TTS config (Speaker)");
  }
}
