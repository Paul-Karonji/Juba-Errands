import React, { useEffect, useState } from 'react';
import FormSection from './FormSection';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { createCharges, updateCharges } from '../../services/charges';
import { listShipments } from '../../services/shipments';

export default function ChargesForm({ entry = {}, shipmentId: forcedShipmentId, onClose, onSaved }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({
    shipmentId: '',
    baseCharge: 0,
    other: 0,
    insurance: 0,
    extraDelivery: 0,
    vat: 0,
    total: 0,
    currency: 'KES'
  });

  useEffect(() => {
    if (entry && entry.id) {
      setForm({
        shipmentId: entry.shipmentId || entry.shipment_id || '',
        baseCharge: entry.baseCharge || entry.base_charge || 0,
        other: entry.other || 0,
        insurance: entry.insurance || 0,
        extraDelivery: entry.extraDelivery || entry.extra_delivery || 0,
        vat: entry.vat || 0,
        total: entry.total || 0,
        currency: entry.currency || 'KES'
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

  useEffect(() => {
    const n = (x) => (isNaN(parseFloat(x)) ? 0 : parseFloat(x));
    const total = n(form.baseCharge) + n(form.insurance) + n(form.extraDelivery) + n(form.vat) + n(form.other);
    setForm((f) => ({ ...f, total }));
  }, [form.baseCharge, form.insurance, form.extraDelivery, form.vat, form.other]);

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
        shipment_id: Number(form.shipmentId),
        base_charge: Number(form.baseCharge) || 0,
        other: Number(form.other) || 0,
        insurance: Number(form.insurance) || 0,
        extra_delivery: Number(form.extraDelivery) || 0,
        vat: Number(form.vat) || 0,
        total: Number(form.total) || 0,
        currency: form.currency || 'KES'
      };
      
      if (entry.id) {
        await updateCharges(entry.id, payload);
      } else {
        await createCharges(payload);
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
          {entry.id ? 'Edit Charges' : 'New Charges'}
        </h3>
        
        {errors.form && (
          <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={submit} className="space-y-6">
          <FormSection title="Charges">
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
              label="Base Charge"
              name="baseCharge"
              type="number"
              step="0.01"
              value={form.baseCharge}
              onChange={handleChange}
            />
            <FormInput
              label="Other Charges"
              name="other"
              type="number"
              step="0.01"
              value={form.other}
              onChange={handleChange}
            />
            <FormInput
              label="Insurance"
              name="insurance"
              type="number"
              step="0.01"
              value={form.insurance}
              onChange={handleChange}
            />
            <FormInput
              label="Extra Delivery"
              name="extraDelivery"
              type="number"
              step="0.01"
              value={form.extraDelivery}
              onChange={handleChange}
            />
            <FormInput
              label="VAT"
              name="vat"
              type="number"
              step="0.01"
              value={form.vat}
              onChange={handleChange}
            />
            <FormInput
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              placeholder="KES"
            />
            <FormInput
              label="Total"
              name="total"
              type="number"
              step="0.01"
              value={form.total}
              readOnly
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