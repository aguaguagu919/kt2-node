import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { config } from '../config/index.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, config.uploadDir),
  filename: (_req, file, callback) => {
    const extension = file.mimetype === 'image/png' ? '.png' : '.jpg';
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      const error = new Error('Разрешены только изображения JPEG и PNG');
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
}).single('image');
