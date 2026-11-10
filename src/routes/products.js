import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import Joi from 'joi';
import { config } from '../config/index.js';
import { uploadProductImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

const router = Router();
// In-memory storage keeps this API self-contained. Replace with a database for persistence.
const products = new Map();

const productSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(2000).allow('').default(''),
  category: Joi.string().trim().min(1).max(80).required(),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).default(0),
});

const idSchema = Joi.object({ id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required() });
const listQuerySchema = Joi.object({
  category: Joi.string().trim().max(80),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).custom((query, helpers) => {
  if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
    return helpers.error('any.invalid');
  }
  return query;
}).messages({ 'any.invalid': 'minPrice не может быть больше maxPrice' });

function imageUrl(file) {
  return file ? `${config.uploadUrl}/${file}` : null;
}

function applyImage(product, req) {
  return req.file ? { ...product, image: imageUrl(req.file.filename) } : product;
}

async function removeImage(product) {
  if (!product?.image) return;
  const filename = path.basename(product.image);
  await fs.unlink(path.join(config.uploadDir, filename)).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

router.get('/', validate(listQuerySchema, 'query'), (req, res) => {
  const { category, minPrice, maxPrice, page, limit } = req.query;
  const filtered = [...products.values()].filter((product) =>
    (!category || product.category.toLowerCase() === category.toLowerCase()) &&
    (minPrice === undefined || product.price >= minPrice) &&
    (maxPrice === undefined || product.price <= maxPrice));
  const offset = (page - 1) * limit;
  res.json({ data: filtered.slice(offset, offset + limit), total: filtered.length, page, limit });
});

router.post('/', uploadProductImage, validate(productSchema), (req, res) => {
  const now = new Date().toISOString();
  const product = applyImage({ id: randomUUID(), ...req.body, image: null, createdAt: now, updatedAt: now }, req);
  products.set(product.id, product);
  res.status(201).json({ data: product });
});

router.get('/:id', validate(idSchema, 'params'), (req, res) => {
  const product = products.get(req.params.id);
  if (!product) return res.status(404).json({ message: 'Товар не найден' });
  res.json({ data: product });
});

router.put('/:id', uploadProductImage, validate(idSchema, 'params'), validate(productSchema), async (req, res) => {
  const current = products.get(req.params.id);
  if (!current) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    return res.status(404).json({ message: 'Товар не найден' });
  }
  const updated = applyImage({ ...current, ...req.body, updatedAt: new Date().toISOString() }, req);
  if (req.file) await removeImage(current);
  products.set(updated.id, updated);
  res.json({ data: updated });
});

router.patch('/:id', uploadProductImage, validate(idSchema, 'params'), validate(productSchema.fork(
  ['name', 'category', 'price', 'description', 'stock'], (field) => field.optional(),
).min(1)), async (req, res) => {
  const current = products.get(req.params.id);
  if (!current) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    return res.status(404).json({ message: 'Товар не найден' });
  }
  const updated = applyImage({ ...current, ...req.body, updatedAt: new Date().toISOString() }, req);
  if (req.file) await removeImage(current);
  products.set(updated.id, updated);
  res.json({ data: updated });
});

router.delete('/:id', validate(idSchema, 'params'), async (req, res) => {
  const product = products.get(req.params.id);
  if (!product) return res.status(404).json({ message: 'Товар не найден' });
  await removeImage(product);
  products.delete(product.id);
  res.status(204).end();
});

export default router;
