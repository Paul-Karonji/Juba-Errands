import React, { useEffect, useState } from 'react';
import DataTable from '../common/DataTable';
import SenderForm from '../forms/SenderForm';
import { listSenders, deleteSender } from '../../services/senders';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

export default function SendersPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listSenders();
      setRows(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load senders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
  ];

  const onDelete = async (r) => {
    if (!window.confirm(`Delete sender ${r.name}?`)) return;
    try {
      await deleteSender(r.id);
      load();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete sender');
    }
  };

  const handleSaved = () => {
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Senders</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setEditing({})}
        >
          New Sender
        </button>
      </div>

      {error && <ErrorMessage error={error} />}
      
      {loading ? (
        <Loading message="Loading senders..." />
      ) : (
        <DataTable 
          columns={columns} 
          rows={rows} 
          onEdit={setEditing} 
          onDelete={onDelete} 
        />
      )}

      {editing !== null && (
        <SenderForm
          entry={editing && editing.id ? editing : {}}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}