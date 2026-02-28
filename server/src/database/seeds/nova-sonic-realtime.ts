import { DataSource } from "typeorm";
import {
  RealtimeProvider,
  RealtimeModel,
  RealtimeConfig,
  ConfigFieldType,
} from "../../realtime/entities";

export class NovaSonicSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const realtimeProviderRepository =
      dataSource.getRepository(RealtimeProvider);
    const realtimeModelRepository = dataSource.getRepository(RealtimeModel);
    const realtimeConfigRepository = dataSource.getRepository(RealtimeConfig);

    // Check if Nova Sonic provider already exists
    const existingProvider = await realtimeProviderRepository.findOne({
      where: { name: "Nova Sonic" },
    });

    if (existingProvider) {
      console.log("Nova Sonic provider already exists, skipping seed...");
      return;
    }

    // Create Nova Sonic provider
    const novaSonicRealtimeProvider = realtimeProviderRepository.create({
      name: "Nova Sonic",
      isActive: true,
    });
    await realtimeProviderRepository.save(novaSonicRealtimeProvider);
    console.log("Nova Sonic provider created successfully!");

    // Create Nova Sonic models
    const modelNames = ["amazon.nova-2-sonic-v1:0"];

    const createdModels = [];
    for (const modelName of modelNames) {
      const novaSonicModel = realtimeModelRepository.create({
        name: modelName,
        realtimeProvider: novaSonicRealtimeProvider,
        isActive: true,
      });
      await realtimeModelRepository.save(novaSonicModel);
      createdModels.push(novaSonicModel);
      console.log(`Nova Sonic model '${modelName}' created successfully!`);
    }

    // Voice options for select type
    const voiceOptions = [
      { displayName: "Tiffany", value: "tiffany" },
      { displayName: "Matthew", value: "matthew" },
    ];

    // Create Voice config
    const voiceConfig = realtimeConfigRepository.create({
      label: "Voice",
      key: "voice",
      type: ConfigFieldType.SELECT,
      list: voiceOptions,
      defaultValue: "tiffany",
      active: true,
      realtimeProvider: novaSonicRealtimeProvider,
    });
    await realtimeConfigRepository.save(voiceConfig);
    console.log("Voice config created successfully!");

    // Turn detection options
    const turnDetectionOptions = [
      { displayName: "MEDIUM", value: "MEDIUM" },
      { displayName: "HIGH", value: "HIGH" },
      { displayName: "LOW", value: "LOW" },
    ];

    // Create Turn Detection config
    const turnDetectionConfig = realtimeConfigRepository.create({
      label: "Turn Detection",
      key: "turn_detection",
      type: ConfigFieldType.SELECT,
      list: turnDetectionOptions,
      defaultValue: "MEDIUM",
      active: true,
      realtimeProvider: novaSonicRealtimeProvider,
    });
    await realtimeConfigRepository.save(turnDetectionConfig);
    console.log("Turn Detection config created successfully!");

    // Region options
    const regionOptions = [
      { displayName: "us-east-1", value: "us-east-1" },
      { displayName: "ap-northeast-1", value: "ap-northeast-1" },
    ];

    // Create Region config
    const regionConfig = realtimeConfigRepository.create({
      label: "Region",
      key: "region",
      type: ConfigFieldType.SELECT,
      list: regionOptions,
      defaultValue: "ap-northeast-1",
      active: true,
      realtimeProvider: novaSonicRealtimeProvider,
    });
    await realtimeConfigRepository.save(regionConfig);
    console.log("Region config created successfully!");

    console.log("Nova Sonic configs have been seeded successfully!");
    console.log("Created 1 realtime provider (Nova Sonic)");
    console.log(`Created ${modelNames.length} realtime model(s)`);
    console.log("Created 3 realtime configs (Voice, Turn Detection, Region)");
  }
}
