import React, { useEffect, useState } from 'react';
import FormSection from './FormSection';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { createPayment, updatePayment } from '../../services/payments';


const METHODS = ['Cash', 'M-Pesa', 'Bank', 'Card'];


export default function PaymentForm({ entry = {}, shipmentId: forcedShipmentId, onClose, onSaved }) {
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState({});
const [form, setForm] = useState({ shipmentId: '', payerAccountNo: '', paymentMethod: 'Cash', amountPaid: 0 });


useEffect(() => {
if (entry && entry.id) setForm({
shipmentId: entry.shipmentId ?? '',
payerAccountNo: entry.payerAccountNo ?? '',
paymentMethod: entry.paymentMethod ?? 'Cash',
amountPaid: entry.amountPaid ?? 0,
});
}, [entry]);


useEffect(() => {
if (forcedShipmentId) setForm((f) => ({ ...f, shipmentId: forcedShipmentId }));
}, [forcedShipmentId]);


const handleChange = (e) => {
const { name, value } = e.target;
setForm((f) => ({ ...f, [name]: value }));
};


const submit = async (e) => {
e.preventDefault();
setIsLoading(true); setErrors({});
try {
const payload = {
shipmentId: Number(form.shipmentId) || null,
payerAccountNo: form.payerAccountNo,
paymentMethod: form.paymentMethod,
amountPaid: Number(form.amountPaid) || 0,
};
if (entry.id) await updatePayment(entry.id, payload); else await createPayment(payload);
onSaved?.();
} catch (err) {
setErrors({ form: err.response?.data?.message || err.message });
} finally { setIsLoading(false); }
};


return (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
<div className="bg-white rounded-xl p-6 w-full max-w-xl">
<h3 className="text-lg font-semibold mb-4">{entry.id ? 'Edit Payment' : 'New Payment'}</h3>
{errors.form && <div className="mb-3 text-red-600 text-sm">{errors.form}</div>}
<form onSubmit={submit} className="space-y-6">
<FormSection title="Payment">
<FormInput label="Shipment ID" name="shipmentId" value={form.shipmentId} onChange={handleChange} />
<FormInput label="Payer Account No" name="payerAccountNo" value={form.payerAccountNo} onChange={handleChange} />
<FormSelect label="Payment Method" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} options={METHODS} />
<FormInput label="Amount Paid" name="amountPaid" type="number" step="0.01" value={form.amountPaid} onChange={handleChange} />
</FormSection>
<div className="flex justify-end gap-3 border-t pt-4">
<button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
<button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
{isLoading ? 'Saving…' : 'Save'}
</button>
</div>
</form>
</div>
</div>
);
}