import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Store,
  ArrowRight,
  ShieldCheck,
  Truck,
  Leaf,
  Award,
  Star,
  Package,
  Layers,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { getProducts, getCategories } from '../api/products';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts({ limit: 4, sortBy: 'price', sortOrder: 'desc' }),
          getCategories(),
        ]);
        if (prodRes?.data?.products) setFeaturedProducts(prodRes.data.products);
        if (catRes?.data?.categories) setCategories(catRes.data.categories);
      } catch (err) {
        console.error('Home data load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-10">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white p-8 sm:p-16 lg:p-20 shadow-2xl border border-slate-700/50">
          {/* Subtle Background Glow Circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative max-w-2xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Direct From High-Elevation Himalayan Estates</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
              Artisanal Teas <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-emerald-400 to-teal-300">
                Crafted for Connoisseurs.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Experience the pinnacle of fine tea culture. Single-estate first flushes, ceremonial Japanese matcha, and fragrant Ayurvedic herbal infusions delivered fresh to your teacup.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/25 transition duration-300 hover:scale-105"
              >
                <Store className="h-4 w-4" />
                <span>Explore Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {user ? (
                <Link
                  to="/orders"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/15 transition"
                >
                  <Package className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/15 transition"
                >
                  <span>Join Club</span>
                </Link>
              )}
            </div>

            {/* Micro Trust Points */}
            <div className="pt-6 border-t border-slate-700/60 flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <Leaf className="h-4 w-4 text-brand-400" />
                <span>100% Organic</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Truck className="h-4 w-4 text-brand-400" />
                <span>Express Shipping</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Award className="h-4 w-4 text-brand-400" />
                <span>Single-Origin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Curated Collections</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="group bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {cat.description || 'Premium single-origin selections curated for freshness and flavor.'}
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                <span>Browse {cat.name}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Trending / Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Top Rated</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Featured Artisanal Blends
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>Full Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Why Choose ChaiStore */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-50 via-white to-brand-50/40 rounded-3xl border border-slate-200/80 p-8 sm:p-14 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">The ChaiStore Standard</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Uncompromising Quality in Every Leaf
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              We partner directly with high-elevation Himalayan estates to source leaves harvested during peak harvest flushes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Direct-From-Source</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                By removing middle layers, we guarantee tea harvested within weeks of delivery.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center">
              <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Master Tea Blending</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Crushed whole spices and sun-dried botanicals blended in small controlled batches.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center">
              <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Aroma-Lock Nitrogen Sealed</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Triple-layer food grade pouches protecting against oxidation and light degradation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Loved by 10,000+ Tea Drinkers</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Real Reviews From Verified Connoisseurs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The Royal Masala Chai has the cleanest spice balance I've ever experienced. Real crushed cardamom and ginger pods instead of artificial powders."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-900">Dr. Rajeshwari Sharma</p>
              <p className="text-[10px] text-slate-400">Darjeeling Tea Enthusiast</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The Ceremonial Matcha froths effortlessly with a vibrant emerald color and sweet vegetal finish. Outstanding quality."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-900">Vikram Malhotra</p>
              <p className="text-[10px] text-slate-400">Matcha Sommelier</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Fast delivery to Bangalore, arrived within 36 hours vacuum sealed and smelling incredible. Will definitely re-order regularly."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-900">Pooja Kulkarni</p>
              <p className="text-[10px] text-slate-400">Verified Customer</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
