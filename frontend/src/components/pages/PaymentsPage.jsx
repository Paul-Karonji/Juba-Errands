import React, { useEffect, useState } from 'react';
import DataTable from '../common/DataTable';
import PaymentForm from '../forms/PaymentForm';
import { listPayments, deletePayment } from '../../services/payments';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listPayments();
      setRows(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'shipmentId', label: 'Shipment ID' },
    { key: 'payerAccountNo', label: 'Payer Account' },
    { key: 'paymentMethod', label: 'Method' },
    { key: 'amountPaid', label: 'Amount', render: (v) => v ? `${parseFloat(v).toFixed(2)}` : '—' },
  ];

  const onDelete = async (r) => {
    if (!window.confirm(`Delete payment for shipment ${r.shipmentId}?`)) return;
    try {
      await deletePayment(r.id);
      load();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete payment');
    }
  };

  const handleSaved = () => {
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payments</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setEditing({})}
        >
          New Payment
        </button>
      </div>

      {error && <ErrorMessage error={error} />}
      
      {loading ? (
        <Loading message="Loading payments..." />
      ) : (
        <DataTable 
          columns={columns} 
          rows={rows} 
          onEdit={setEditing} 
          onDelete={onDelete} 
        />
      )}

      {editing !== null && (
        <PaymentForm
          entry={editing && editing.id ? editing : {}}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}