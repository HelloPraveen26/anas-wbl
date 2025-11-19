import { DataSource } from "typeorm";
import {
  TranscriberProvider,
  TranscriberModel,
} from "../../transcriber/entities";

export class TranscriberSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const transcriberProviderRepository =
      dataSource.getRepository(TranscriberProvider);
    const transcriberModelRepository =
      dataSource.getRepository(TranscriberModel);

    // Check if providers already exist
    const existingProviders = await transcriberProviderRepository.find();
    if (existingProviders.length > 0) {
      console.log("Transcriber providers already exist, skipping seed...");
      return;
    }

    // Create OpenAI provider
    const openaiProvider = transcriberProviderRepository.create({
      name: "OpenAI",
      isActive: true,
    });
    await transcriberProviderRepository.save(openaiProvider);

    // Create Google provider
    const googleProvider = transcriberProviderRepository.create({
      name: "Google",
      isActive: true,
    });
    await transcriberProviderRepository.save(googleProvider);

    // Create AWS provider
    const awsProvider = transcriberProviderRepository.create({
      name: "AWS",
      isActive: true,
    });
    await transcriberProviderRepository.save(awsProvider);

    // Create Azure provider
    const azureProvider = transcriberProviderRepository.create({
      name: "Azure",
      isActive: true,
    });
    await transcriberProviderRepository.save(azureProvider);

    // Create AssemblyAI provider
    const assemblyAiProvider = transcriberProviderRepository.create({
      name: "AssemblyAI",
      isActive: true,
    });
    await transcriberProviderRepository.save(assemblyAiProvider);

    // Create Deepgram provider
    const deepgramProvider = transcriberProviderRepository.create({
      name: "Deepgram",
      isActive: true,
    });
    await transcriberProviderRepository.save(deepgramProvider);

    const sarvamProvider = transcriberProviderRepository.create({
      name: "Sarvam",
      isActive: true,
    });
    await transcriberProviderRepository.save(sarvamProvider);

    const sarvamModel = transcriberModelRepository.create({
      name: "saarika:v2.5",
      transcriberProvider: sarvamProvider,
      isActive: true,
    });
    await transcriberModelRepository.save(sarvamModel);

    // Create OpenAI models
    const openaiModels = [
      "whisper-1",
      "whisper-large",
      "whisper-large-v2",
      "whisper-large-v3",
    ];

    for (const modelName of openaiModels) {
      const model = transcriberModelRepository.create({
        name: modelName,
        transcriberProvider: openaiProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(model);
    }

    // Create Google models
    const googleModels = [
      "latest_long",
      "latest_short",
      "video",
      "phone_call",
      "command_and_search",
      "default",
    ];

    for (const modelName of googleModels) {
      const model = transcriberModelRepository.create({
        name: modelName,
        transcriberProvider: googleProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(model);
    }

    // Create AWS models
    const awsModels = [
      "standard",
      "medical",
      "call-analytics",
      "streaming",
      "batch",
    ];

    for (const modelName of awsModels) {
      const model = transcriberModelRepository.create({
        name: modelName,
        transcriberProvider: awsProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(model);
    }

    // Create Azure models
    const azureModels = [
      "base",
      "display",
      "conversation",
      "dictation",
      "medical",
    ];

    for (const modelName of azureModels) {
      const model = transcriberModelRepository.create({
        name: modelName,
        transcriberProvider: azureProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(model);
    }

    // Create AssemblyAI models
    const assemblyAiModels = ["best", "nano", "conformer-2", "conformer-1"];

    for (const modelName of assemblyAiModels) {
      const model = transcriberModelRepository.create({
        name: modelName,
        transcriberProvider: assemblyAiProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(model);
    }

    // Create Deepgram models
    const deepgramModels = ["nova-2", "nova", "enhanced", "base", "whisper"];

    for (const modelName of deepgramModels) {
      const model = transcriberModelRepository.create({
        name: modelName,
        transcriberProvider: deepgramProvider,
        isActive: true,
      });
      await transcriberModelRepository.save(model);
    }

    console.log(
      "Transcriber providers and models have been seeded successfully!",
    );
    console.log(`Created ${openaiModels.length} OpenAI models`);
    console.log(`Created ${googleModels.length} Google models`);
    console.log(`Created ${awsModels.length} AWS models`);
    console.log(`Created ${azureModels.length} Azure models`);
    console.log(`Created ${assemblyAiModels.length} AssemblyAI models`);
    console.log(`Created ${deepgramModels.length} Deepgram models`);
  }
}
