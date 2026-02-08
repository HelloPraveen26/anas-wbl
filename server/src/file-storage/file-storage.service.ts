import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { File } from "./entities/file.entity";
import { StorageStrategy } from "./strategies/storage-strategy.interface";
import { LocalStorageStrategy } from "./strategies/local-storage.strategy";
import { S3StorageStrategy } from "./strategies/s3-storage.strategy";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class FileStorageService {
  private readonly storageStrategy: StorageStrategy;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly configService: ConfigService,
    private readonly localStorageStrategy: LocalStorageStrategy,
    private readonly s3StorageStrategy: S3StorageStrategy | null,
  ) {
    // Determine storage strategy based on configuration
    const storageType = this.configService.get<string>("STORAGE_TYPE", "local");

    if (storageType === "s3") {
      if (!this.s3StorageStrategy) {
        throw new BadRequestException(
          "S3 storage is not configured. Please check your environment variables.",
        );
      }
      this.storageStrategy = this.s3StorageStrategy;
    } else {
      this.storageStrategy = this.localStorageStrategy;
    }

    // Max file size: 1MB by default
    this.maxFileSize =
      this.configService.get<number>("MAX_FILE_SIZE") || 1024 * 1024;

    // Allowed MIME types (excluding audio and video)
    this.allowedMimeTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Text
      "text/plain",
      "text/csv",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "application/xml",
      "text/xml",
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      // Archives
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ];
  }

  /**
   * Upload a file and store its metadata
   */
  async uploadFile(
    file: Express.Multer.File,
    assistantId: string,
  ): Promise<File> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type (exclude audio and video)
    if (!this.isAllowedMimeType(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Audio and video files are not supported.`,
      );
    }

    // Use original filename and organize by assistant ID
    let storedName = file.originalname;

    // Check if file with same name already exists for this assistant
    const existingFile = await this.fileRepository.findOne({
      where: {
        assistantId: assistantId,
        originalName: file.originalname,
        isActive: true,
      },
    });

    // If duplicate exists, append timestamp to make it unique
    if (existingFile) {
      const fileExtension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, fileExtension);
      const timestamp = Date.now();
      storedName = `${baseName}_${timestamp}${fileExtension}`;
    }

    // Upload to storage with assistant ID as subdirectory
    const filePath = await this.storageStrategy.upload(
      file.buffer,
      storedName,
      file.mimetype,
      assistantId,
    );

    // Create file metadata record
    const fileMetadata = this.fileRepository.create({
      originalName: file.originalname,
      storedName: storedName,
      filePath: filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageType: this.storageStrategy.getStorageType(),
      assistantId: assistantId,
      s3Key:
        this.storageStrategy.getStorageType() === "s3"
          ? `${assistantId}/${storedName}`
          : null,
      s3Bucket:
        this.storageStrategy.getStorageType() === "s3"
          ? (this.s3StorageStrategy as any).getBucketName()
          : null,
      isActive: true,
    });

    return await this.fileRepository.save(fileMetadata);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    assistantId: string,
  ): Promise<File[]> {
    const uploadedFiles: File[] = [];

    for (const file of files) {
      const uploadedFile = await this.uploadFile(file, assistantId);
      uploadedFiles.push(uploadedFile);
    }

    return uploadedFiles;
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string, assistantId?: string): Promise<File> {
    const where: any = { id: fileId, isActive: true };
    if (assistantId) {
      where.assistantId = assistantId;
    }

    const file = await this.fileRepository.findOne({ where });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    return file;
  }

  /**
   * Get all files for an assistant
   */
  async getFilesByAssistantId(assistantId: string): Promise<File[]> {
    return await this.fileRepository.find({
      where: { assistantId, isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, assistantId?: string): Promise<void> {
    const file = await this.getFileById(fileId, assistantId);

    // Delete from storage
    try {
      await this.storageStrategy.delete(file.filePath);
    } catch (error) {
      // Log error but continue with database deletion
      console.error(`Failed to delete file from storage: ${error.message}`);
    }

    // Soft delete from database
    await this.fileRepository.update(fileId, { isActive: false });
  }

  /**
   * Delete all files for an assistant
   */
  async deleteFilesByAssistantId(assistantId: string): Promise<void> {
    const files = await this.getFilesByAssistantId(assistantId);

    for (const file of files) {
      await this.deleteFile(file.id);
    }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string, assistantId?: string): Promise<Buffer> {
    const file = await this.getFileById(fileId, assistantId);
    return await this.storageStrategy.get(file.filePath);
  }

  /**
   * Check if MIME type is allowed
   */
  private isAllowedMimeType(mimetype: string): boolean {
    // Explicitly reject audio and video files
    if (mimetype.startsWith("audio/") || mimetype.startsWith("video/")) {
      return false;
    }

    return this.allowedMimeTypes.includes(mimetype);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(assistantId: string): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    const files = await this.getFilesByAssistantId(assistantId);

    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
    };
  }
}
