import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z
    .string({ required_error: 'Shipping address ID is required' })
    .min(1, 'Shipping address ID is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    { required_error: 'Valid order status is required' }
  ),
});
