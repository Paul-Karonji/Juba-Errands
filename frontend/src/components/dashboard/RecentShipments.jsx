import React from 'react';

export default function RecentShipments({ shipments = [] }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Recent Shipments</h3>
      {!shipments.length ? (
        <div className="text-sm text-gray-500">No recent shipments</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Waybill</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Sender</th>
                <th className="px-3 py-2 text-left">Receiver</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((r, i) => {
                const get = (o, ...k) => k.reduce((v, kk) => v ?? o?.[kk], undefined);
                const waybill = get(r, 'waybill_no', 'waybillNo') ?? '—';
                const date = r.date ? new Date(r.date).toLocaleDateString() : '—';
                const sender = get(r, 'sender_name', 'senderName') ?? '—';
                const receiver = get(r, 'receiver_name', 'receiverName') ?? '—';
                const status = r.status ?? '—';
                return (
                  <tr key={`${waybill}-${i}`} className="border-t">
                    <td className="px-3 py-2">{waybill}</td>
                    <td className="px-3 py-2">{date}</td>
                    <td className="px-3 py-2">{sender}</td>
                    <td className="px-3 py-2">{receiver}</td>
                    <td className="px-3 py-2">{status}</td>
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
