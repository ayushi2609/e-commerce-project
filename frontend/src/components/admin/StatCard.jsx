import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'purple', subtitle }) => {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const activeColor = colorMap[color] || colorMap.purple;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition hover:shadow-md">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>

      <div className={`p-3.5 rounded-2xl border ${activeColor}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};

export default StatCard;
