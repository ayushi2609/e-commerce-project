import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  FolderPlus,
  Loader2,
  X,
  Layers,
} from 'lucide-react';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory,
} from '../../api/products';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    categoryId: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  // Stock edit state
  const [stockEditId, setStockEditId] = useState(null);
  const [stockValue, setStockValue] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts({ limit: 50 }),
        getCategories(),
      ]);

      if (prodRes?.data?.products) {
        setProducts(prodRes.data.products);
      }
      if (catRes?.data?.categories) {
        setCategories(catRes.data.categories);
        if (!productForm.categoryId && catRes.data.categories.length > 0) {
          setProductForm((prev) => ({
            ...prev,
            categoryId: catRes.data.categories[0].id,
          }));
        }
      }
    } catch (err) {
      setError('Failed to load data: ' + (err?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      image: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      stock: prod.stock,
      image: prod.image || '',
      categoryId: prod.categoryId || prod.category?.id || '',
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      if (editingProductId) {
        await updateProduct(editingProductId, {
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          image: productForm.image || null,
          categoryId: productForm.categoryId,
        });
        showSuccess('Product updated successfully!');
      } else {
        await createProduct({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          image: productForm.image || null,
          categoryId: productForm.categoryId,
        });
        showSuccess('New product added to catalog!');
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err) {
      setError(err?.message || err?.errors?.join(', ') || 'Failed to save product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setActionLoading(true);
    try {
      await deleteProduct(id);
      showSuccess(`Deleted product "${name}"`);
      loadData();
    } catch (err) {
      setError(err?.message || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStock = async (id) => {
    if (isNaN(Number(stockValue)) || Number(stockValue) < 0) {
      setError('Stock must be a non-negative number.');
      return;
    }
    setActionLoading(true);
    try {
      await updateProductStock(id, Number(stockValue));
      showSuccess('Stock updated successfully!');
      setStockEditId(null);
      loadData();
    } catch (err) {
      setError(err?.message || 'Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setActionLoading(true);
    try {
      await createCategory(categoryForm);
      showSuccess(`Created category "${categoryForm.name}"`);
      setCategoryForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      setError(err?.message || 'Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      showSuccess(`Category "${name}" deleted`);
      loadData();
    } catch (err) {
      setError(err?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Package className="h-7 w-7 text-purple-600" />
            <span>Product Catalog Management</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage inventory, categories, pricing, and active listings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm"
          >
            <Layers className="h-4 w-4 text-purple-600" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 flex items-start justify-between">
          <div className="flex items-center space-x-2 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl bg-green-50 p-4 border border-green-200 flex items-center space-x-2 text-green-800 text-sm">
          <Check className="h-5 w-5 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="animate-spin h-8 w-8 text-purple-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900">No products in catalog yet</p>
            <p className="text-sm text-gray-500 mt-1">Get started by creating your first product item.</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock Inventory
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/80 transition">
                    {/* Name & Thumbnail */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            prod.image ||
                            'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={prod.name}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{prod.name}</div>
                          <div className="text-xs text-gray-400 font-mono truncate max-w-xs">{prod.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
                        {prod.category?.name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₹{Number(prod.price).toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stockEditId === prod.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            value={stockValue}
                            onChange={(e) => setStockValue(e.target.value)}
                            className="w-20 px-2 py-1 border border-purple-400 rounded-lg text-xs"
                          />
                          <button
                            onClick={() => handleUpdateStock(prod.id)}
                            className="px-2 py-1 bg-purple-600 text-white rounded-md text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setStockEditId(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              prod.stock > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {prod.stock} units
                          </span>
                          <button
                            onClick={() => {
                              setStockEditId(prod.id);
                              setStockValue(prod.stock);
                            }}
                            className="text-xs text-purple-600 hover:underline font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition"
                        title="Edit Details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Royal Kashmiri Kahwa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={productForm.categoryId}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="499.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, stock: e.target.value }))
                    }
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, image: e.target.value }))
                  }
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows="3"
                  required
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Detailed artisanal flavor profile, origin, and brewing instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center space-x-1"
                >
                  {actionLoading && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
                  <span>{editingProductId ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Layers className="h-5 w-5 text-purple-600" />
                <span>Product Categories</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCategorySubmit} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Add New Category</h4>
              <input
                type="text"
                required
                placeholder="Category Name (e.g. Oolong Tea)"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Short Description (Optional)"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition"
              >
                Create Category
              </button>
            </form>

            {/* Categories List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200"
                >
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">{cat.name}</span>
                    <span className="text-xs text-gray-500">
                      {cat._count?.products || 0} active product(s)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
