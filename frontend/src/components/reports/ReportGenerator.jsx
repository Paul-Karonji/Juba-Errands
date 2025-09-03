import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { getShipmentsByDateRange, getRevenueSummary } from '../../services/reportService';
import { toNumber } from '../../utils/helpers';

export default function ReportGenerator() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!from || !to) {
      setError('Please select a start and end date');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const [shipments, revenue] = await Promise.all([
        getShipmentsByDateRange(from, to),
        getRevenueSummary(from, to),
      ]);

      setRows(shipments);
      setSummary(revenue);
    } catch (e) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const header = [
      'Waybill',
      'Date',
      'Sender',
      'Receiver',
      'Delivery',
      'Status',
      'Base',
      'Insurance',
      'Extra',
      'VAT',
      'Total',
      'Paid',
      'Method',
    ];
    const lines = rows.map((r) => {
      const get = (obj, ...keys) => keys.reduce((v, k) => v ?? obj?.[k], undefined);
      const waybill = get(r, 'waybill_no', 'waybillNo') ?? '';
      const sender = get(r, 'sender_name', 'senderName') ?? '';
      const receiver = get(r, 'receiver_name', 'receiverName') ?? '';
      const delivery = get(r, 'delivery_location', 'deliveryLocation') ?? '';
      const date = r.date ? new Date(r.date).toISOString() : '';
      const status = r.status ?? '';
      const base = r.base ?? '';
      const insurance = r.insurance ?? '';
      const extra = r.extraDelivery ?? '';
      const vat = r.vat ?? '';
      const total = r.total ?? '';
      const paid = r.amountPaid ?? '';
      const method = r.paymentMethod ?? '';
      return [
        waybill, date, sender, receiver, delivery, status,
        base, insurance, extra, vat, total, paid, method,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const blob = new Blob(
      [header.join(',') + '\n' + lines.join('\n')],
      { type: 'text/csv;charset=utf-8;' }
    );
    saveAs(blob, `shipments_${from}_to_${to}.csv`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    doc.setFontSize(14);
    doc.text('Juba Errands — Shipments Report', margin, y);
    y += 18;
    doc.setFontSize(10);
    doc.text(`Period: ${from} to ${to}`, margin, y);
    y += 14;

    if (summary) {
      const totalRevenue = [
        'Total revenue:',
        String(summary.totalRevenue ?? summary.total ?? 0),
      ].join(' ');
      doc.text(totalRevenue, margin, y);
      y += 16;
    }

    // Table header
    const headers = ['Waybill', 'Date', 'Sender', 'Receiver', 'Status', 'Total'];
    doc.setFont(undefined, 'bold');
    doc.text(headers.join('   '), margin, y);
    doc.setFont(undefined, 'normal');
    y += 14;

    rows.forEach((r) => {
      const get = (obj, ...keys) => keys.reduce((v, k) => v ?? obj?.[k], undefined);
      const waybill = get(r, 'waybill_no', 'waybillNo') ?? '—';
      const date = r.date ? new Date(r.date).toLocaleDateString() : '—';
      const sender = get(r, 'sender_name', 'senderName') ?? '—';
      const receiver = get(r, 'receiver_name', 'receiverName') ?? '—';
      const status = r.status ?? '—';
      const total = toNumber(r.total ?? r.charges?.total ?? 0).toFixed(2);

      const line = [waybill, date, sender, receiver, status, total].join('   ');
      if (y > 780) { // new page
        doc.addPage(); y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    });

    doc.save(`shipments_${from}_to_${to}.pdf`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Report Generator</h3>

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">From</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">To</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <button onClick={load} disabled={loading} className="px-3 py-2 border rounded bg-white">
          {loading ? 'Loading…' : 'Load'}
        </button>
        <button onClick={exportCSV} disabled={!rows.length} className="px-3 py-2 border rounded bg-white">
          Export CSV
        </button>
        <button onClick={exportPDF} disabled={!rows.length} className="px-3 py-2 border rounded bg-white">
          Export PDF
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {!!rows.length && (
        <div className="overflow-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Waybill</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Sender</th>
                <th className="px-3 py-2 text-left">Receiver</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const get = (obj, ...keys) => keys.reduce((v, k) => v ?? obj?.[k], undefined);
                const waybill = get(r, 'waybill_no', 'waybillNo') ?? '—';
                const date = r.date ? new Date(r.date).toLocaleDateString() : '—';
                const sender = get(r, 'sender_name', 'senderName') ?? '—';
                const receiver = get(r, 'receiver_name', 'receiverName') ?? '—';
                const status = r.status ?? '—';
                const total = toNumber(r.total ?? r.charges?.total ?? 0).toFixed(2);

                return (
                  <tr key={`${waybill}-${date}`} className="border-t">
                    <td className="px-3 py-2">{waybill}</td>
                    <td className="px-3 py-2">{date}</td>
                    <td className="px-3 py-2">{sender}</td>
                    <td className="px-3 py-2">{receiver}</td>
                    <td className="px-3 py-2">{status}</td>
                    <td className="px-3 py-2">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
