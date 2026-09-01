import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const { search, categoryId, minPrice, maxPrice, inStock, sortBy, sortOrder } = req.query;

  const where = {};

  // Search filter
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined && !isNaN(Number(minPrice))) {
      where.price.gte = Number(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
      where.price.lte = Number(maxPrice);
    }
  }

  // In-stock filter
  if (inStock === 'true' || inStock === true) {
    where.stock = { gt: 0 };
  }

  // Sorting
  const allowedSortFields = ['price', 'createdAt', 'name', 'stock'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { [validSortBy]: validSortOrder },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      'Products retrieved successfully'
    )
  );
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { product }, 'Product retrieved successfully')
  );
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, image, categoryId } = req.body;

  // Validate category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(404, 'Specified category does not exist');
  }

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      price,
      stock,
      image: image?.trim() || null,
      categoryId,
    },
    include: {
      category: true,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { product }, 'Product created successfully')
  );
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image, categoryId } = req.body;

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new ApiError(404, 'Product not found');
  }

  if (categoryId && categoryId !== existingProduct.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new ApiError(404, 'Specified category does not exist');
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description && { description: description.trim() }),
      ...(price !== undefined && { price }),
      ...(stock !== undefined && { stock }),
      ...(image !== undefined && { image: image?.trim() || null }),
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { product: updatedProduct }, 'Product updated successfully')
  );
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new ApiError(404, 'Product not found');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { stock },
    include: {
      category: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { product: updatedProduct }, 'Stock updated successfully')
  );
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: { orderItems: true },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const orderCount = product._count?.orderItems || 0;
  if (orderCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete product. It has been referenced in ${orderCount} past customer order(s).`
    );
  }

  await prisma.product.delete({ where: { id } });

  return res.status(200).json(
    new ApiResponse(200, null, 'Product deleted successfully')
  );
});
