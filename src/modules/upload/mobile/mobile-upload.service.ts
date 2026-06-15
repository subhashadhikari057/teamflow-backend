import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { AppException } from '../../../common/exceptions/app.exception';
import type {
  StoredUploadImage,
  UploadImageResult,
} from '../interfaces/upload.interface';
import {
  UPLOAD_ALLOWED_IMAGE_MIME_TYPES,
  UPLOAD_DEFAULT_IMAGE_QUALITY,
  UPLOAD_ERROR_CODES,
} from '../upload.types';
import { UploadImageOptionsDto } from './dto/upload-image-options.dto';

@Injectable()
export class MobileUploadService {
  private readonly uploadDirectory = join(process.cwd(), 'uploads', 'images');

  async uploadSingleImage(
    file: Express.Multer.File | undefined,
    options: UploadImageOptionsDto,
  ): Promise<UploadImageResult> {
    if (!file) {
      throw new AppException(
        UPLOAD_ERROR_CODES.IMAGE_NOT_PROVIDED,
        'Image file is required',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return this.storeImage(file, options.optimize ?? true);
  }

  async uploadMultipleImages(
    files: Express.Multer.File[] | undefined,
    options: UploadImageOptionsDto,
  ): Promise<UploadImageResult[]> {
    if (!files || files.length === 0) {
      throw new AppException(
        UPLOAD_ERROR_CODES.IMAGE_NOT_PROVIDED,
        'At least one image file is required',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return Promise.all(
      files.map((file) => this.storeImage(file, options.optimize ?? true)),
    );
  }

  async getImage(fileName: string): Promise<StoredUploadImage> {
    const filePath = join(this.uploadDirectory, fileName);

    try {
      const buffer = await readFile(filePath);
      const contentType = this.resolveContentType(fileName);

      return {
        buffer,
        contentType,
      };
    } catch {
      throw new AppException(
        UPLOAD_ERROR_CODES.IMAGE_READ_FAILED,
        'Uploaded image not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }
  }

  private async storeImage(
    file: Express.Multer.File,
    optimize: boolean,
  ): Promise<UploadImageResult> {
    this.validateImage(file);
    await mkdir(this.uploadDirectory, { recursive: true });

    try {
      const storedFile = optimize
        ? await this.optimizeImage(file)
        : {
            buffer: file.buffer,
            contentType: file.mimetype,
            extension: this.extensionFromMimeType(file.mimetype),
          };
      const fileName = `${randomUUID()}.${storedFile.extension}`;
      const filePath = join(this.uploadDirectory, fileName);

      await writeFile(filePath, storedFile.buffer);

      return {
        fileName,
        originalName: file.originalname,
        relativePath: `images/${fileName}`,
        contentType: storedFile.contentType,
        mimeType: file.mimetype,
        size: storedFile.buffer.length,
        optimized: optimize,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      throw new AppException(
        UPLOAD_ERROR_CODES.IMAGE_PROCESSING_FAILED,
        'Unable to process uploaded image',
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          details: error instanceof Error ? error.message : undefined,
        },
      );
    }
  }

  private validateImage(file: Express.Multer.File) {
    if (!UPLOAD_ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as never)) {
      throw new AppException(
        UPLOAD_ERROR_CODES.INVALID_IMAGE_TYPE,
        'Only image uploads are supported',
        {
          status: HttpStatus.BAD_REQUEST,
          details: {
            allowedMimeTypes: [...UPLOAD_ALLOWED_IMAGE_MIME_TYPES],
            receivedMimeType: file.mimetype,
          },
        },
      );
    }
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

  private extensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
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
      default:
        return 'bin';
    }
  }

  private resolveContentType(fileName: string): string {
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

    return 'image/webp';
  }
}
