import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../common/DataTable';
import ReceiverForm from '../forms/ReceiverForm';
import { listReceivers, deleteReceiver } from '../../services/receivers';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

export default function ReceiversPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listReceivers();
      setRows(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load receivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { 
      key: 'company', 
      label: 'Company', 
      render: (_v, r) => r.company_name || r.companyName || '—' 
    },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { 
      key: 'location', 
      label: 'Location', 
      render: (_v, r) => {
        const estate = r.estate_town || r.estateTown;
        const street = r.street_address || r.streetAddress;
        if (estate && street) return `${estate}, ${street}`;
        return estate || street || r.address || '—';
      }
    },
  ];

  const handleDelete = async (receiver) => {
    if (!window.confirm(`Are you sure you want to delete receiver "${receiver.name}"?`)) {
      return;
    }
    
    try {
      await deleteReceiver(receiver.id);
      await load(); // Reload the list after deletion
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete receiver');
    }
  };

  const handleEdit = (receiver) => {
    setEditing(receiver);
  };

  const handleSave = async () => {
    setEditing(null);
    await load(); // Reload the list after save
  };

  const handleCancel = () => {
    setEditing(null);
  };

  if (loading) return <Loading message="Loading receivers..." />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Receivers</h2>
        <button 
          onClick={() => setEditing({})}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Receiver
        </button>
      </div>

      {error && <ErrorMessage error={error} />}

      <DataTable 
        columns={columns}
        rows={rows}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {editing !== null && (
        <ReceiverForm
          entry={editing && editing.id ? editing : {}}
          onClose={handleCancel}
          onSaved={handleSave}
        />
      )}
    </div>
  );
}