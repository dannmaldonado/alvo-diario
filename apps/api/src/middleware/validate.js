/**
 * Zod Validation Middleware
 * Validates request body against a Zod schema before reaching the route handler.
 */

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten(),
    });
  }
  // Replace body with parsed (and potentially transformed) data
  req.body = result.data;
  next();
};

/**
 * Validates request query parameters against a Zod schema.
 */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: result.error.flatten(),
    });
  }
  req.query = result.data;
  next();
};

export default validate;
