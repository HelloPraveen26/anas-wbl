import { DataSource } from "typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
} from "../../synthesizer/entities";

export class SynthesizerSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const synthesizerProviderRepository =
      dataSource.getRepository(SynthesizerProvider);
    const synthesizerModelRepository =
      dataSource.getRepository(SynthesizerModel);

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

    const sarvamProvider = synthesizerProviderRepository.create({
      name: "Sarvam",
      isActive: true,
    });
    await synthesizerProviderRepository.save(sarvamProvider);

    const sarvamTts1 = synthesizerModelRepository.create({
      name: "bulbul:v2",
      synthesizerProvider: sarvamProvider,
      isActive: true,
    });
    await synthesizerModelRepository.save(sarvamTts1);

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

    // Create Google models
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

    // Create AWS models
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

    // Create Azure models
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

    // Create ElevenLabs models
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

    console.log(
      "Synthesizer providers and models have been seeded successfully!",
    );
    console.log("Created 6 synthesizer providers");
    console.log("Created 11 synthesizer models");
    console.log("Sarvam: 1 model");
    console.log("OpenAI: 2 models");
    console.log("Google: 3 models");
    console.log("AWS: 2 models");
    console.log("Azure: 2 models");
    console.log("ElevenLabs: 3 models");
  }
}
