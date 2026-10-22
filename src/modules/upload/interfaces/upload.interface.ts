export interface UploadFileResult {
  contentType: string;
  fileName: string;
  mimeType: string;
  optimized: boolean;
  originalName: string;
  relativePath: string;
  size: number;
}

export interface StoredUploadFile {
  buffer: Buffer;
  contentType: string;
}
