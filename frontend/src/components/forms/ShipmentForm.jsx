// frontend/src/components/forms/ShipmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useCreateShipment, useUpdateShipment } from '../../hooks/useShipments';
import { SHIPMENT_STATUS, PAYMENT_METHODS } from '../../utils/constants';
import { calculateChargesTotal } from '../../utils/helpers';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormSection from './FormSection';
import Loading from '../common/Loading';

// Dummy options (replace with API-fetched sender/receiver lists)
const senderOptions = [
  { value: '1', label: 'Sender One' },
  { value: '2', label: 'Sender Two' }
];
const receiverOptions = [
  { value: '10', label: 'Receiver A' },
  { value: '20', label: 'Receiver B' }
];

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

const ShipmentForm = ({ shipment, onClose, onSuccess }) => {
  const createMutation = useCreateShipment();
  const updateMutation = useUpdateShipment();

  const [formData, setFormData] = useState({
    waybillNo: shipment?.waybillNo || '',
    date: shipment?.date || new Date().toISOString().split('T')[0],
    senderId: shipment?.senderId || '',
    receiverId: shipment?.receiverId || '',
    quantity: shipment?.quantity || '',
    weightKg: shipment?.weightKg || '',
    description: shipment?.description || '',
    commercialValue: shipment?.commercialValue || '',
    deliveryLocation: shipment?.deliveryLocation || '',
    status: shipment?.status || SHIPMENT_STATUS.PENDING,
    notes: shipment?.notes || '',
    receiptReference: shipment?.receiptReference || '',
    courierName: shipment?.courierName || '',
    staffNo: shipment?.staffNo || '',
    charges: shipment?.charges || {
      baseCharge: '', other: '', insurance: '', extraDelivery: '', vat: '', total: ''
    },
    payment: shipment?.payment || {
      payerAccountNo: '', paymentMethod: PAYMENT_METHODS.CASH
    }
  });

  const [errors, setErrors] = useState({});

  const updateNestedField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { baseCharge, other, insurance, extraDelivery, vat } = formData.charges;

  useEffect(() => {
    const partial = calculateChargesTotal({
      base: baseCharge,
      insurance,
      extraDelivery,
      vat,
    });
    const total = num(partial) + num(other);

    setFormData(prev => ({
      ...prev,
      charges: { ...prev.charges, total: total.toFixed(2) },
    }));
  }, [baseCharge, other, insurance, extraDelivery, vat]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.includes('.') ? name.split('.') : [null, name];

    if (section) {
      updateNestedField(section, field, value);
    } else {
      updateField(field, value);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.waybillNo) newErrors.waybillNo = 'Waybill number is required';
    if (!formData.senderId) newErrors.senderId = 'Sender is required';
    if (!formData.receiverId) newErrors.receiverId = 'Receiver is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.weightKg) newErrors.weightKg = 'Weight is required';
    if (!formData.description) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (shipment?.id) {
        await updateMutation.mutateAsync({ id: shipment.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {shipment ? 'Edit Shipment' : 'New Shipment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {isLoading && <Loading message="Processing shipment..." />}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Waybill Number"
              name="waybillNo"
              value={formData.waybillNo}
              onChange={handleInputChange}
              required
              error={errors.waybillNo}
              placeholder="e.g., WB2024001"
            />
            <FormInput
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              error={errors.date}
            />
            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={Object.values(SHIPMENT_STATUS)}
              error={errors.status}
            />
          </div>

          {/* Sender/Receiver */}
          <FormSection title="Parties">
            <FormSelect
              label="Sender"
              name="senderId"
              value={formData.senderId}
              onChange={handleInputChange}
              options={senderOptions}
              required
              error={errors.senderId}
              placeholder="Select a sender..."
            />
            <FormSelect
              label="Receiver"
              name="receiverId"
              value={formData.receiverId}
              onChange={handleInputChange}
              options={receiverOptions}
              required
              error={errors.receiverId}
              placeholder="Select a receiver..."
            />
          </FormSection>

          {/* Shipment Details */}
          <FormSection title="Shipment Details">
            <FormInput label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required error={errors.quantity} />
            <FormInput label="Weight (KG)" name="weightKg" type="number" step="0.1" value={formData.weightKg} onChange={handleInputChange} required error={errors.weightKg} />
            <FormInput label="Commercial Value" name="commercialValue" type="number" step="0.01" value={formData.commercialValue} onChange={handleInputChange} error={errors.commercialValue} />
            <div className="md:col-span-2">
              <FormInput label="Description" name="description" value={formData.description} onChange={handleInputChange} required error={errors.description} />
            </div>
            <FormInput label="Delivery Location" name="deliveryLocation" value={formData.deliveryLocation} onChange={handleInputChange} error={errors.deliveryLocation} />
            <FormInput label="Receipt Reference" name="receiptReference" value={formData.receiptReference} onChange={handleInputChange} error={errors.receiptReference} />
            <FormInput label="Courier Name" name="courierName" value={formData.courierName} onChange={handleInputChange} error={errors.courierName} />
            <FormInput label="Staff No" name="staffNo" value={formData.staffNo} onChange={handleInputChange} error={errors.staffNo} />
            <div className="md:col-span-2">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </FormSection>

          {/* Charges */}
          <FormSection title="Charges">
            <FormInput label="Base Charge" name="charges.baseCharge" type="number" step="0.01" value={formData.charges.baseCharge} onChange={handleInputChange} error={errors['charges.baseCharge']} />
            <FormInput label="Other" name="charges.other" type="number" step="0.01" value={formData.charges.other} onChange={handleInputChange} error={errors['charges.other']} />
            <FormInput label="Insurance" name="charges.insurance" type="number" step="0.01" value={formData.charges.insurance} onChange={handleInputChange} error={errors['charges.insurance']} />
            <FormInput label="Extra Delivery" name="charges.extraDelivery" type="number" step="0.01" value={formData.charges.extraDelivery} onChange={handleInputChange} error={errors['charges.extraDelivery']} />
            <FormInput label="VAT" name="charges.vat" type="number" step="0.01" value={formData.charges.vat} onChange={handleInputChange} error={errors['charges.vat']} />
            <FormInput label="Total Charges" name="charges.total" type="number" step="0.01" value={formData.charges.total} readOnly error={errors['charges.total']} />
          </FormSection>

          {/* Payment Information */}
          <FormSection title="Payment Information">
            <FormInput label="Payer Account No" name="payment.payerAccountNo" value={formData.payment.payerAccountNo} onChange={handleInputChange} error={errors['payment.payerAccountNo']} />
            <FormSelect label="Payment Method" name="payment.paymentMethod" value={formData.payment.paymentMethod} onChange={handleInputChange} options={Object.values(PAYMENT_METHODS)} error={errors['payment.paymentMethod']} />
          </FormSection>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? 'Processing...'
                : shipment
                ? 'Update Shipment'
                : 'Create Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentForm;
