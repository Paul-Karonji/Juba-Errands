import React from 'react';


export default function DataTable({ columns, rows, onEdit, onDelete }) {
return (
<div className="overflow-auto border rounded-lg bg-white">
<table className="min-w-full text-sm">
<thead className="bg-gray-50">
<tr>
{columns.map((c) => (
<th key={c.key} className="text-left px-3 py-2 font-semibold text-gray-700">{c.label}</th>
))}
{(onEdit || onDelete) && <th className="px-3 py-2" />}
</tr>
</thead>
<tbody>
{rows.map((r) => (
<tr key={r.id} className="border-t">
{columns.map((c) => (
<td key={c.key} className="px-3 py-2 text-gray-800">{c.render ? c.render(r[c.key], r) : r[c.key]}</td>
))}
{(onEdit || onDelete) && (
<td className="px-3 py-2 text-right">
{onEdit && (
<button onClick={() => onEdit(r)} className="px-2 py-1 border rounded mr-2">Edit</button>
)}
{onDelete && (
<button onClick={() => onDelete(r)} className="px-2 py-1 border rounded">Delete</button>
)}
</td>
)}
</tr>
))}
</tbody>
</table>
</div>
);
}