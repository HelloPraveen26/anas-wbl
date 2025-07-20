import { DataSource } from "typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
  SynthesizerVoice,
} from "../../synthesizer/entities";

export class SynthesizerSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository = dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository = dataSource.getRepository(SynthesizerModel);
    const synthesizerVoiceRepository = dataSource.getRepository(SynthesizerVoice);

    // Check if providers already exist
    const existingProviders = await synthesizerProviderRepository.find();
    if (existingProviders.length > 0) {
      console.log("Synthesizer providers already exist, skipping seed...");
      return;
    }

    // Create OpenAI provider
    const openaiProvider = synthesizerProviderRepository.create({
      name: "OpenAI",
      isActive: true,
    });
    await synthesizerProviderRepository.save(openaiProvider);

    // Create Google provider
    const googleProvider = synthesizerProviderRepository.create({
      name: "Google",
      isActive: true,
    });
    await synthesizerProviderRepository.save(googleProvider);

    // Create AWS provider
    const awsProvider = synthesizerProviderRepository.create({
      name: "AWS",
      isActive: true,
    });
    await synthesizerProviderRepository.save(awsProvider);

    // Create Azure provider
    const azureProvider = synthesizerProviderRepository.create({
      name: "Azure",
      isActive: true,
    });
    await synthesizerProviderRepository.save(azureProvider);

    // Create ElevenLabs provider
    const elevenlabsProvider = synthesizerProviderRepository.create({
      name: "ElevenLabs",
      isActive: true,
    });
    await synthesizerProviderRepository.save(elevenlabsProvider);

    // Create OpenAI models and voices
    const openaiTts1 = synthesizerModelRepository.create({
      name: "tts-1",
      synthesizerProvider: openaiProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(openaiTts1);

    const openaiTts1Hd = synthesizerModelRepository.create({
      name: "tts-1-hd",
      synthesizerProvider: openaiProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(openaiTts1Hd);

    // OpenAI voices for both models
    const openaiVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    for (const voiceName of openaiVoices) {
      // Add voices for tts-1
      const voice1 = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: openaiTts1,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice1);

      // Add voices for tts-1-hd
      const voice2 = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: openaiTts1Hd,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice2);
    }

    // Create Google models and voices
    const googleStandard = synthesizerModelRepository.create({
      name: "standard",
      synthesizerProvider: googleProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(googleStandard);

    const googleWavenet = synthesizerModelRepository.create({
      name: "wavenet",
      synthesizerProvider: googleProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(googleWavenet);

    const googleNeural2 = synthesizerModelRepository.create({
      name: "neural2",
      synthesizerProvider: googleProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(googleNeural2);

    // Google voices
    const googleVoices = [
      "en-US-Standard-A",
      "en-US-Standard-B",
      "en-US-Standard-C",
      "en-US-Standard-D",
      "en-US-Wavenet-A",
      "en-US-Wavenet-B",
      "en-US-Wavenet-C",
      "en-US-Wavenet-D",
      "en-US-Neural2-A",
      "en-US-Neural2-C",
      "en-US-Neural2-D",
      "en-US-Neural2-F",
    ];

    for (const voiceName of googleVoices) {
      if (voiceName.includes("Standard")) {
        const voice = synthesizerVoiceRepository.create({
          name: voiceName,
          synthesizerModel: googleStandard,
          isActive: true,
        });
        await synthesizerVoiceRepository.save(voice);
      } else if (voiceName.includes("Wavenet")) {
        const voice = synthesizerVoiceRepository.create({
          name: voiceName,
          synthesizerModel: googleWavenet,
          isActive: true,
        });
        await synthesizerVoiceRepository.save(voice);
      } else if (voiceName.includes("Neural2")) {
        const voice = synthesizerVoiceRepository.create({
          name: voiceName,
          synthesizerModel: googleNeural2,
          isActive: true,
        });
        await synthesizerVoiceRepository.save(voice);
      }
    }

    // Create AWS models and voices
    const awsStandard = synthesizerModelRepository.create({
      name: "standard",
      synthesizerProvider: awsProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(awsStandard);

    const awsNeural = synthesizerModelRepository.create({
      name: "neural",
      synthesizerProvider: awsProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(awsNeural);

    // AWS voices
    const awsStandardVoices = [
      "Joanna",
      "Matthew",
      "Amy",
      "Brian",
      "Emma",
      "Aditi",
      "Raveena",
    ];
    const awsNeuralVoices = ["Joanna", "Matthew", "Amy", "Emma"];

    for (const voiceName of awsStandardVoices) {
      const voice = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: awsStandard,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice);
    }

    for (const voiceName of awsNeuralVoices) {
      const voice = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: awsNeural,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice);
    }

    // Create Azure models and voices
    const azureStandard = synthesizerModelRepository.create({
      name: "standard",
      synthesizerProvider: azureProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(azureStandard);

    const azureNeural = synthesizerModelRepository.create({
      name: "neural",
      synthesizerProvider: azureProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(azureNeural);

    // Azure voices
    const azureStandardVoices = ["Aria", "Guy", "Jenny", "Jason"];
    const azureNeuralVoices = [
      "AriaNeural",
      "GuyNeural",
      "JennyNeural",
      "JasonNeural",
      "MichelleNeural",
      "RyanNeural",
    ];

    for (const voiceName of azureStandardVoices) {
      const voice = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: azureStandard,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice);
    }

    for (const voiceName of azureNeuralVoices) {
      const voice = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: azureNeural,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice);
    }

    // Create ElevenLabs models and voices
    const elevenlabsMultilingualV1 = synthesizerModelRepository.create({
      name: "multilingual-v1",
      synthesizerProvider: elevenlabsProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(elevenlabsMultilingualV1);

    const elevenlabsMultilingualV2 = synthesizerModelRepository.create({
      name: "multilingual-v2",
      synthesizerProvider: elevenlabsProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(elevenlabsMultilingualV2);

    const elevenlabsEnglishV1 = synthesizerModelRepository.create({
      name: "english-v1",
      synthesizerProvider: elevenlabsProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(elevenlabsEnglishV1);

    // ElevenLabs voices
    const elevenlabsVoices = [
      "Rachel",
      "Drew",
      "Clyde",
      "Paul",
      "Domi",
      "Dave",
      "Fin",
      "Sarah",
      "Antoni",
      "Thomas",
    ];

    for (const voiceName of elevenlabsVoices) {
      // Add voices for multilingual-v1
      const voice1 = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: elevenlabsMultilingualV1,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice1);

      // Add voices for multilingual-v2
      const voice2 = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: elevenlabsMultilingualV2,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice2);

      // Add voices for english-v1
      const voice3 = synthesizerVoiceRepository.create({
        name: voiceName,
        synthesizerModel: elevenlabsEnglishV1,
        isActive: true,
      });
      await synthesizerVoiceRepository.save(voice3);
    }

    console.log("Synthesizer providers, models, and voices have been seeded successfully!");
    console.log("Created 5 synthesizer providers");
    console.log("Created 10 synthesizer models");
    console.log("OpenAI: 2 models with 12 voices total");
    console.log("Google: 3 models with 12 voices total");
    console.log("AWS: 2 models with 11 voices total");
    console.log("Azure: 2 models with 10 voices total");
    console.log("ElevenLabs: 3 models with 30 voices total");
    console.log("Total: 75 synthesizer voices created");
  }
}
