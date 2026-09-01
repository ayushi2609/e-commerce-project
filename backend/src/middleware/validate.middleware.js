import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        return next(new ApiError(400, 'Validation Error', errorMessages));
      }
      next(error);
    }
  };
};

export default validate;
