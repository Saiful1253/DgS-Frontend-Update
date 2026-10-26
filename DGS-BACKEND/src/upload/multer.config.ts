// import { BadRequestException } from '@nestjs/common';
// import { memoryStorage } from 'multer';

// /**
//  * Multer config — stores files in memory (buffer).
//  * Files are piped directly to Cloudinary, never written to disk.
//  */
// export const multerConfig = {
//   storage: memoryStorage(),

//   limits: {
//     fileSize: 5 * 1024 * 1024,  // 5MB per file
//     files: 10,                   // max 10 files per request
//   },

//   fileFilter: (
//     _req: any,
//     file: Express.Multer.File,
//     callback: (error: Error | null, acceptFile: boolean) => void,
//   ) => {
//     const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
//     if (allowed.includes(file.mimetype)) {
//       callback(null, true);
//     } else {
//       callback(
//         new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF`),
//         false,
//       );
//     }
//   },
// };


import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

/**
 * Multer config — stores files in memory (buffer).
 * Files are piped directly to Cloudinary, never written to disk.
 */
export const multerConfig = {
  storage: memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB per file
    files: 10,                   // max 10 files per request
  },

  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/avif', 'image/svg+xml', 'image/tiff', 'image/bmp',
      'image/heic', 'image/heif', 'image/x-icon', 'image/vnd.microsoft.icon',
    ];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, AVIF, SVG, TIFF, BMP, HEIC, ICO`),
        false,
      );
    }
  },
};

/**
 * Multer config for document uploads (certificates, compliance papers).
 *
 * Same in-memory pipeline as `multerConfig`, widened to accept PDF and given a
 * larger ceiling — a scanned multi-page licence is a normal upload, not an
 * exception. Files are still piped straight to Cloudinary, never to disk.
 */
export const documentMulterConfig = {
  storage: memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 1,
  },

  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `Invalid file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WebP`,
        ),
        false,
      );
    }
  },
};