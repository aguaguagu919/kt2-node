export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        message: 'Ошибка валидации',
        details: error.details.map(({ message, path, type }) => ({ message, path, type })),
      });
    }
    req[source] = value;
    next();
  };
}
