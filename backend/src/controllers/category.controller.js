import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return res.status(200).json(
    new ApiResponse(200, { categories }, 'Categories retrieved successfully')
  );
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          image: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { category }, 'Category retrieved successfully')
  );
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existing = await prisma.category.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    throw new ApiError(409, 'Category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { category }, 'Category created successfully')
  );
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (name && name.trim() !== category.name) {
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });
    if (existing && existing.id !== id) {
      throw new ApiError(409, 'Category with this name already exists');
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { category: updatedCategory }, 'Category updated successfully')
  );
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (category._count.products > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. It contains ${category._count.products} associated product(s).`
    );
  }

  await prisma.category.delete({ where: { id } });

  return res.status(200).json(
    new ApiResponse(200, null, 'Category deleted successfully')
  );
});
