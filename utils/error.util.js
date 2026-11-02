export const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const badRequest = (message = 'Bad request') => createHttpError(400, message);
export const unauthorized = (message = 'Not authorized') => createHttpError(401, message);
export const forbidden = (message = 'Forbidden') => createHttpError(403, message);
export const notFound = (message = 'Resource not found') => createHttpError(404, message);
export const conflict = (message = 'Resource conflict') => createHttpError(409, message);

