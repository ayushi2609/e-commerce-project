import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(
    new ApiResponse(200, { addresses }, 'Addresses retrieved successfully')
  );
});

export const createAddress = asyncHandler(async (req, res) => {
  const { addressLine, city, state, postalCode, country } = req.body;

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country?.trim() || 'India',
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { address }, 'Address created successfully')
  );
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await prisma.address.findUnique({
    where: { id },
  });

  if (!address || address.userId !== req.user.id) {
    throw new ApiError(404, 'Address not found or does not belong to you');
  }

  await prisma.address.delete({ where: { id } });

  return res.status(200).json(
    new ApiResponse(200, null, 'Address deleted successfully')
  );
});
