import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { AppException } from '../../../common/exceptions/app.exception';
import type {
  StoredUploadFile,
  UploadFileResult,
} from '../interfaces/upload.interface';
import {
  UPLOAD_ALLOWED_IMAGE_MIME_TYPES,
  UPLOAD_DEFAULT_IMAGE_QUALITY,
  UPLOAD_FILE_DIRECTORY,
  UPLOAD_ERROR_CODES,
  UPLOAD_IMAGE_DIRECTORY,
} from '../upload.types';
import { UploadImageOptionsDto } from './dto/upload-image-options.dto';

@Injectable()
export class MobileUploadService {
  private readonly rootUploadDirectory = join(process.cwd(), 'uploads');
  private readonly imageUploadDirectory = join(
    this.rootUploadDirectory,
    UPLOAD_IMAGE_DIRECTORY,
  );
  private readonly fileUploadDirectory = join(
    this.rootUploadDirectory,
    UPLOAD_FILE_DIRECTORY,
  );

  async uploadSingleImage(
    file: Express.Multer.File | undefined,
    options: UploadImageOptionsDto,
  ): Promise<UploadFileResult> {
    if (!file) {
      throw new AppException(
        UPLOAD_ERROR_CODES.FILE_NOT_PROVIDED,
        'File is required',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return this.storeFile(file, options.optimize ?? true);
  }

  async uploadMultipleImages(
    files: Express.Multer.File[] | undefined,
    options: UploadImageOptionsDto,
  ): Promise<UploadFileResult[]> {
    if (!files || files.length === 0) {
      throw new AppException(
        UPLOAD_ERROR_CODES.FILE_NOT_PROVIDED,
        'At least one file is required',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return Promise.all(
      files.map((file) => this.storeFile(file, options.optimize ?? true)),
    );
  }

  async getImage(fileName: string): Promise<StoredUploadFile> {
    return this.readStoredFile(this.imageUploadDirectory, fileName);
  }

  async getFile(fileName: string): Promise<StoredUploadFile> {
    return this.readStoredFile(this.fileUploadDirectory, fileName);
  }

  private async readStoredFile(
    directory: string,
    fileName: string,
  ): Promise<StoredUploadFile> {
    const filePath = join(directory, fileName);

    try {
      const buffer = await readFile(filePath);
      const contentType = this.resolveContentType(fileName);

      return {
        buffer,
        contentType,
      };
    } catch {
      throw new AppException(
        UPLOAD_ERROR_CODES.FILE_READ_FAILED,
        'Uploaded file not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }
  }

  private async storeFile(
    file: Express.Multer.File,
    optimize: boolean,
  ): Promise<UploadFileResult> {
    this.validateFile(file);

    try {
      const isImage = this.isImageMimeType(file.mimetype);
      const shouldOptimize = isImage && optimize;
      const storedFile = shouldOptimize
        ? await this.optimizeImage(file)
        : this.prepareOriginalFile(file);
      const directoryName = isImage
        ? UPLOAD_IMAGE_DIRECTORY
        : UPLOAD_FILE_DIRECTORY;
      const directoryPath = isImage
        ? this.imageUploadDirectory
        : this.fileUploadDirectory;

      await mkdir(directoryPath, { recursive: true });

      const fileName = `${randomUUID()}.${storedFile.extension}`;
      const filePath = join(directoryPath, fileName);

      await writeFile(filePath, storedFile.buffer);

      return {
        fileName,
        originalName: file.originalname,
        relativePath: `${directoryName}/${fileName}`,
        contentType: storedFile.contentType,
        mimeType: file.mimetype,
        size: storedFile.buffer.length,
        optimized: shouldOptimize,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      throw new AppException(
        UPLOAD_ERROR_CODES.FILE_PROCESSING_FAILED,
        'Unable to process uploaded file',
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          details: error instanceof Error ? error.message : undefined,
        },
      );
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file.buffer || file.size === 0) {
      throw new AppException(
        UPLOAD_ERROR_CODES.FILE_PROCESSING_FAILED,
        'Uploaded file is empty',
        {
          status: HttpStatus.BAD_REQUEST,
        },
      );
    }
  }

  private prepareOriginalFile(file: Express.Multer.File): {
    buffer: Buffer;
    contentType: string;
    extension: string;
  } {
    return {
      buffer: file.buffer,
      contentType: file.mimetype || 'application/octet-stream',
      extension: this.extensionFromFile(file),
    };
  }

  private async optimizeImage(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    contentType: string;
    extension: string;
  }> {
    const buffer = await sharp(file.buffer)
      .rotate()
      .webp({ quality: UPLOAD_DEFAULT_IMAGE_QUALITY })
      .toBuffer();

    return {
      buffer,
      contentType: 'image/webp',
      extension: 'webp',
    };
  }

  private extensionFromFile(file: Express.Multer.File): string {
    const fileName = file.originalname ?? '';
    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex >= 0 && lastDotIndex < fileName.length - 1) {
      return fileName.slice(lastDotIndex + 1).toLowerCase();
    }

    return this.extensionFromMimeType(file.mimetype);
  }

  private resolveContentType(fileName: string): string {
    if (fileName.endsWith('.pdf')) {
      return 'application/pdf';
    }

    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      return 'image/jpeg';
    }

    if (fileName.endsWith('.png')) {
      return 'image/png';
    }

    if (fileName.endsWith('.gif')) {
      return 'image/gif';
    }

    if (fileName.endsWith('.avif')) {
      return 'image/avif';
    }

    if (fileName.endsWith('.webp')) {
      return 'image/webp';
    }

    if (fileName.endsWith('.txt')) {
      return 'text/plain';
    }

    if (fileName.endsWith('.json')) {
      return 'application/json';
    }

    return 'application/octet-stream';
  }

  private extensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      case 'image/avif':
        return 'avif';
      case 'text/plain':
        return 'txt';
      case 'application/json':
        return 'json';
      default:
        return 'bin';
    }
  }

  private isImageMimeType(mimeType: string): boolean {
    return UPLOAD_ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as never);
  }
}
