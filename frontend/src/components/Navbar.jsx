import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  LogOut,
  Shield,
  Package,
  Store,
  ShoppingCart,
  ListOrdered,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalQuantity } = useCart();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    addToast('You have been logged out safely.', 'info');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                Chai<span className="text-brand-600 font-black">Store</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Artisanal Estates
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive('/')
                  ? 'text-brand-700 bg-brand-50/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/shop"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition ${
                isActive('/shop')
                  ? 'text-brand-700 bg-brand-50/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Shop Catalog</span>
            </Link>

            {user && (
              <Link
                to="/orders"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition ${
                  isActive('/orders')
                    ? 'text-brand-700 bg-brand-50/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>My Orders</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition ${
                  location.pathname.startsWith('/admin')
                    ? 'text-purple-700 bg-purple-50 shadow-xs'
                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/50'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}
          </nav>

          {/* Desktop Right: Cart & User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-2xl text-slate-700 hover:text-brand-600 hover:bg-slate-100/80 transition focus:outline-none"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalQuantity > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white font-extrabold text-[10px] h-5 w-5 rounded-full flex items-center justify-center shadow-md shadow-brand-600/30 animate-scale-in">
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
            </Link>

            {/* User Dropdown / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-white/80 hover:bg-white shadow-xs transition focus:outline-none"
                >
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-slate-400 truncate text-[11px]">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Account Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                    >
                      <ListOrdered className="h-3.5 w-3.5 text-slate-400" />
                      <span>Order History</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-purple-700 hover:bg-purple-50 font-bold transition"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar: Cart & Hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              to="/cart"
              className="relative p-2 text-slate-700 hover:text-brand-600 focus:outline-none"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalQuantity > 0 && (
                <span className="absolute 0 right-0 bg-brand-600 text-white font-bold text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-slide-up text-xs">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 rounded-xl font-bold ${
              isActive('/') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 rounded-xl font-bold ${
              isActive('/shop') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Shop Catalog
          </Link>

          {user && (
            <>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl font-bold ${
                  isActive('/orders') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                My Orders
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl font-bold ${
                  isActive('/profile') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Profile & Addresses
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl font-bold bg-purple-50 text-purple-700"
            >
              Admin Control Center
            </Link>
          )}

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-bold border border-slate-200 text-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-bold bg-brand-600 text-white"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
