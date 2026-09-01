import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Check, Loader2, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [btnLoading, setBtnLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const isOutOfStock = product.stock <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (isOutOfStock) return;

    setBtnLoading(true);
    const res = await addToCart(product.id, 1);
    setBtnLoading(false);

    if (res.requireLogin) {
      addToast('Please sign in to add items to your cart.', 'info');
      navigate('/login');
      return;
    }

    if (res.success) {
      setAdded(true);
      addToast(`Added "${product.name}" to cart!`, 'success');
      setTimeout(() => setAdded(false), 2000);
    } else {
      addToast(res.message, 'error');
    }
  };

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/70 hover:border-brand-300 hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
          <img
            src={
              product.image ||
              'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
            }
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Category Tag */}
          <div className="absolute top-3.5 left-3.5 flex flex-col gap-1 z-10">
            {product.category && (
              <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-[11px] font-bold text-slate-800 rounded-full shadow-xs">
                {product.category.name}
              </span>
            )}
          </div>

          {/* Stock Tag */}
          <div className="absolute top-3.5 right-3.5 z-10">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-xs">
                Sold Out
              </span>
            ) : product.stock <= 10 ? (
              <span className="px-2.5 py-1 bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-bold rounded-full shadow-xs">
                Only {product.stock} left
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full shadow-xs">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Product Meta */}
        <div className="p-5">
          {/* Rating */}
          <div className="flex items-center space-x-1 text-amber-400 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
            ))}
            <span className="text-[11px] font-bold text-slate-500 ml-1.5">5.0</span>
          </div>

          <Link to={`/products/${product.id}`} className="block focus:outline-none">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Price & Add */}
      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-50">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Price</span>
          <span className="text-lg font-black text-slate-900">
            ₹{Number(product.price).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Link
            to={`/products/${product.id}`}
            className="p-2.5 rounded-xl text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Link>

          <button
            disabled={isOutOfStock || btnLoading}
            onClick={handleAdd}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition ${
              added
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-900 hover:bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {btnLoading ? (
              <Loader2 className="animate-spin h-3.5 w-3.5" />
            ) : added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
