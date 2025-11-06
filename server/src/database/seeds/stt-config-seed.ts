import { DataSource } from "typeorm";
import { TranscriberProvider, SttConfig, ConfigFieldType } from "../../transcriber/entities";

export class SttConfigSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const transcriberProviderRepository = dataSource.getRepository(TranscriberProvider);
    const sttConfigRepository = dataSource.getRepository(SttConfig);

    // Check if STT configs already exist
    const existingConfigs = await sttConfigRepository.find();
    if (existingConfigs.length > 0) {
      console.log("STT configs already exist, skipping seed...");
      return;
    }

    // Get all transcriber providers
    const providers = await transcriberProviderRepository.find({
      where: { isActive: true }
    });

    if (providers.length === 0) {
      console.log("No transcriber providers found. Please run transcriber seed first.");
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
      { displayName: "Arabic", value: "ar-SA" }
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

      // Add provider-specific configs
      switch (provider.name.toLowerCase()) {
        case 'openai':
          // Temperature config for OpenAI
          const temperatureConfig = sttConfigRepository.create({
            label: "Temperature",
            key: "temperature",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "0",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(temperatureConfig);
          totalConfigsCreated++;

          // Prompt config for OpenAI
          const promptConfig = sttConfigRepository.create({
            label: "Prompt",
            key: "prompt",
            type: ConfigFieldType.STRING,
            list: null,
            defaultValue: "",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(promptConfig);
          totalConfigsCreated++;
          break;

        case 'google':
          // Enhanced Models config for Google
          const enhancedConfig = sttConfigRepository.create({
            label: "Use Enhanced Models",
            key: "useEnhanced",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "false",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(enhancedConfig);
          totalConfigsCreated++;

          // Audio Encoding config for Google
          const encodingOptions = [
            { displayName: "Linear PCM", value: "LINEAR16" },
            { displayName: "FLAC", value: "FLAC" },
            { displayName: "mulaw", value: "MULAW" },
            { displayName: "AMR", value: "AMR" },
            { displayName: "AMR_WB", value: "AMR_WB" },
            { displayName: "OGG_OPUS", value: "OGG_OPUS" },
            { displayName: "MP3", value: "MP3" },
          ];

          const encodingConfig = sttConfigRepository.create({
            label: "Audio Encoding",
            key: "encoding",
            type: ConfigFieldType.SELECT,
            list: encodingOptions,
            defaultValue: "LINEAR16",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(encodingConfig);
          totalConfigsCreated++;
          break;

        case 'aws':
          // Vocabulary Name config for AWS
          const vocabularyConfig = sttConfigRepository.create({
            label: "Custom Vocabulary Name",
            key: "vocabularyName",
            type: ConfigFieldType.STRING,
            list: null,
            defaultValue: "",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(vocabularyConfig);
          totalConfigsCreated++;

          // Channel Identification config for AWS
          const channelConfig = sttConfigRepository.create({
            label: "Enable Channel Identification",
            key: "channelIdentification",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "false",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(channelConfig);
          totalConfigsCreated++;
          break;

        case 'azure':
          // Profanity Filter config for Azure
          const profanityOptions = [
            { displayName: "None", value: "None" },
            { displayName: "Removed", value: "Removed" },
            { displayName: "Tags", value: "Tags" },
            { displayName: "Masked", value: "Masked" }
          ];

          const profanityConfig = sttConfigRepository.create({
            label: "Profanity Filter",
            key: "profanityFilter",
            type: ConfigFieldType.SELECT,
            list: profanityOptions,
            defaultValue: "None",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(profanityConfig);
          totalConfigsCreated++;

          // Word Level Timestamps config for Azure
          const timestampsConfig = sttConfigRepository.create({
            label: "Enable Word Level Timestamps",
            key: "wordLevelTimestamps",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "false",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(timestampsConfig);
          totalConfigsCreated++;
          break;

        case 'assemblyai':
          // Speaker Labels config for AssemblyAI
          const speakerLabelsConfig = sttConfigRepository.create({
            label: "Enable Speaker Labels",
            key: "speakerLabels",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "false",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(speakerLabelsConfig);
          totalConfigsCreated++;

          // Auto Punctuation config for AssemblyAI
          const punctuationConfig = sttConfigRepository.create({
            label: "Auto Punctuation",
            key: "punctuate",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "true",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(punctuationConfig);
          totalConfigsCreated++;
          break;

        case 'deepgram':
          // Smart Format config for Deepgram
          const smartFormatConfig = sttConfigRepository.create({
            label: "Smart Format",
            key: "smartFormat",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "true",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(smartFormatConfig);
          totalConfigsCreated++;

          // Diarize config for Deepgram
          const diarizeConfig = sttConfigRepository.create({
            label: "Enable Diarization",
            key: "diarize",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "false",
            active: true,
            transcriberProvider: provider,
          });
          await sttConfigRepository.save(diarizeConfig);
          totalConfigsCreated++;
          break;
      }
    }

    console.log("STT configs have been seeded successfully!");
    console.log(`Created ${totalConfigsCreated} STT configs across ${providers.length} providers`);
  }
}
