import React from 'react';

/**
 * Accepts:
 *  - data: array like [{ status: 'Delivered', count: 10 }, ...]
 *    or object like { Delivered: 10, Pending: 3 }
 */
export default function StatusBreakdown({ data }) {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
    ? Object.entries(data).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Status Breakdown</h3>
      {!rows.length ? (
        <div className="text-sm text-gray-500">No data</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.status} className="flex items-center justify-between">
              <span className="text-gray-700">{r.status}</span>
              <span className="font-medium">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
