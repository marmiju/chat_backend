export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500)
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  })
}

