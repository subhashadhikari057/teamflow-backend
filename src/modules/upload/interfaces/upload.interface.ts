export interface UploadImageResult {
  contentType: string;
  fileName: string;
  mimeType: string;
  optimized: boolean;
  originalName: string;
  relativePath: string;
  size: number;
}

export interface StoredUploadImage {
  buffer: Buffer;
  contentType: string;
}
