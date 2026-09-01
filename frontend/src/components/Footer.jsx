import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Heart, Send } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 text-xs">
      {/* Value Proposition Bar */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100/60">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Free Express Shipping</h4>
                <p className="text-slate-400 text-xs mt-0.5">Complimentary express dispatch on orders over ₹999</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100/60">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">100% Pure & Organic</h4>
                <p className="text-slate-400 text-xs mt-0.5">Single-estate Himalayan flushes, zero additives</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100/60">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Freshness Guarantee</h4>
                <p className="text-slate-400 text-xs mt-0.5">Vacuum sealed at the source for optimal aroma</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white font-black text-sm">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Chai<span className="text-brand-600">Store</span>
              </span>
            </Link>
            <p className="text-slate-500 leading-relaxed">
              Curating high-elevation loose leaf teas, rare Himalayan botanicals, and stone-ground ceremonial matcha for tea lovers worldwide.
            </p>
          </div>

          {/* Catalog Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Explore Collections</h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="hover:text-brand-600 transition">All Teas & Infusions</Link></li>
              <li><Link to="/shop?category=black-tea" className="hover:text-brand-600 transition">Single-Estate Black Tea</Link></li>
              <li><Link to="/shop?category=green-tea" className="hover:text-brand-600 transition">Organic Ceremonial Matcha</Link></li>
              <li><Link to="/shop?category=herbal" className="hover:text-brand-600 transition">Ayurvedic Wellness Blends</Link></li>
            </ul>
          </div>

          {/* Quick Account Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2">
              <li><Link to="/orders" className="hover:text-brand-600 transition">Track Your Order</Link></li>
              <li><Link to="/cart" className="hover:text-brand-600 transition">View Shopping Cart</Link></li>
              <li><Link to="/profile" className="hover:text-brand-600 transition">Account Settings</Link></li>
              <li><Link to="/login" className="hover:text-brand-600 transition">Sign In</Link></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Join Tea Connoisseurs Club</h4>
            <p className="text-slate-500">Subscribe for early access to limited Himalayan autumn flushes and special promotions.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center space-x-1.5">
              <input
                type="email"
                placeholder="Enter email address..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition"
                title="Subscribe"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-3">
          <p>&copy; {new Date().getFullYear()} ChaiStore Inc. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer">Brewing Guide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
