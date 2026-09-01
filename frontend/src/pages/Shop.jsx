import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Filter,
  PackageOpen,
  Check,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/admin/EmptyState';
import { getProducts, getCategories } from '../api/products';

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || 'createdAt:desc';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        if (res?.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductList = async () => {
      setLoading(true);
      try {
        const [sortBy, sortOrder] = currentSort.split(':');
        const res = await getProducts({
          page: currentPage,
          limit: 9,
          search: currentSearch || undefined,
          categoryId: currentCategory || undefined,
          inStock: currentInStock ? 'true' : undefined,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
        });

        if (res?.data?.products) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductList();
  }, [currentSearch, currentCategory, currentSort, currentInStock, currentPage]);

  const updateFilters = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === '' || val === false) {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    if (!updates.page) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const selectedCategoryObj = categories.find((c) => c.id === currentCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Banner & Search */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Curated Single-Origin
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Artisanal Tea Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {pagination.total} high-elevation harvests and traditional chai blends
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tea by name or notes..."
            value={currentSearch}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-xs"
          />
          {currentSearch && (
            <button
              onClick={() => updateFilters({ search: '' })}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid with Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filter (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Filter className="h-4 w-4 text-brand-600" />
                <span>Filters</span>
              </span>
              {(currentCategory || currentInStock || currentSearch) && (
                <button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Category Filter List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-3">Categories</h4>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => updateFilters({ category: '' })}
                  className={`w-full text-left px-3 py-2 rounded-xl font-medium transition ${
                    !currentCategory
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Teas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilters({ category: cat.id })}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium transition flex items-center justify-between ${
                      currentCategory === cat.id
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400">{cat._count?.products || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-3">Availability</h4>
              <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentInStock}
                  onChange={(e) => updateFilters({ inStock: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right 3 Cols: Active Tags, Sorting, Product Grid, Pagination */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
            >
              <Filter className="h-3.5 w-3.5 text-brand-600" />
              <span>Filters ({currentCategory || currentInStock ? 'Active' : 'All'})</span>
            </button>

            {/* Active Tags */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {selectedCategoryObj && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200/60">
                  <span>{selectedCategoryObj.name}</span>
                  <button onClick={() => updateFilters({ category: '' })}>
                    <X className="h-3 w-3 ml-1 text-brand-500 hover:text-brand-700" />
                  </button>
                </span>
              )}

              {currentInStock && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
                  <span>In Stock</span>
                  <button onClick={() => updateFilters({ inStock: false })}>
                    <X className="h-3 w-3 ml-1 text-emerald-500 hover:text-emerald-700" />
                  </button>
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 ml-auto">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={currentSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="createdAt:desc">Newest Arrivals</option>
                <option value="price:asc">Price: Low to High</option>
                <option value="price:desc">Price: High to Low</option>
                <option value="name:asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No Teas Found"
              description="No products match your active search keyword or category filter."
              actionText="Reset All Filters"
              onAction={() => setSearchParams(new URLSearchParams())}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center space-x-3">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => updateFilters({ page: String(currentPage - 1) })}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => updateFilters({ page: String(currentPage + 1) })}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Filter className="h-4 w-4 text-brand-600" />
                <span>Filters</span>
              </h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      updateFilters({ category: '' });
                      setMobileFilterOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg font-medium hover:bg-slate-50"
                  >
                    All Teas
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        updateFilters({ category: c.id });
                        setMobileFilterOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg font-medium hover:bg-slate-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
