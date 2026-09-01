import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(150, 'Product name must not exceed 150 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  price: z.coerce
    .number({ required_error: 'Price is required' })
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must not exceed 1,000,000'),
  stock: z.coerce
    .number({ required_error: 'Stock quantity is required' })
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative'),
  image: z
    .string()
    .trim()
    .url('Image must be a valid URL')
    .optional()
    .or(z.literal(''))
    .nullable(),
  categoryId: z
    .string({ required_error: 'Category ID is required' })
    .min(1, 'Category ID is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.coerce
    .number({ required_error: 'Stock quantity is required' })
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative'),
});
