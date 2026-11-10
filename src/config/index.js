import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  rootDir,
  uploadDir: path.join(rootDir, 'uploads', 'products'),
  uploadUrl: '/uploads/products',
};
