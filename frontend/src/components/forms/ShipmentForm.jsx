// frontend/src/components/forms/ShipmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useCreateShipment, useUpdateShipment } from '../../hooks/useShipments';
import { SHIPMENT_STATUS, PAYMENT_METHODS } from '../../utils/constants';
import { calculateChargesTotal } from '../../utils/helpers';
import { listSenders } from '../../services/senders';
import { listReceivers } from '../../services/receivers';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormSection from './FormSection';
import FormTextarea from './FormTextarea';
import Loading from '../common/Loading';

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

const ShipmentForm = ({ shipment, onClose, onSuccess }) => {
  const createMutation = useCreateShipment();
  const updateMutation = useUpdateShipment();

  // State for senders and receivers lists
  const [senders, setSenders] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    waybillNo: shipment?.waybillNo || shipment?.waybill_no || '',
    date: shipment?.date || new Date().toISOString().split('T')[0],
    senderId: shipment?.senderId || shipment?.sender_id || '',
    receiverId: shipment?.receiverId || shipment?.receiver_id || '',
    quantity: shipment?.quantity || 1,
    weightKg: shipment?.weightKg || shipment?.weight_kg || '',
    description: shipment?.description || '',
    commercialValue: shipment?.commercialValue || shipment?.commercial_value || '',
    deliveryLocation: shipment?.deliveryLocation || shipment?.delivery_location || '',
    status: shipment?.status || SHIPMENT_STATUS.PENDING,
    notes: shipment?.notes || '',
    receiptReference: shipment?.receiptReference || shipment?.receipt_reference || '',
    courierName: shipment?.courierName || shipment?.courier_name || '',
    staffNo: shipment?.staffNo || shipment?.staff_no || '',
    charges: {
      baseCharge: shipment?.charges?.baseCharge || shipment?.base_charge || '',
      other: shipment?.charges?.other || shipment?.other || '',
      insurance: shipment?.charges?.insurance || shipment?.insurance || '',
      extraDelivery: shipment?.charges?.extraDelivery || shipment?.extra_delivery || '',
      vat: shipment?.charges?.vat || shipment?.vat || '',
      total: shipment?.charges?.total || shipment?.total || '',
      currency: shipment?.charges?.currency || shipment?.currency || 'KES'
    },
    payment: {
      payerAccountNo: shipment?.payment?.payerAccountNo || shipment?.payer_account_no || '',
      paymentMethod: shipment?.payment?.paymentMethod || shipment?.payment_method || PAYMENT_METHODS.CASH,
      amountPaid: shipment?.payment?.amountPaid || shipment?.amount_paid || ''
    }
  });

  const [errors, setErrors] = useState({});

  // Load senders and receivers on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [sendersResponse, receiversResponse] = await Promise.all([
          listSenders(),
          listReceivers()
        ]);
        
        const sendersData = Array.isArray(sendersResponse.data) ? sendersResponse.data : sendersResponse.data?.items || [];
        const receiversData = Array.isArray(receiversResponse.data) ? receiversResponse.data : receiversResponse.data?.items || [];
        
        setSenders(sendersData);
        setReceivers(receiversData);
      } catch (error) {
        console.error('Error loading senders/receivers:', error);
        setErrors({ form: 'Failed to load senders and receivers. Please try again.' });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [section, subField] = field.split('.');
        return {
          ...prev,
          [section]: { ...prev[section], [subField]: value }
        };
      }
      return { ...prev, [field]: value };
    });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Destructure charges for precise dependencies
  const { baseCharge, other, insurance, extraDelivery, vat } = formData.charges;

  // Auto-calculate total whenever any charge field changes
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
    updateField(name, value);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.waybillNo?.trim()) newErrors.waybillNo = 'Waybill number is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.senderId) newErrors.senderId = 'Sender is required';
    if (!formData.receiverId) newErrors.receiverId = 'Receiver is required';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!formData.weightKg || formData.weightKg <= 0) newErrors.weightKg = 'Weight must be greater than 0';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';

    // Business logic validation
    if (formData.senderId === formData.receiverId) {
      newErrors.receiverId = 'Receiver must be different from sender';
    }

    // Date validation (not in the future beyond today)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (selectedDate > today) {
      newErrors.date = 'Date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Prepare data for API (convert to snake_case to match database schema)
      const apiData = {
        waybill_no: formData.waybillNo.trim(),
        date: formData.date,
        sender_id: parseInt(formData.senderId),
        receiver_id: parseInt(formData.receiverId),
        quantity: parseInt(formData.quantity) || 1,
        weight_kg: parseFloat(formData.weightKg) || 0,
        description: formData.description.trim(),
        commercial_value: parseFloat(formData.commercialValue) || 0,
        delivery_location: formData.deliveryLocation?.trim() || '',
        status: formData.status,
        notes: formData.notes?.trim() || '',
        receipt_reference: formData.receiptReference?.trim() || '',
        courier_name: formData.courierName?.trim() || '',
        staff_no: formData.staffNo?.trim() || '',
        // Charges
        base_charge: parseFloat(formData.charges.baseCharge) || 0,
        other: parseFloat(formData.charges.other) || 0,
        insurance: parseFloat(formData.charges.insurance) || 0,
        extra_delivery: parseFloat(formData.charges.extraDelivery) || 0,
        vat: parseFloat(formData.charges.vat) || 0,
        total: parseFloat(formData.charges.total) || 0,
        currency: formData.charges.currency || 'KES',
        // Payment
        payer_account_no: formData.payment.payerAccountNo?.trim() || '',
        payment_method: formData.payment.paymentMethod,
        amount_paid: parseFloat(formData.payment.amountPaid) || 0
      };

      if (shipment?.id) {
        await updateMutation.mutateAsync({ id: shipment.id, ...apiData });
      } else {
        await createMutation.mutateAsync(apiData);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ 
        form: error.response?.data?.message || error.message || 'An error occurred while saving the shipment' 
      });
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  // Format options for select dropdowns
  const senderOptions = senders.map(sender => ({
    value: sender.id,
    label: `${sender.name}${sender.company_name ? ` (${sender.company_name})` : ''}${sender.email ? ` - ${sender.email}` : ''}`
  }));

  const receiverOptions = receivers.map(receiver => ({
    value: receiver.id,
    label: `${receiver.name}${receiver.company_name ? ` (${receiver.company_name})` : ''}${receiver.email ? ` - ${receiver.email}` : ''}`
  }));

  if (loadingOptions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <Loading message="Loading form data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {shipment ? 'Edit Shipment' : 'New Shipment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-light"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              <strong>Error:</strong> {errors.form}
            </div>
          )}

          {/* Basic Information */}
          <FormSection title="Basic Information">
            <FormInput
              label="Waybill Number"
              name="waybillNo"
              value={formData.waybillNo}
              onChange={handleInputChange}
              required
              error={errors.waybillNo}
              placeholder="Enter unique waybill number"
            />
            <FormInput
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              error={errors.date}
              max={new Date().toISOString().split('T')[0]}
            />
            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={Object.values(SHIPMENT_STATUS)}
              error={errors.status}
            />
            <FormInput
              label="Receipt Reference"
              name="receiptReference"
              value={formData.receiptReference}
              onChange={handleInputChange}
              error={errors.receiptReference}
              placeholder="Optional receipt reference"
            />
          </FormSection>

          {/* Sender and Receiver */}
          <FormSection title="Sender and Receiver Information">
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
            <FormInput
              label="Quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              error={errors.quantity}
            />
            <FormInput
              label="Weight (KG)"
              name="weightKg"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.weightKg}
              onChange={handleInputChange}
              required
              error={errors.weightKg}
            />
            <FormInput
              label="Commercial Value (KES)"
              name="commercialValue"
              type="number"
              step="0.01"
              min="0"
              value={formData.commercialValue}
              onChange={handleInputChange}
              error={errors.commercialValue}
            />
            <FormInput
              label="Delivery Location"
              name="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={handleInputChange}
              error={errors.deliveryLocation}
              placeholder="Final delivery address"
            />
            <div className="md:col-span-2">
              <FormTextarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                error={errors.description}
                placeholder="Describe the items being shipped..."
                rows={3}
              />
            </div>
          </FormSection>

          {/* Operations Information */}
          <FormSection title="Operations Information">
            <FormInput
              label="Courier Name"
              name="courierName"
              value={formData.courierName}
              onChange={handleInputChange}
              error={errors.courierName}
              placeholder="Assigned courier"
            />
            <FormInput
              label="Staff Number"
              name="staffNo"
              value={formData.staffNo}
              onChange={handleInputChange}
              error={errors.staffNo}
              placeholder="Staff member ID"
            />
            <div className="md:col-span-2">
              <FormTextarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes or special instructions..."
                rows={2}
              />
            </div>
          </FormSection>

          {/* Charges */}
          <FormSection title="Charges Breakdown">
            <FormInput
              label="Base Charge (KES)"
              name="charges.baseCharge"
              type="number"
              step="0.01"
              min="0"
              value={formData.charges.baseCharge}
              onChange={handleInputChange}
              error={errors['charges.baseCharge']}
            />
            <FormInput
              label="Other Charges (KES)"
              name="charges.other"
              type="number"
              step="0.01"
              min="0"
              value={formData.charges.other}
              onChange={handleInputChange}
              error={errors['charges.other']}
            />
            <FormInput
              label="Insurance (KES)"
              name="charges.insurance"
              type="number"
              step="0.01"
              min="0"
              value={formData.charges.insurance}
              onChange={handleInputChange}
              error={errors['charges.insurance']}
            />
            <FormInput
              label="Extra Delivery (KES)"
              name="charges.extraDelivery"
              type="number"
              step="0.01"
              min="0"
              value={formData.charges.extraDelivery}
              onChange={handleInputChange}
              error={errors['charges.extraDelivery']}
            />
            <FormInput
              label="VAT (KES)"
              name="charges.vat"
              type="number"
              step="0.01"
              min="0"
              value={formData.charges.vat}
              onChange={handleInputChange}
              error={errors['charges.vat']}
            />
            <div className="bg-blue-50 p-3 rounded-md">
              <FormInput
                label="Total Charges (KES)"
                name="charges.total"
                type="number"
                step="0.01"
                value={formData.charges.total}
                readOnly
                error={errors['charges.total']}
              />
              <p className="text-xs text-blue-600 mt-1">
                Auto-calculated from above charges
              </p>
            </div>
          </FormSection>

          {/* Payment Information */}
          <FormSection title="Payment Information">
            <FormInput
              label="Payer Account Number"
              name="payment.payerAccountNo"
              value={formData.payment.payerAccountNo}
              onChange={handleInputChange}
              error={errors['payment.payerAccountNo']}
              placeholder="Account number or reference"
            />
            <FormSelect
              label="Payment Method"
              name="payment.paymentMethod"
              value={formData.payment.paymentMethod}
              onChange={handleInputChange}
              options={Object.values(PAYMENT_METHODS)}
              error={errors['payment.paymentMethod']}
            />
            <FormInput
              label="Amount Paid (KES)"
              name="payment.amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={formData.payment.amountPaid}
              onChange={handleInputChange}
              error={errors['payment.amountPaid']}
            />
          </FormSection>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white pt-6 border-t">
            <div className="flex justify-end space-x-4">
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isLoading
                  ? 'Processing...'
                  : shipment
                  ? 'Update Shipment'
                  : 'Create Shipment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentForm;