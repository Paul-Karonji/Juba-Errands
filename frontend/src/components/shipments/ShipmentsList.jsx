import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../common/DataTable';
import ShipmentForm from '../forms/ShipmentForm';
import { listShipments, deleteShipment } from '../../services/shipments';


export default function ShipmentsList() {
const [rows, setRows] = useState([]);
const [query, setQuery] = useState('');
const [editing, setEditing] = useState(null); // null = closed, {} = create, object = edit
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');


const load = async () => {
setLoading(true); setError('');
try {
const { data } = await listShipments();
setRows(Array.isArray(data) ? data : (data?.items || []));
} catch (e) {
setError(e.response?.data?.message || e.message || 'Failed to load shipments');
} finally {
setLoading(false);
}
};


useEffect(() => { load(); }, []);


const filtered = useMemo(() => {
if (!query) return rows;
const q = query.toLowerCase();
return rows.filter((r) =>
String(r.id ?? '').toLowerCase().includes(q) ||
String(r.waybill_no ?? r.waybillNo ?? '').toLowerCase().includes(q) ||
String(r.sender_name ?? r.senderName ?? '').toLowerCase().includes(q) ||
String(r.receiver_name ?? r.receiverName ?? '').toLowerCase().includes(q) ||
String(r.status ?? '').toLowerCase().includes(q)
);
}, [rows, query]);


const columns = [
{ key: 'id', label: 'ID' },
{ key: 'waybill', label: 'Waybill', render: (_v, r) => r.waybill_no ?? r.waybillNo ?? '—' },
{ key: 'date', label: 'Date', render: (_v, r) => (r.date ? new Date(r.date).toLocaleDateString() : '—') },
{ key: 'sender', label: 'Sender', render: (_v, r) => r.sender_name ?? r.senderName ?? '—' },
{ key: 'receiver', label: 'Receiver', render: (_v, r) => r.receiver_name ?? r.receiverName ?? '—' },
{ key: 'delivery', label: 'Delivery', render: (_v, r) => r.delivery_location ?? r.deliveryLocation ?? '—' },
{ key: 'status', label: 'Status', render: (_v, r) => r.status ?? '—' },
];


const onDelete = async (r) => {
if (!window.confirm(`Delete shipment ${r.waybill_no ?? r.waybillNo ?? r.id}?`)) return;
await deleteShipment(r.id);
load();
};


return (
<div className="space-y-4">
<div className="flex items-center justify-between gap-3">
<h2 className="text-lg font-semibold">Shipments</h2>
<div className="flex items-center gap-2">
<input
value={query}
onChange={(e) => setQuery(e.target.value)}
placeholder="Search by waybill, sender, receiver, status"
className="border rounded px-3 py-2 w-72"
/>
<button className="border rounded px-3 py-2" onClick={() => setEditing({})}>New Shipment</button>
</div>
</div>


{error && <div className="text-red-600 text-sm">{error}</div>}
{loading ? (
<div className="p-4 bg-white border rounded">Loading…</div>
) : (
<DataTable columns={columns} rows={filtered} onEdit={setEditing} onDelete={onDelete} />
)}


{editing !== null && (
<ShipmentForm
shipment={editing && editing.id ? editing : undefined}
onClose={() => setEditing(null)}
onSaved={() => { setEditing(null); load(); }}
/>
)}
</div>
);
}