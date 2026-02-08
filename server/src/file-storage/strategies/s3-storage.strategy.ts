import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageStrategy } from "./storage-strategy.interface";

@Injectable()
export class S3StorageStrategy implements StorageStrategy {
  private readonly bucketName: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    // Only load configuration, don't validate yet
    // Validation happens when methods are called
    const storageType = this.configService.get<string>("STORAGE_TYPE", "local");

    if (storageType === "s3") {
      this.bucketName = this.configService.get<string>("AWS_S3_BUCKET");
      this.region = this.configService.get<string>("AWS_S3_REGION");
      this.accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID");
      this.secretAccessKey = this.configService.get<string>(
        "AWS_SECRET_ACCESS_KEY",
      );

      if (!this.bucketName || !this.region) {
        throw new Error(
          "S3 configuration is incomplete. Please check AWS_S3_BUCKET and AWS_S3_REGION environment variables.",
        );
      }
      this.isConfigured = true;
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new InternalServerErrorException(
        "S3 storage is not configured. Please set STORAGE_TYPE=s3 and configure AWS credentials.",
      );
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
    subdirectory?: string,
  ): Promise<string> {
    this.ensureConfigured();
    try {
      // Create S3 key with subdirectory if provided
      const s3Key = subdirectory ? `${subdirectory}/${filename}` : filename;

      // TODO: Implement AWS S3 SDK upload
      // This is a placeholder that will be implemented when AWS SDK is installed
      //
      // Example implementation:
      // const s3 = new S3Client({
      //   region: this.region,
      //   credentials: {
      //     accessKeyId: this.accessKeyId,
      //     secretAccessKey: this.secretAccessKey,
      //   },
      // });
      //
      // const command = new PutObjectCommand({
      //   Bucket: this.bucketName,
      //   Key: s3Key,
      //   Body: file,
      //   ContentType: mimetype,
      // });
      //
      // await s3.send(command);
      // return s3Key;

      throw new InternalServerErrorException(
        "S3 storage is not yet implemented. Please install @aws-sdk/client-s3 and implement upload logic.",
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${error.message}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureConfigured();
    try {
      // TODO: Implement AWS S3 SDK delete
      //
      // Example implementation:
      // const s3 = new S3Client({
      //   region: this.region,
      //   credentials: {
      //     accessKeyId: this.accessKeyId,
      //     secretAccessKey: this.secretAccessKey,
      //   },
      // });
      //
      // const command = new DeleteObjectCommand({
      //   Bucket: this.bucketName,
      //   Key: key,
      // });
      //
      // await s3.send(command);

      throw new InternalServerErrorException(
        "S3 storage is not yet implemented. Please install @aws-sdk/client-s3 and implement delete logic.",
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file from S3: ${error.message}`,
      );
    }
  }

  async get(key: string): Promise<Buffer> {
    this.ensureConfigured();
    try {
      // TODO: Implement AWS S3 SDK get
      //
      // Example implementation:
      // const s3 = new S3Client({
      //   region: this.region,
      //   credentials: {
      //     accessKeyId: this.accessKeyId,
      //     secretAccessKey: this.secretAccessKey,
      //   },
      // });
      //
      // const command = new GetObjectCommand({
      //   Bucket: this.bucketName,
      //   Key: key,
      // });
      //
      // const response = await s3.send(command);
      // const stream = response.Body as Readable;
      // const chunks: Buffer[] = [];
      //
      // for await (const chunk of stream) {
      //   chunks.push(chunk);
      // }
      //
      // return Buffer.concat(chunks);

      throw new InternalServerErrorException(
        "S3 storage is not yet implemented. Please install @aws-sdk/client-s3 and implement get logic.",
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get file from S3: ${error.message}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    this.ensureConfigured();
    try {
      // TODO: Implement AWS S3 SDK head object
      //
      // Example implementation:
      // const s3 = new S3Client({
      //   region: this.region,
      //   credentials: {
      //     accessKeyId: this.accessKeyId,
      //     secretAccessKey: this.secretAccessKey,
      //   },
      // });
      //
      // const command = new HeadObjectCommand({
      //   Bucket: this.bucketName,
      //   Key: key,
      // });
      //
      // try {
      //   await s3.send(command);
      //   return true;
      // } catch (error) {
      //   if (error.name === 'NotFound') {
      //     return false;
      //   }
      //   throw error;
      // }

      throw new InternalServerErrorException(
        "S3 storage is not yet implemented. Please install @aws-sdk/client-s3 and implement exists logic.",
      );
    } catch (error) {
      return false;
    }
  }

  getStorageType(): string {
    return "s3";
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
