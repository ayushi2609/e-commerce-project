import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { getOrderById, cancelOrder } from '../api/orders';

const getStatusIndex = (status) => {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
      return 0;
    case 'PROCESSING':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return -1;
  }
};

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await getOrderById(id);
      if (res?.data?.order) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
      return;
    }

    setCancelling(true);
    setError('');
    try {
      const res = await cancelOrder(id);
      if (res?.data?.order) {
        setOrder(res.data.order);
        setSuccess('Order has been cancelled successfully.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">Loading order receipt...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-lg font-bold text-gray-900 mb-2">Order Not Found</p>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusIdx = getStatusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  const steps = [
    { label: 'Order Confirmed', desc: 'Estate team notified' },
    { label: 'Processing', desc: 'Leaves packed & quality sealed' },
    { label: 'Shipped', desc: 'In transit with courier' },
    { label: 'Delivered', desc: 'Arrived at your doorstep' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-green-700 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Orders</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-3">
            <span>Order #{order.id.slice(0, 8)}...</span>
            <span
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                isCancelled
                  ? 'bg-red-100 text-red-800'
                  : order.status === 'DELIVERED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {order.status}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2 className="animate-spin h-4 w-4 mr-1" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>Cancel Order</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tracking Stepper */}
      {!isCancelled ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
            Order Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => {
              const isCompleted = statusIdx >= idx;
              const isCurrent = statusIdx === idx;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition ${
                      isCompleted
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-bold block ${
                      isCurrent ? 'text-green-700' : 'text-gray-800'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">{step.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl mb-8 flex items-center space-x-3 text-red-800">
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <span className="text-sm font-bold block">This order was cancelled</span>
            <span className="text-xs text-red-600">Reserved items have been released back to stock.</span>
          </div>
        </div>
      )}

      {/* Grid: Items and Delivery Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items Table */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            Purchased Items
          </h2>

          <div className="divide-y divide-gray-100">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={
                      item.product?.image ||
                      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150'
                    }
                    alt={item.product?.name}
                    className="h-16 w-16 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div>
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-sm font-bold text-gray-900 hover:text-green-600 transition"
                    >
                      {item.product?.name}
                    </Link>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      ₹{Number(item.price).toFixed(2)} × {item.quantity} unit(s)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-gray-900">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Shipping Address & Total Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center space-x-1.5">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Delivery Address</span>
            </h3>

            {order.address ? (
              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">{order.address.addressLine}</p>
                <p>
                  {order.address.city}, {order.address.state} - {order.address.postalCode}
                </p>
                <p className="text-gray-500">{order.address.country}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Address details unavailable</p>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Payment Summary
            </h3>

            <div className="flex justify-between text-gray-600">
              <span>Payment Mode</span>
              <span className="font-semibold text-gray-900">Cash on Delivery (COD)</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Fulfillment Status</span>
              <span className="font-semibold uppercase text-gray-900">{order.status}</span>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-900">Total Amount</span>
              <span className="text-xl font-black text-green-700">
                ₹{Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
