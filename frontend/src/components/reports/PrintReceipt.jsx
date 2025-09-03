import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

/**
 * PrintReceipt
 * Props:
 *  - shipment: {
 *      waybill_no / waybillNo, date, sender_name/senderName, receiver_name/receiverName,
 *      delivery_location/deliveryLocation, description, quantity, weight_kg/weightKg,
 *      commercial_value/commercialValue, status,
 *      charges?: { base, insurance, extraDelivery, vat, total }
 *      payment?: { paymentMethod, amountPaid, payerAccountNo }
 *    }
 */
export default function PrintReceipt({ shipment }) {
  const ref = useRef(null);
  const handlePrint = useReactToPrint({ content: () => ref.current });

  if (!shipment) {
    return <div className="p-4 bg-white border rounded">No shipment selected.</div>;
  }

  // normalize fields regardless of snake/camel case
  const n = (r, ...keys) => keys.reduce((v, k) => v ?? r?.[k], undefined);
  const waybill = n(shipment, 'waybill_no', 'waybillNo');
  const sender = n(shipment, 'sender_name', 'senderName');
  const receiver = n(shipment, 'receiver_name', 'receiverName');
  const delivery = n(shipment, 'delivery_location', 'deliveryLocation');
  const weight = n(shipment, 'weight_kg', 'weightKg');
  const value = n(shipment, 'commercial_value', 'commercialValue');
  const date = shipment.date ? new Date(shipment.date).toLocaleString() : '—';
  const charges = shipment.charges || shipment;
  const payment = shipment.payment || shipment;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Print Receipt</h3>
        <button onClick={handlePrint} className="px-3 py-2 border rounded bg-white">
          Print
        </button>
      </div>

      <div ref={ref} className="bg-white border rounded p-6 text-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Juba Errands — Waybill Receipt</h1>
            <p className="text-gray-500">Nairobi Branch</p>
          </div>
          <div className="text-right">
            <div className="font-semibold">Waybill: {waybill || '—'}</div>
            <div className="text-gray-600">Date: {date}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="border rounded p-3">
            <h4 className="font-semibold mb-2">Sender</h4>
            <div>Name: {sender || '—'}</div>
          </section>
          <section className="border rounded p-3">
            <h4 className="font-semibold mb-2">Receiver</h4>
            <div>Name: {receiver || '—'}</div>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <section className="border rounded p-3">
            <h4 className="font-semibold mb-2">Shipment Details</h4>
            <div>Delivery Location: {delivery || '—'}</div>
            <div>Description: {shipment.description || '—'}</div>
            <div>Quantity: {shipment.quantity ?? '—'}</div>
            <div>Weight (kg): {weight ?? '—'}</div>
            <div>Commercial Value: {value ?? '—'}</div>
            <div>Status: {shipment.status || '—'}</div>
          </section>
          <section className="border rounded p-3">
            <h4 className="font-semibold mb-2">Charges & Payment</h4>
            <div>Base: {charges.base ?? '—'}</div>
            <div>Insurance: {charges.insurance ?? '—'}</div>
            <div>Extra Delivery: {charges.extraDelivery ?? '—'}</div>
            <div>VAT: {charges.vat ?? '—'}</div>
            <div className="font-semibold">Total: {charges.total ?? '—'}</div>
            <div className="mt-2">Payment Method: {payment.paymentMethod || '—'}</div>
            <div>Amount Paid: {payment.amountPaid ?? '—'}</div>
            <div>Payer Acc No: {payment.payerAccountNo || '—'}</div>
          </section>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          This receipt is system-generated and valid without a signature.
        </div>
      </div>
    </div>
  );
}
