import React from 'react';

export default function ErrorMessage({ error }) {
  const msg = error?.message || String(error || 'Something went wrong');
  return <div className="bg-white border rounded-lg p-4 text-red-600">{msg}</div>;
}
