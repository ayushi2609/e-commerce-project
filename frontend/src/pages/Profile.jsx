import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAddresses, createAddress, deleteAddress } from '../api/address';

export const Profile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAddresses = async () => {
    try {
      const res = await getAddresses();
      if (res?.data?.addresses) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createAddress(addressForm);
      if (res?.data?.address) {
        setAddresses((prev) => [res.data.address, ...prev]);
        setIsAddressModalOpen(false);
        setAddressForm({ addressLine: '', city: '', state: '', postalCode: '', country: 'India' });
        addToast('New shipping address saved!', 'success');
      }
    } catch (err) {
      addToast(err?.message || 'Failed to save address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this shipping address?')) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      addToast('Address deleted', 'info');
    } catch (err) {
      addToast(err?.message || 'Failed to delete address', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="h-20 w-20 bg-gradient-to-tr from-brand-500 to-emerald-400 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{user?.name}</h1>
              <p className="text-xs text-slate-300 mt-1">{user?.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase border border-white/15">
                  {user?.role} Member
                </span>
                <Link
                  to="/orders"
                  className="px-3 py-1 bg-brand-500 text-slate-950 rounded-full text-[11px] font-bold flex items-center space-x-1 hover:bg-brand-400 transition"
                >
                  <Package className="h-3 w-3" />
                  <span>View Order History</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Account Meta Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <User className="h-4 w-4 text-brand-600 mb-1" />
            <p className="text-slate-400 font-semibold">Account Name</p>
            <p className="font-bold text-slate-900 mt-0.5">{user?.name}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Mail className="h-4 w-4 text-brand-600 mb-1" />
            <p className="text-slate-400 font-semibold">Email</p>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{user?.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Shield className="h-4 w-4 text-brand-600 mb-1" />
            <p className="text-slate-400 font-semibold">Role Tier</p>
            <p className="font-bold text-slate-900 mt-0.5">{user?.role}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Calendar className="h-4 w-4 text-brand-600 mb-1" />
            <p className="text-slate-400 font-semibold">User ID</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5 truncate">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              <span>Saved Shipping Addresses</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage delivery addresses for 1-click checkout.</p>
          </div>

          <button
            onClick={() => setIsAddressModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-xl text-xs font-bold transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add New</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
            <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No saved shipping addresses</p>
            <p className="text-[11px] text-slate-500 mt-1 mb-3">Add your delivery location for fast order processing.</p>
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-start justify-between relative group"
              >
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{addr.addressLine}</p>
                  <p className="text-slate-600">
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-slate-400 text-[11px]">{addr.country}</p>
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete address"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-brand-600" />
                <span>Add Delivery Address</span>
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 42 Tea Garden Lane, Flat 3B"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Darjeeling"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="West Bengal"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="734101"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center"
                >
                  {submitting && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
