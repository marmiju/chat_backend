export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const withSocketAck = (fn) => async (payload = {}, ack) => {
  try {
    const result = await fn(payload, ack);
    if (result && typeof ack === 'function') {
      ack(result);
    }
  } catch (err) {
    console.error('Socket handler error:', err.message);
    if (typeof ack === 'function') {
      ack({
        status: 'error',
        message: err.message || 'Internal server error',
      });
    }
  }
};

