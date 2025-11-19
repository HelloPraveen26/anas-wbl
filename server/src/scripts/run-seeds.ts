import { AppDataSource } from "../database/data-source";
import { LlmSeed } from "../database/seeds/llm-seed";
import { TranscriberSeed } from "../database/seeds/transcriber-seed";
import { SttConfigSeed } from "../database/seeds/sarvam-stt-config-seed";
import { SynthesizerSeed } from "../database/seeds/synthesizer-seed";
import { RegisteredNumbersSeed } from "../database/seeds/registered-numbers-seed";
import { ContactNumbersSeed } from "../database/seeds/contact-numbers-seed";
import { TtsConfigSeed } from "../database/seeds/sarvam-tts-config-seed";

async function runSeeds() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();
    console.log("Database connection established.");

    console.log("Running LLM seed...");
    const llmSeed = new LlmSeed();
    await llmSeed.run(AppDataSource);

    console.log("Running Transcriber seed...");
    const transcriberSeed = new TranscriberSeed();
    await transcriberSeed.run(AppDataSource);

    console.log("Running STT Config seed...");
    const sttConfigSeed = new SttConfigSeed();
    await sttConfigSeed.run(AppDataSource);

    console.log("Running Synthesizer seed...");
    const synthesizerSeed = new SynthesizerSeed();
    await synthesizerSeed.run(AppDataSource);

    console.log("Running TTS Config seed...");
    const ttsConfigSeed = new TtsConfigSeed();
    await ttsConfigSeed.run(AppDataSource);

    console.log("Running Registered Numbers seed...");
    const registeredNumbersSeed = new RegisteredNumbersSeed();
    await registeredNumbersSeed.run(AppDataSource);

    console.log("Running Contact Numbers seed...");
    const contactNumbersSeed = new ContactNumbersSeed();
    await contactNumbersSeed.run(AppDataSource);

    console.log("All seeds completed successfully!");
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("Database connection closed.");
  }
}

runSeeds();
