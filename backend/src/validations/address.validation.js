import { z } from 'zod';

export const createAddressSchema = z.object({
  addressLine: z
    .string({ required_error: 'Address line is required' })
    .trim()
    .min(5, 'Address line must be at least 5 characters')
    .max(200, 'Address line cannot exceed 200 characters'),
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),
  state: z
    .string({ required_error: 'State is required' })
    .trim()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State cannot exceed 100 characters'),
  postalCode: z
    .string({ required_error: 'Postal code is required' })
    .trim()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code cannot exceed 20 characters'),
  country: z
    .string()
    .trim()
    .default('India'),
});
