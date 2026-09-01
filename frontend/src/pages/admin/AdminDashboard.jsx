import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmModal from '../../components/admin/ConfirmModal';
import EmptyState from '../../components/admin/EmptyState';
import { getAdminAnalytics, getAdminUsers } from '../../api/admin';
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory,
} from '../../api/products';
import { getAllOrdersAdmin, updateOrderStatusAdmin } from '../../api/orders';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Modals & Actions
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    categoryId: '',
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '', // 'product' | 'category'
    id: null,
    title: '',
    message: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Stock edit state
  const [stockEditId, setStockEditId] = useState(null);
  const [stockValue, setStockValue] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, productsRes, categoriesRes, ordersRes, usersRes] = await Promise.all([
        getAdminAnalytics(),
        getProducts({ limit: 50 }),
        getCategories(),
        getAllOrdersAdmin(),
        getAdminUsers(),
      ]);

      if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      if (productsRes?.data?.products) setProducts(productsRes.data.products);
      if (categoriesRes?.data?.categories) setCategories(categoriesRes.data.categories);
      if (ordersRes?.data?.orders) setOrders(ordersRes.data.orders);
      if (usersRes?.data?.users) setUsers(usersRes.data.users);
    } catch (err) {
      setError(err?.message || 'Failed to load admin management data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showSuccessMsg = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Product Actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
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

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
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

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.description || !productForm.price || productForm.stock === '') {
      setError('Please fill in all required product fields');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          image: productForm.image || null,
          categoryId: productForm.categoryId,
        });
        showSuccessMsg('Product updated successfully!');
      } else {
        await createProduct({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          image: productForm.image || null,
          categoryId: productForm.categoryId,
        });
        showSuccessMsg('New product added to catalog!');
      }
      setIsProductModalOpen(false);
      loadAllData();
    } catch (err) {
      setError(err?.message || err?.errors?.join(', ') || 'Failed to save product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStock = async (id) => {
    if (isNaN(Number(stockValue)) || Number(stockValue) < 0) {
      setError('Stock quantity must be a non-negative number');
      return;
    }
    setActionLoading(true);
    try {
      await updateProductStock(id, Number(stockValue));
      showSuccessMsg('Stock updated successfully!');
      setStockEditId(null);
      loadAllData();
    } catch (err) {
      setError(err?.message || 'Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    setError('');
    try {
      if (deleteConfirm.type === 'product') {
        await deleteProduct(deleteConfirm.id);
        showSuccessMsg('Product deleted successfully');
      } else if (deleteConfirm.type === 'category') {
        await deleteCategory(deleteConfirm.id);
        showSuccessMsg('Category deleted successfully');
      }
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '', message: '' });
      loadAllData();
    } catch (err) {
      setError(err?.message || 'Failed to delete item');
    } finally {
      setActionLoading(false);
    }
  };

  // Category Actions
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await createCategory(categoryForm);
      showSuccessMsg(`Category "${categoryForm.name}" created!`);
      setCategoryForm({ name: '', description: '' });
      loadAllData();
    } catch (err) {
      setError(err?.message || 'Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  // Order Status Update Action
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    setActionLoading(true);
    setError('');
    try {
      await updateOrderStatusAdmin(orderId, newStatus);
      showSuccessMsg(`Order status updated to ${newStatus}`);
      loadAllData();
    } catch (err) {
      setError(err?.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: products.length },
    { id: 'categories', label: 'Categories', icon: Layers, badge: categories.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
    { id: 'users', label: 'Users', icon: Users, badge: users.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 mb-2">
            Administrator Portal
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            E-Commerce Control Center
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center space-x-2 text-green-800 text-xs font-semibold">
          <Check className="h-4 w-4 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-8 border-b border-gray-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-purple-800 text-purple-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin h-10 w-10 text-purple-600 mx-auto" />
          <p className="text-xs text-gray-500 mt-4 font-semibold">Loading dashboard metrics...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* 6 Key Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Total Revenue"
                  value={`₹${analytics?.metrics?.totalRevenue?.toFixed(2) || '0.00'}`}
                  icon={TrendingUp}
                  color="green"
                  subtitle="Completed orders gross value"
                />
                <StatCard
                  title="Total Orders"
                  value={analytics?.metrics?.totalOrders || 0}
                  icon={ShoppingBag}
                  color="blue"
                  subtitle="All-time placed orders"
                />
                <StatCard
                  title="Pending / Active"
                  value={analytics?.metrics?.pendingOrders || 0}
                  icon={Clock}
                  color="amber"
                  subtitle="Awaiting fulfillment"
                />
                <StatCard
                  title="Registered Users"
                  value={analytics?.metrics?.totalUsers || 0}
                  icon={Users}
                  color="purple"
                  subtitle="Customer accounts"
                />
                <StatCard
                  title="Active Products"
                  value={analytics?.metrics?.totalProducts || 0}
                  icon={Package}
                  color="indigo"
                  subtitle="Catalog SKU count"
                />
                <StatCard
                  title="Low-Stock Alerts"
                  value={analytics?.metrics?.lowStockCount || 0}
                  icon={AlertTriangle}
                  color="red"
                  subtitle="Stock <= 10 units"
                />
              </div>

              {/* Low Stock Alerts & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Low Stock Monitor */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h3 className="text-base font-bold text-gray-900">Low-Stock Products (≤ 10)</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="text-xs text-purple-600 font-bold hover:underline"
                    >
                      Manage All
                    </button>
                  </div>

                  {analytics?.lowStockProducts?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4">
                      All products have healthy inventory levels.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {analytics?.lowStockProducts?.map((prod) => (
                        <div key={prod.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100'}
                              alt={prod.name}
                              className="h-9 w-9 rounded-xl object-cover"
                            />
                            <div>
                              <span className="font-bold text-gray-900 block">{prod.name}</span>
                              <span className="text-gray-400">{prod.category?.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700 text-[11px]">
                              {prod.stock} left
                            </span>
                            <button
                              onClick={() => {
                                setActiveTab('products');
                                setStockEditId(prod.id);
                                setStockValue(prod.stock);
                              }}
                              className="text-purple-600 font-bold hover:underline"
                            >
                              Restock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="h-5 w-5 text-purple-600" />
                      <h3 className="text-base font-bold text-gray-900">Recent Customer Orders</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-purple-600 font-bold hover:underline"
                    >
                      View All Orders
                    </button>
                  </div>

                  {analytics?.recentOrders?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4">No recent orders yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {analytics?.recentOrders?.map((ord) => (
                        <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {ord.user?.name || 'Customer'}
                            </span>
                            <span className="text-gray-400 font-mono">{ord.id.slice(0, 8)}...</span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <StatusBadge status={ord.status} />
                            <span className="font-bold text-gray-900">
                              ₹{Number(ord.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8">
              {/* Product Header & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search product name or category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Product Table */}
              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No Products Found"
                  description="No items match your query or the catalog is empty."
                  actionText="Add Product"
                  onAction={handleOpenAddProduct}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-xs">
                    <thead className="bg-gray-50/60 font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Price</th>
                        <th className="px-4 py-3 text-left">Stock Quantity</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <img
                                src={
                                  prod.image ||
                                  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100'
                                }
                                alt={prod.name}
                                className="h-10 w-10 rounded-xl object-cover border border-gray-100"
                              />
                              <div>
                                <span className="font-bold text-gray-900 block">{prod.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono truncate max-w-xs block">
                                  {prod.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-semibold text-[11px]">
                              {prod.category?.name || 'Uncategorized'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-900">
                            ₹{Number(prod.price).toFixed(2)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {stockEditId === prod.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={stockValue}
                                  onChange={(e) => setStockValue(e.target.value)}
                                  className="w-16 px-2 py-1 border border-purple-400 rounded-lg text-xs"
                                />
                                <button
                                  onClick={() => handleUpdateStock(prod.id)}
                                  className="px-2 py-1 bg-purple-600 text-white rounded-md font-bold text-[10px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setStockEditId(null)}
                                  className="text-gray-400 hover:text-gray-600 text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    prod.stock <= 0
                                      ? 'bg-red-100 text-red-800'
                                      : prod.stock <= 10
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {prod.stock} units
                                </span>
                                <button
                                  onClick={() => {
                                    setStockEditId(prod.id);
                                    setStockValue(prod.stock);
                                  }}
                                  className="text-purple-600 hover:underline font-bold text-[11px]"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Edit product"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'product',
                                  id: prod.id,
                                  title: 'Delete Product',
                                  message: `Are you sure you want to delete "${prod.name}"? This action cannot be undone.`,
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete product"
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
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Category Form */}
              <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-purple-600" />
                  <span>Create Category</span>
                </h3>

                <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Herbal Infusions"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      rows="3"
                      placeholder="Botanical caffeine-free teas..."
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                    <span>Add Category</span>
                  </button>
                </form>
              </div>

              {/* Categories Table */}
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-purple-600" />
                  <span>Existing Categories ({categories.length})</span>
                </h3>

                {categories.length === 0 ? (
                  <EmptyState icon={Layers} title="No Categories Created" />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="py-4 flex items-center justify-between text-xs hover:bg-gray-50/50 px-2 rounded-xl transition"
                      >
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">{cat.name}</span>
                          <span className="text-gray-500 text-xs block mt-0.5">
                            {cat.description || 'No description provided.'}
                          </span>
                          <span className="text-purple-600 font-semibold text-[11px] mt-1 inline-block">
                            {cat._count?.products || 0} associated product(s)
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: 'category',
                              id: cat.id,
                              title: 'Delete Category',
                              message: `Are you sure you want to delete category "${cat.name}"?`,
                            })
                          }
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ORDERS MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8">
              {/* Filters Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Order ID or Customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                          orderStatusFilter === st
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Orders Table */}
              {filteredOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No Orders Found"
                  description="No customer orders match the selected filter."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-xs">
                    <thead className="bg-gray-50/60 font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Order ID / Date</th>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Items</th>
                        <th className="px-4 py-3 text-left">Total</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-gray-900 block">
                              {ord.id.slice(0, 8)}...
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-bold text-gray-900 block">
                              {ord.user?.name || 'Customer'}
                            </span>
                            <span className="text-[11px] text-gray-400">{ord.user?.email}</span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700">
                              {ord.orderItems?.length || 0} item(s)
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-green-700">
                            ₹{Number(ord.totalAmount).toFixed(2)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <select
                              value={ord.status}
                              disabled={actionLoading}
                              onChange={(e) => handleOrderStatusUpdate(ord.id, e.target.value)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="View Order Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: USERS DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8">
              <h3 className="text-base font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Registered User Directory ({users.length})</span>
              </h3>

              {users.length === 0 ? (
                <EmptyState icon={Users} title="No Users Registered" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-xs">
                    <thead className="bg-gray-50/60 font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-left">Total Orders</th>
                        <th className="px-4 py-3 text-left">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-900">
                            {u.name}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">{u.email}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <StatusBadge status={u.role} />
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-bold text-purple-600">
                            {u._count?.orders || 0} order(s)
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Kashmiri Kahwa"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="499.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="50"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Artisanal blend notes..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center"
                >
                  {actionLoading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Order Invoice Summary</h3>
                <p className="text-[11px] font-mono text-gray-400">ID: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer */}
              <div className="p-3 bg-gray-50 rounded-2xl">
                <span className="text-gray-400 block font-bold text-[10px] uppercase">Customer</span>
                <span className="font-bold text-gray-900 block">{selectedOrder.user?.name}</span>
                <span className="text-gray-500 block">{selectedOrder.user?.email}</span>
              </div>

              {/* Items */}
              <div>
                <span className="text-gray-400 block font-bold text-[10px] uppercase mb-2">
                  Line Items
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedOrder.orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-gray-700">
                      <span>
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span className="font-bold text-gray-900">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Total */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-green-700 text-base">
                  ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Delete"
        isDanger={true}
        loading={actionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: '', id: null, title: '', message: '' })}
      />
    </div>
  );
};

export default AdminDashboard;
