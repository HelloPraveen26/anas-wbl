import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { File } from "./entities/file.entity";
import { FileStorageService } from "./file-storage.service";
import { LocalStorageStrategy } from "./strategies/local-storage.strategy";
import { S3StorageStrategy } from "./strategies/s3-storage.strategy";

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  providers: [
    FileStorageService,
    LocalStorageStrategy,
    {
      provide: S3StorageStrategy,
      useFactory: (configService: ConfigService) => {
        // Only instantiate S3 strategy if storage type is 's3'
        const storageType = configService.get<string>("STORAGE_TYPE", "local");
        if (storageType === "s3") {
          return new S3StorageStrategy(configService);
        }
        // Return a dummy instance that won't be used
        return null;
      },
      inject: [ConfigService],
    },
  ],
  exports: [TypeOrmModule, FileStorageService],
})
export class FileStorageModule {}
