import React, { useEffect, useState } from 'react';
import DataTable from '../common/DataTable';
import ChargesForm from '../forms/ChargesForm';
import { listCharges, deleteCharges } from '../../services/charges';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

export default function ChargesPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listCharges();
      setRows(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load charges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { 
      key: 'shipmentId', 
      label: 'Shipment ID',
      render: (_v, r) => r.shipment_id || r.shipmentId || '—'
    },
    { 
      key: 'baseCharge', 
      label: 'Base Charge', 
      render: (_v, r) => {
        const value = r.base_charge || r.baseCharge;
        return value ? `KES ${parseFloat(value).toFixed(2)}` : '—';
      }
    },
    { 
      key: 'other', 
      label: 'Other', 
      render: (v) => v ? `KES ${parseFloat(v).toFixed(2)}` : '—' 
    },
    { 
      key: 'insurance', 
      label: 'Insurance', 
      render: (v) => v ? `KES ${parseFloat(v).toFixed(2)}` : '—' 
    },
    { 
      key: 'extraDelivery', 
      label: 'Extra Delivery', 
      render: (_v, r) => {
        const value = r.extra_delivery || r.extraDelivery;
        return value ? `KES ${parseFloat(value).toFixed(2)}` : '—';
      }
    },
    { 
      key: 'vat', 
      label: 'VAT', 
      render: (v) => v ? `KES ${parseFloat(v).toFixed(2)}` : '—' 
    },
    { 
      key: 'total', 
      label: 'Total', 
      render: (v) => v ? `KES ${parseFloat(v).toFixed(2)}` : '—' 
    },
  ];

  const onDelete = async (r) => {
    const shipmentId = r.shipment_id || r.shipmentId;
    if (!window.confirm(`Delete charges for shipment ${shipmentId}?`)) return;
    try {
      await deleteCharges(r.id);
      load();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete charges');
    }
  };

  const handleSaved = () => {
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Charges</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setEditing({})}
        >
          New Charges
        </button>
      </div>

      {error && <ErrorMessage error={error} />}
      
      {loading ? (
        <Loading message="Loading charges..." />
      ) : (
        <DataTable 
          columns={columns} 
          rows={rows} 
          onEdit={setEditing} 
          onDelete={onDelete} 
        />
      )}

      {editing !== null && (
        <ChargesForm
          entry={editing && editing.id ? editing : {}}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}