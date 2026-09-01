import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = (st) => {
    switch (st) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROCESSING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SHIPPED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyle(
        status
      )}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
