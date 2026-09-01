import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Store, MapPin, Calendar, Receipt } from 'lucide-react';
import { getOrderById } from '../api/orders';

export const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderById(id);
        if (res?.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        setError('Could not retrieve order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">Generating order receipt...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
        {/* Success Icon */}
        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle className="h-10 w-10" />
        </div>

        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">
          Order Successfully Placed
        </span>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
          Thank you for your order!
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          We've received your order and our Himalayan estate team is preparing your artisanal package.
        </p>

        {/* Order Details Box */}
        {order && (
          <div className="mt-8 text-left bg-gray-50/80 rounded-2xl p-6 border border-gray-100 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/60 pb-3 gap-2">
              <div>
                <span className="text-gray-400 font-medium block">Order Reference ID</span>
                <span className="font-mono font-bold text-gray-900 text-sm">{order.id}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-gray-400 font-medium block">Order Status</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-800 uppercase text-[10px]">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="flex items-start space-x-2 pt-1">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800">Delivering To:</span>
                  <p className="text-gray-600 mt-0.5">
                    {order.address.addressLine}, {order.address.city}, {order.address.state} - {order.address.postalCode}
                  </p>
                </div>
              </div>
            )}

            {/* Items Summary */}
            <div className="pt-2 border-t border-gray-200/60">
              <span className="font-bold text-gray-800 block mb-2">Ordered Items:</span>
              <div className="space-y-2">
                {order.orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-gray-700">
                    <span>
                      {item.product?.name} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200/60 flex justify-between items-baseline font-bold text-sm">
              <span>Total Paid / Payable:</span>
              <span className="text-green-700 text-base">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md transition text-sm"
          >
            <Package className="h-4 w-4" />
            <span>View All My Orders</span>
          </Link>

          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-semibold border border-gray-200 shadow-sm transition text-sm"
          >
            <Store className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
