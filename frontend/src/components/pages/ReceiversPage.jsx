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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receiver?')) {
      return;
    }
    
    try {
      await deleteReceiver(id);
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

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="receivers-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receivers</h1>
        <button 
          onClick={() => setEditing({})}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Receiver
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <DataTable 
        columns={columns}
        rows={rows}
      />

      {editing && (
        <ReceiverForm
          receiver={editing}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}