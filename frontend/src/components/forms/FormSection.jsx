import React from 'react';

export default function FormSection({ title, children }) {
  return (
    <section className="bg-white border rounded-lg p-4 mb-4">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}
