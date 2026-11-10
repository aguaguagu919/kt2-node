import 'dotenv/config';
import express from 'express';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import productsRouter from './routes/products.js';

const app = express();
app.use(logger);
app.use(express.json({ limit: '1mb' }));
app.use('/uploads/products', express.static(config.uploadDir));
app.use('/api/products', productsRouter);
app.use((_req, res) => res.status(404).json({ message: 'Маршрут не найден' }));
app.use(errorHandler);

app.listen(config.port, () => console.log(`API запущен: http://localhost:${config.port}`));
