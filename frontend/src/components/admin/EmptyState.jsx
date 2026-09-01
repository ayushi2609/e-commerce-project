import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no entries available to display.',
  actionText,
  onAction,
}) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto my-6">
      <div className="h-14 w-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
