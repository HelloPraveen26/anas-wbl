import { DataSource } from "typeorm";
import { LlmProvider, LlmModel } from "../../llm/entities";

export class LlmSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const llmProviderRepository = dataSource.getRepository(LlmProvider);
    const llmModelRepository = dataSource.getRepository(LlmModel);

    // Check if providers already exist
    const existingProviders = await llmProviderRepository.find();
    if (existingProviders.length > 0) {
      console.log("LLM providers already exist, skipping seed...");
      return;
    }

    // Create OpenAI provider
    const openaiProvider = llmProviderRepository.create({
      name: "OpenAI",
      isActive: true,
    });
    await llmProviderRepository.save(openaiProvider);

    // Create Anthropic provider
    const anthropicProvider = llmProviderRepository.create({
      name: "Anthropic",
      isActive: true,
    });
    await llmProviderRepository.save(anthropicProvider);

    // Create OpenAI models
    const openaiModels = [
      "gpt-4",
      "gpt-4-turbo",
      "gpt-4-turbo-preview",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
    ];

    for (const modelName of openaiModels) {
      const model = llmModelRepository.create({
        name: modelName,
        llmProvider: openaiProvider,
        isActive: true,
      });
      await llmModelRepository.save(model);
    }

    // Create Anthropic models
    const anthropicModels = [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-2.1",
      "claude-2.0",
      "claude-instant-1.2",
    ];

    for (const modelName of anthropicModels) {
      const model = llmModelRepository.create({
        name: modelName,
        llmProvider: anthropicProvider,
        isActive: true,
      });
      await llmModelRepository.save(model);
    }

    console.log("LLM providers and models have been seeded successfully!");
    console.log(`Created ${openaiModels.length} OpenAI models`);
    console.log(`Created ${anthropicModels.length} Anthropic models`);
  }
}
