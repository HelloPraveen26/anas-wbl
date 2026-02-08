export interface StorageStrategy {
  /**
   * Upload a file to storage
   * @param file - The file buffer to upload
   * @param filename - The name to store the file as
   * @param mimetype - The MIME type of the file
   * @returns The path or key where the file is stored
   */
  upload(file: Buffer, filename: string, mimetype: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param path - The path or key of the file to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Get a file from storage
   * @param path - The path or key of the file to retrieve
   * @returns The file buffer
   */
  get(path: string): Promise<Buffer>;

  /**
   * Check if a file exists in storage
   * @param path - The path or key of the file to check
   * @returns True if the file exists, false otherwise
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get the storage type identifier
   * @returns The storage type ('local' or 's3')
   */
  getStorageType(): string;
}
