import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Calendar, MapPin, Eye, ShoppingBag } from 'lucide-react';
import { getMyOrders } from '../api/orders';

const getStatusColor = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PROCESSING':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'SHIPPED':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        if (res?.data?.orders) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        setError('Failed to load your order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track fulfillment status, view detailed invoices, and manage previous purchases.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading order history...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-md mx-auto shadow-sm">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No Orders Yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            You haven't placed any orders with us yet.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 transition hover:border-gray-200"
            >
              {/* Top Row: Order info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-400">Order ID:</span>
                    <span className="text-xs font-mono font-bold text-gray-900">{order.id}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {order.orderItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50/60 border border-gray-100"
                  >
                    <img
                      src={
                        item.product?.image ||
                        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100'
                      }
                      alt={item.product?.name}
                      className="h-12 w-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="truncate text-xs">
                      <span className="font-bold text-gray-900 block truncate">
                        {item.product?.name}
                      </span>
                      <span className="text-gray-500 block">Qty: {item.quantity}</span>
                      <span className="font-bold text-gray-800">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Row: Total & Delivery */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 gap-2">
                {order.address && (
                  <div className="flex items-center space-x-1.5 truncate max-w-md">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      Shipping to: {order.address.city}, {order.address.state}
                    </span>
                  </div>
                )}

                <div className="text-right sm:ml-auto">
                  <span className="text-gray-500 font-medium mr-2">Total Amount:</span>
                  <span className="text-base font-extrabold text-green-700">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
