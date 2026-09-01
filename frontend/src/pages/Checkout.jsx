import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  CreditCard,
  Banknote,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getAddresses, createAddress } from '../api/address';
import { createOrder } from '../api/orders';

export const Checkout = () => {
  const { items, subtotal, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Address form modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [addressLoading, setAddressLoading] = useState(false);

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + shipping;

  const loadAddresses = async () => {
    try {
      const res = await getAddresses();
      if (res?.data?.addresses) {
        setAddresses(res.data.addresses);
        if (res.data.addresses.length > 0 && !selectedAddressId) {
          setSelectedAddressId(res.data.addresses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    loadAddresses();
  }, [items]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    setError('');
    try {
      const res = await createAddress(addressForm);
      if (res?.data?.address) {
        setAddresses((prev) => [res.data.address, ...prev]);
        setSelectedAddressId(res.data.address.id);
        setIsAddressModalOpen(false);
        setAddressForm({
          addressLine: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to save shipping address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address before proceeding.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await createOrder({ addressId: selectedAddressId });
      if (res?.data?.order) {
        await fetchCart(); // Re-sync empty cart state
        navigate(`/order-confirmation/${res.data.order.id}`);
      }
    } catch (err) {
      setError(err?.message || err?.errors?.join(', ') || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/cart"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-green-700 hover:underline mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Cart</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Address & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Shipping Address Selection */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-gray-900">Select Shipping Address</h2>
              </div>

              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center text-gray-400 text-sm">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl p-6">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">No saved addresses</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">Please add a shipping address to receive your order.</p>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Add Address Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition relative ${
                        isSelected
                          ? 'border-green-600 bg-green-50/40 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{addr.addressLine}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                          <p className="text-xs text-gray-500">{addr.country}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h2 className="text-lg font-bold text-gray-900">Payment Option</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-green-600 bg-green-50/30 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Cash on Delivery (COD)</span>
                    <span className="text-xs text-gray-500">Pay cash or UPI upon package arrival</span>
                  </div>
                </div>
                <input type="radio" name="payment" defaultChecked className="text-green-600 focus:ring-green-500 h-4 w-4" />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50 opacity-60 cursor-not-allowed">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block">Credit / Debit Card</span>
                    <span className="text-xs text-gray-400">Online card payment simulation (Coming soon)</span>
                  </div>
                </div>
                <input type="radio" name="payment" disabled className="h-4 w-4" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Order Summary & Review */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
              Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>

            {/* Item list preview */}
            <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto my-3">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate max-w-[180px]">
                    <img
                      src={item.product?.image || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100'}
                      alt={item.product?.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <div className="truncate">
                      <span className="font-semibold text-gray-900 block truncate">{item.product?.name}</span>
                      <span className="text-gray-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800">₹{item.itemTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-semibold">
                  {shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-4 border-t border-gray-100 mt-3">
              <span className="text-base font-bold text-gray-900">Total Payable</span>
              <span className="text-2xl font-black text-green-700">₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedAddressId}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-1" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <span>Confirm & Place Order</span>
              )}
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span>Guaranteed fast dispatch within 24h</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Direct server-verified checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span>Add Shipping Address</span>
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 42 Tea Garden Lane, Flat 3B"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Darjeeling"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Bengal"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="734101"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center"
                >
                  {addressLoading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                  <span>Save Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
