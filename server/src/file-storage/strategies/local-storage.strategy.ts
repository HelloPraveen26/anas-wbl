import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageStrategy } from "./storage-strategy.interface";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class LocalStorageStrategy implements StorageStrategy {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    // Get upload directory from config or use default
    this.uploadDir =
      this.configService.get<string>("FILE_UPLOAD_DIR") ||
      path.join(process.cwd(), "uploads");

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
    subdirectory?: string,
  ): Promise<string> {
    try {
      await this.ensureUploadDir();

      // Create subdirectory if provided (e.g., assistantId)
      let targetDir = this.uploadDir;
      if (subdirectory) {
        targetDir = path.join(this.uploadDir, subdirectory);
        await fs.mkdir(targetDir, { recursive: true });
      }

      const relativePath = subdirectory
        ? path.join(subdirectory, filename)
        : filename;
      const fullPath = path.join(this.uploadDir, relativePath);
      await fs.writeFile(fullPath, file);

      // Return relative path from upload directory
      return relativePath;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      // Silently fail if file doesn't exist
      if (error.code !== "ENOENT") {
        throw new InternalServerErrorException(
          `Failed to delete file: ${error.message}`,
        );
      }
    }
  }

  async get(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to read file: ${error.message}`,
      );
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getStorageType(): string {
    return "local";
  }
}
