import { DataSource } from "typeorm";
import { SynthesizerProvider, TtsConfig, ConfigFieldType } from "../../synthesizer/entities";

export class TtsConfigSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository = dataSource.getRepository(SynthesizerProvider);
    const ttsConfigRepository = dataSource.getRepository(TtsConfig);

    // Check if TTS configs already exist
    const existingConfigs = await ttsConfigRepository.find();
    if (existingConfigs.length > 0) {
      console.log("TTS configs already exist, skipping seed...");
      return;
    }

    // Get all synthesizer providers
    const providers = await synthesizerProviderRepository.find({
      where: { isActive: true }
    });

    if (providers.length === 0) {
      console.log("No synthesizer providers found. Please run synthesizer seed first.");
      return;
    }

    // Speaker options for select type
    const speakerOptions = [
      { displayName: "Anushka(F)", value: "anushka" },
      { displayName: "Manisha(F)", value: "manisha" },
      { displayName: "Abhilash(M)", value: "abhilash" },
      { displayName: "Karun(M)", value: "karun" },
    ];

    let totalConfigsCreated = 0;

    // Create speaker config for each provider
    for (const provider of providers) {
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
      totalConfigsCreated++;

      // Add provider-specific configs
      switch (provider.name.toLowerCase()) {
        case 'openai':
          // Speed config for OpenAI
          const speedConfig = ttsConfigRepository.create({
            label: "Speed",
            key: "speed",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "1.0",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(speedConfig);
          totalConfigsCreated++;

          // Response format config for OpenAI
          const responseFormatOptions = [
            { displayName: "MP3", value: "mp3" },
            { displayName: "Opus", value: "opus" },
            { displayName: "AAC", value: "aac" },
            { displayName: "FLAC", value: "flac" },
          ];

          const responseFormatConfig = ttsConfigRepository.create({
            label: "Response Format",
            key: "responseFormat",
            type: ConfigFieldType.SELECT,
            list: responseFormatOptions,
            defaultValue: "mp3",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(responseFormatConfig);
          totalConfigsCreated++;
          break;

        case 'google':
          // Audio encoding config for Google
          const audioEncodingOptions = [
            { displayName: "Linear PCM", value: "LINEAR16" },
            { displayName: "MP3", value: "MP3" },
            { displayName: "OGG Opus", value: "OGG_OPUS" },
          ];

          const audioEncodingConfig = ttsConfigRepository.create({
            label: "Audio Encoding",
            key: "audioEncoding",
            type: ConfigFieldType.SELECT,
            list: audioEncodingOptions,
            defaultValue: "MP3",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(audioEncodingConfig);
          totalConfigsCreated++;

          // Speaking rate config for Google
          const speakingRateConfig = ttsConfigRepository.create({
            label: "Speaking Rate",
            key: "speakingRate",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "1.0",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(speakingRateConfig);
          totalConfigsCreated++;

          // Pitch config for Google
          const pitchConfig = ttsConfigRepository.create({
            label: "Pitch",
            key: "pitch",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "0.0",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(pitchConfig);
          totalConfigsCreated++;
          break;

        case 'aws':
          // Output format config for AWS
          const outputFormatOptions = [
            { displayName: "JSON", value: "json" },
            { displayName: "MP3", value: "mp3" },
            { displayName: "OGG Vorbis", value: "ogg_vorbis" },
            { displayName: "PCM", value: "pcm" },
          ];

          const outputFormatConfig = ttsConfigRepository.create({
            label: "Output Format",
            key: "outputFormat",
            type: ConfigFieldType.SELECT,
            list: outputFormatOptions,
            defaultValue: "mp3",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(outputFormatConfig);
          totalConfigsCreated++;

          // Engine config for AWS
          const engineOptions = [
            { displayName: "Standard", value: "standard" },
            { displayName: "Neural", value: "neural" },
          ];

          const engineConfig = ttsConfigRepository.create({
            label: "Engine",
            key: "engine",
            type: ConfigFieldType.SELECT,
            list: engineOptions,
            defaultValue: "standard",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(engineConfig);
          totalConfigsCreated++;

          // Sample rate config for AWS
          const sampleRateConfig = ttsConfigRepository.create({
            label: "Sample Rate",
            key: "sampleRate",
            type: ConfigFieldType.STRING,
            list: null,
            defaultValue: "22050",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(sampleRateConfig);
          totalConfigsCreated++;
          break;

        case 'azure':
          // Output format config for Azure
          const azureOutputFormatOptions = [
            { displayName: "Audio 16khz 32kbitrate Mono Mp3", value: "audio-16khz-32kbitrate-mono-mp3" },
            { displayName: "Audio 16khz 64kbitrate Mono Mp3", value: "audio-16khz-64kbitrate-mono-mp3" },
            { displayName: "Audio 16khz 128kbitrate Mono Mp3", value: "audio-16khz-128kbitrate-mono-mp3" },
            { displayName: "Raw 16khz 16bit Mono PCM", value: "raw-16khz-16bit-mono-pcm" },
          ];

          const azureOutputFormatConfig = ttsConfigRepository.create({
            label: "Output Format",
            key: "outputFormat",
            type: ConfigFieldType.SELECT,
            list: azureOutputFormatOptions,
            defaultValue: "audio-16khz-128kbitrate-mono-mp3",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(azureOutputFormatConfig);
          totalConfigsCreated++;

          // Speaking rate config for Azure
          const azureSpeakingRateConfig = ttsConfigRepository.create({
            label: "Speaking Rate",
            key: "speakingRate",
            type: ConfigFieldType.STRING,
            list: null,
            defaultValue: "medium",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(azureSpeakingRateConfig);
          totalConfigsCreated++;

          // Pitch config for Azure
          const azurePitchConfig = ttsConfigRepository.create({
            label: "Pitch",
            key: "pitch",
            type: ConfigFieldType.STRING,
            list: null,
            defaultValue: "medium",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(azurePitchConfig);
          totalConfigsCreated++;
          break;

        case 'elevenlabs':
          // Stability config for ElevenLabs
          const stabilityConfig = ttsConfigRepository.create({
            label: "Stability",
            key: "stability",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "0.5",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(stabilityConfig);
          totalConfigsCreated++;

          // Similarity boost config for ElevenLabs
          const similarityBoostConfig = ttsConfigRepository.create({
            label: "Similarity Boost",
            key: "similarityBoost",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "0.5",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(similarityBoostConfig);
          totalConfigsCreated++;

          // Style config for ElevenLabs
          const styleConfig = ttsConfigRepository.create({
            label: "Style",
            key: "style",
            type: ConfigFieldType.NUMBER,
            list: null,
            defaultValue: "0.0",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(styleConfig);
          totalConfigsCreated++;

          // Use speaker boost config for ElevenLabs
          const useSpeakerBoostConfig = ttsConfigRepository.create({
            label: "Use Speaker Boost",
            key: "useSpeakerBoost",
            type: ConfigFieldType.BOOLEAN,
            list: null,
            defaultValue: "true",
            active: true,
            synthesizerProvider: provider,
          });
          await ttsConfigRepository.save(useSpeakerBoostConfig);
          totalConfigsCreated++;
          break;
      }
    }

    console.log("TTS configs have been seeded successfully!");
    console.log(`Created ${totalConfigsCreated} TTS configs across ${providers.length} providers`);
  }
}
