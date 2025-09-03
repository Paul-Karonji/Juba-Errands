import React from 'react';

export default function StatCard({ title, value, color = 'border-gray-300', icon = '📊' }) {
  return (
    <div className={`bg-white border ${color} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-semibold mt-1">{value}</div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}
