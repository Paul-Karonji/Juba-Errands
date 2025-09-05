// Fixed PaymentForm.jsx
import React, { useEffect, useState } from 'react';
import FormSection from './FormSection';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { createPayment, updatePayment } from '../../services/payments';
import { listShipments } from '../../services/shipments';

const METHODS = ['Cash', 'M-Pesa', 'Bank', 'Card'];

export default function PaymentForm({ entry = {}, shipmentId: forcedShipmentId, onClose, onSaved }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({ 
    shipmentId: '', 
    payerAccountNo: '', 
    paymentMethod: 'Cash', 
    amountPaid: 0 
  });

  useEffect(() => {
    if (entry && entry.id) {
      setForm({
        shipmentId: entry.shipmentId || entry.shipment_id || '',
        payerAccountNo: entry.payerAccountNo || entry.payer_account_no || '',
        paymentMethod: entry.paymentMethod || entry.payment_method || 'Cash',
        amountPaid: entry.amountPaid || entry.amount_paid || 0,
      });
    }
  }, [entry]);

  useEffect(() => {
    if (forcedShipmentId) {
      setForm((f) => ({ ...f, shipmentId: forcedShipmentId }));
    }
  }, [forcedShipmentId]);

  // Load shipments for dropdown
  useEffect(() => {
    const loadShipments = async () => {
      try {
        const { data } = await listShipments();
        const shipmentsArray = Array.isArray(data) ? data : (data?.items || []);
        setShipments(shipmentsArray);
      } catch (error) {
        console.error('Error loading shipments:', error);
      }
    };
    loadShipments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.shipmentId) {
      setErrors({ shipmentId: 'Please select a shipment' });
      return;
    }

    setIsLoading(true); 
    setErrors({});
    try {
      const payload = {
        shipment_id: Number(form.shipmentId) || null,
        payer_account_no: form.payerAccountNo,
        payment_method: form.paymentMethod,
        amount_paid: Number(form.amountPaid) || 0,
      };
      if (entry.id) {
        await updatePayment(entry.id, payload);
      } else {
        await createPayment(payload);
      }
      onSaved?.();
    } catch (err) {
      setErrors({ form: err.response?.data?.message || err.message });
    } finally { 
      setIsLoading(false); 
    }
  };

  const shipmentOptions = shipments.map(shipment => ({
    value: shipment.id,
    label: `${shipment.waybill_no || shipment.waybillNo || shipment.id} - ${shipment.sender_name || shipment.senderName || 'Unknown Sender'}`
  }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-4">
          {entry.id ? 'Edit Payment' : 'New Payment'}
        </h3>
        
        {errors.form && (
          <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={submit} className="space-y-6">
          <FormSection title="Payment">
            {!forcedShipmentId && (
              <div className="md:col-span-2">
                <FormSelect
                  label="Shipment"
                  name="shipmentId"
                  value={form.shipmentId}
                  onChange={handleChange}
                  options={shipmentOptions}
                  required
                  error={errors.shipmentId}
                  placeholder="Select a shipment..."
                />
              </div>
            )}
            
            <FormInput 
              label="Payer Account No" 
              name="payerAccountNo" 
              value={form.payerAccountNo} 
              onChange={handleChange}
              error={errors.payerAccountNo}
            />
            <FormSelect 
              label="Payment Method" 
              name="paymentMethod" 
              value={form.paymentMethod} 
              onChange={handleChange} 
              options={METHODS}
              error={errors.paymentMethod}
            />
            <FormInput 
              label="Amount Paid" 
              name="amountPaid" 
              type="number" 
              step="0.01" 
              min="0"
              value={form.amountPaid} 
              onChange={handleChange}
              error={errors.amountPaid}
            />
          </FormSection>
          
          <div className="flex justify-end gap-3 border-t pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}