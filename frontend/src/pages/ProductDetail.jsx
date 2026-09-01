import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeft,
  Check,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { getProductById } from '../api/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductDetailSkeleton } from '../components/common/Skeleton';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState('brewing');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getProductById(id);
        if (res?.data?.product) {
          setProduct(res.data.product);
        }
      } catch (err) {
        setError(err?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;

    const res = await addToCart(product.id, quantity);
    if (res.requireLogin) {
      addToast('Please sign in to add items to your cart.', 'info');
      navigate('/login');
      return;
    }

    if (res.success) {
      addToast(`Added ${quantity} unit(s) of "${product.name}" to cart!`, 'success');
    } else {
      addToast(res.message, 'error');
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xl font-bold text-slate-900 mb-2">Product Not Found</p>
          <p className="text-xs text-slate-500 mb-6">{error || 'The requested tea item does not exist.'}</p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center space-x-2 text-xs font-semibold text-slate-400">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-slate-800">Shop</Link>
        <span>/</span>
        <span className="text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Detail Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-10 p-6 sm:p-10 lg:p-12">
        {/* Left: Product Image */}
        <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group">
          <img
            src={
              product.image ||
              'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
            }
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Right: Product Purchase Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            {/* Category & Stock Badges */}
            <div className="flex items-center space-x-3 mb-3">
              {product.category && (
                <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-extrabold uppercase tracking-wider rounded-full border border-brand-200/60">
                  {product.category.name}
                </span>
              )}
              {isOutOfStock ? (
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                  Sold Out
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center space-x-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>{product.stock} units in stock</span>
                </span>
              )}
            </div>

            {/* Title & Rating */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="mt-2 flex items-center space-x-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">5.0 (28 customer reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline space-x-3 pb-5 border-b border-slate-100">
              <span className="text-3xl font-black text-slate-900">
                ₹{Number(product.price).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">Inclusive of all taxes & vacuum packaging</span>
            </div>

            {/* Description */}
            <p className="mt-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Stepper & Add to Cart */}
            <div className="mt-8 space-y-4">
              {!isOutOfStock && (
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/50">
                    <button
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2 text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 rounded-l-xl text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-xs font-bold text-slate-900">{quantity}</span>
                    <button
                      disabled={quantity >= product.stock}
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3.5 py-2 text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 rounded-r-xl text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={isOutOfStock || cartLoading}
                onClick={handleAddToCart}
                className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition"
              >
                {cartLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    <span>{isOutOfStock ? 'Sold Out' : `Add ${quantity} to Cart`}</span>
                  </>
                )}
              </button>
            </div>

            {/* Accordion Tabs */}
            <div className="mt-8 border-t border-slate-100 pt-4 space-y-3 text-xs">
              {/* Brewing Guide */}
              <div className="border border-slate-100 rounded-2xl p-4">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'brewing' ? '' : 'brewing')}
                  className="w-full flex items-center justify-between font-bold text-slate-800"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <span>Brewing & Preparation Guide</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openAccordion === 'brewing' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'brewing' && (
                  <p className="mt-2.5 text-slate-500 leading-relaxed pt-2 border-t border-slate-50">
                    Use 2.5g (1 teaspoon) per 200ml cup. Steep with spring water at 90°C–95°C for 3 to 4 minutes. Ideal with whole milk and natural sweetener if preferred.
                  </p>
                )}
              </div>

              {/* Delivery Info */}
              <div className="border border-slate-100 rounded-2xl p-4">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? '' : 'shipping')}
                  className="w-full flex items-center justify-between font-bold text-slate-800"
                >
                  <span className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-brand-600" />
                    <span>Shipping & Freshness Guarantee</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'shipping' && (
                  <p className="mt-2.5 text-slate-500 leading-relaxed pt-2 border-t border-slate-50">
                    Orders are processed and dispatched within 24 hours. Triple-layer nitrogen-sealed packaging ensures farm freshness for up to 24 months.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trust Footnote */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
            <div className="flex flex-col items-center">
              <Truck className="h-4 w-4 text-brand-600 mb-1" />
              <span className="font-semibold">Fast Express</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="h-4 w-4 text-brand-600 mb-1" />
              <span className="font-semibold">100% Organic</span>
            </div>
            <div className="flex flex-col items-center">
              <RotateCcw className="h-4 w-4 text-brand-600 mb-1" />
              <span className="font-semibold">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
