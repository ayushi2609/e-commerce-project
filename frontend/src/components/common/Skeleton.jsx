import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100 p-4 animate-pulse shadow-sm flex flex-col justify-between h-[380px]">
    <div>
      <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-4"></div>
      <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded-md w-full mb-1"></div>
      <div className="h-3 bg-slate-100 rounded-md w-2/3"></div>
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
      <div className="h-6 bg-slate-200 rounded-md w-20"></div>
      <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-48 mb-8"></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <div className="aspect-square bg-slate-100 rounded-2xl"></div>
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded-full w-28"></div>
        <div className="h-8 bg-slate-200 rounded w-3/4"></div>
        <div className="h-10 bg-slate-100 rounded w-36"></div>
        <div className="space-y-2 pt-6 border-t border-slate-100">
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
          <div className="h-4 bg-slate-100 rounded w-4/6"></div>
        </div>
        <div className="h-12 bg-slate-200 rounded-2xl w-full mt-8"></div>
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-4 py-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-32"></div>
            <div className="h-2.5 bg-slate-100 rounded w-20"></div>
          </div>
        </div>
        <div className="h-4 bg-slate-200 rounded w-16"></div>
        <div className="h-6 bg-slate-200 rounded-full w-20"></div>
      </div>
    ))}
  </div>
);
