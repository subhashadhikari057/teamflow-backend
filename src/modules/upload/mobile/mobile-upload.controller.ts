import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UPLOAD_MAX_FILES } from '../upload.types';
import { MobileImageUploadResponseDto } from './dto/mobile-image-upload-response.dto';
import { MobileMultipleImageUploadResponseDto } from './dto/mobile-multiple-image-upload-response.dto';
import { UploadImageFileNameParamDto } from './dto/upload-image-file-name-param.dto';
import { UploadImageOptionsDto } from './dto/upload-image-options.dto';
import { MobileUploadService } from './mobile-upload.service';

@ApiTags('Mobile — Upload')
@Public()
@UseGuards(JwtAuthGuard)
@Controller('mobile/upload')
export class MobileUploadController {
  constructor(private readonly mobileUploadService: MobileUploadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiQuery({
    name: 'optimize',
    required: false,
    type: Boolean,
    description: 'Optimize the uploaded image before saving',
    example: true,
  })
  @ApiResponse({ status: 201, type: MobileImageUploadResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 422, description: 'Image processing failed' })
  uploadSingleImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() dto: UploadImageOptionsDto,
  ): Promise<MobileImageUploadResponseDto> {
    return this.mobileUploadService.uploadSingleImage(file, dto);
  }

  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          description: 'Image files to upload',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiQuery({
    name: 'optimize',
    required: false,
    type: Boolean,
    description: 'Optimize the uploaded images before saving',
    example: true,
  })
  @ApiResponse({ status: 201, type: MobileMultipleImageUploadResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 422, description: 'Image processing failed' })
  uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Query() dto: UploadImageOptionsDto,
  ): Promise<MobileMultipleImageUploadResponseDto> {
    return this.mobileUploadService
      .uploadMultipleImages(files, dto)
      .then((items) => ({
        items,
      }));
  }

  @Get('images/:fileName')
  @ApiOperation({ summary: 'Read an uploaded image' })
  @ApiParam({
    name: 'fileName',
    description: 'Stored image file name',
    example: '0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @ApiResponse({ status: 200, description: 'Uploaded image stream' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImage(
    @Param() params: UploadImageFileNameParamDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const image = await this.mobileUploadService.getImage(params.fileName);
    response.setHeader('Content-Type', image.contentType);

    return new StreamableFile(image.buffer);
  }
}
