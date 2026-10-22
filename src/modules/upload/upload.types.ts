export const UPLOAD_ERROR_CODES = {
  FILE_NOT_PROVIDED: 'UPLOAD_FILE_NOT_PROVIDED',
  FILE_PROCESSING_FAILED: 'UPLOAD_FILE_PROCESSING_FAILED',
  FILE_READ_FAILED: 'UPLOAD_FILE_READ_FAILED',
} as const;

export const UPLOAD_ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export const UPLOAD_DEFAULT_IMAGE_QUALITY = 82;
export const UPLOAD_MAX_FILES = 10;
export const UPLOAD_IMAGE_DIRECTORY = 'images';
export const UPLOAD_FILE_DIRECTORY = 'files';
