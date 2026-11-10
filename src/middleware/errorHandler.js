export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  const status = error.status || error.statusCode || (error.name === 'MulterError' ? 400 : 500);
  const message = status >= 500 ? 'Внутренняя ошибка сервера' : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ message });
}
