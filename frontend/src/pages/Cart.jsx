import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Tag,
  Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/admin/EmptyState';

export const Cart = () => {
  const { items, subtotal, totalQuantity, updateQuantity, removeItem, clearCart, loading } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const discount = couponApplied ? Number((subtotal * 0.1).toFixed(2)) : 0;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  const freeShippingThreshold = 999;
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const hasStockIssues = items.some((item) => item.isOutOfStock || item.isExceedingStock);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'CHAI10') {
      setCouponApplied(true);
      addToast('Coupon "CHAI10" applied! 10% discount added.', 'success');
    } else {
      addToast('Invalid coupon code. Try "CHAI10" for 10% off.', 'error');
    }
  };

  const handleRemoveItem = async (itemId, name) => {
    const res = await removeItem(itemId);
    if (res.success) {
      addToast(`Removed "${name}" from cart`, 'info');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Clear all items from your shopping cart?')) return;
    await clearCart();
    addToast('Shopping cart cleared', 'info');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200/80 shadow-card max-w-md mx-auto">
          <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Sign in to view your cart</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Your shopping cart is securely saved with your user account.
          </p>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs shadow-md transition"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Explore our single-estate Himalayan harvests and traditional masala blends."
          actionText="Browse Tea Catalog"
          onAction={() => window.location.assign('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Title */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Your Bag</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Shopping Cart ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <button
          onClick={handleClearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center space-x-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Free Shipping Progress Meter */}
      <div className="bg-brand-50/80 border border-brand-200/80 rounded-2xl p-4 mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <div className="flex items-center space-x-2">
            <Truck className="h-4 w-4 text-brand-600" />
            <span>
              {subtotal >= freeShippingThreshold
                ? '🎉 Congratulations! You have unlocked Free Express Shipping!'
                : `Add ₹${(freeShippingThreshold - subtotal).toFixed(2)} more for Free Shipping`}
            </span>
          </div>
          <span className="text-brand-700">{freeShippingProgress}%</span>
        </div>
        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          ></div>
        </div>
      </div>

      {hasStockIssues && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <span>
            Some items in your cart exceed currently available inventory. Please adjust quantities before checkout.
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Cart Item Cards */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Product Thumbnail & Details */}
              <div className="flex items-center space-x-4">
                <img
                  src={
                    item.product?.image ||
                    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150'
                  }
                  alt={item.product?.name}
                  className="h-20 w-20 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                />
                <div>
                  <Link
                    to={`/products/${item.productId}`}
                    className="text-sm font-bold text-slate-900 hover:text-brand-600 transition line-clamp-1"
                  >
                    {item.product?.name}
                  </Link>
                  {item.product?.category && (
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      {item.product.category.name}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    ₹{Number(item.product?.price).toFixed(2)} each
                  </span>

                  {item.isOutOfStock ? (
                    <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                      Currently Out of Stock
                    </span>
                  ) : item.isExceedingStock ? (
                    <span className="text-[11px] font-semibold text-amber-600 mt-1 block">
                      Only {item.availableStock} in stock
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Stepper & Total */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                {/* Stepper */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/50">
                  <button
                    disabled={item.quantity <= 1 || loading}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 rounded-l-xl text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    disabled={item.quantity >= item.availableStock || loading}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 rounded-r-xl text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal for Item */}
                <div className="text-right min-w-[80px]">
                  <span className="text-base font-black text-slate-900">
                    ₹{item.itemTotal.toFixed(2)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  disabled={loading}
                  onClick={() => handleRemoveItem(item.id, item.product?.name)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 text-xs font-bold text-brand-700 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Summary & Coupon */}
        <div className="lg:col-span-1 space-y-6">
          {/* Coupon Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Tag className="h-3.5 w-3.5 text-brand-600" />
              <span>Promo Code</span>
            </h3>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter CHAI10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
            <h2 className="text-base font-extrabold text-slate-900 pb-4 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 py-4 border-b border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>

              {couponApplied && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount (10%)</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-brand-600 font-bold">FREE</span>
                  ) : (
                    `₹${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-4">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-2xl font-black text-brand-700">₹{grandTotal.toFixed(2)}</span>
            </div>

            <Link
              to="/checkout"
              className={`w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition ${
                hasStockIssues || items.length === 0
                  ? 'opacity-40 pointer-events-none cursor-not-allowed'
                  : ''
              }`}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <Truck className="h-3.5 w-3.5 text-brand-600" />
                <span>Express dispatch from Darjeeling estates</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                <span>256-Bit SSL Encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
