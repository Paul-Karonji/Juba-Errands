import React, { useEffect, useState } from 'react';
import FormSection from './FormSection';
import FormInput from './FormInput';
import { createCharges, updateCharges } from '../../services/charges';


export default function ChargesForm({ entry = {}, shipmentId: forcedShipmentId, onClose, onSaved }) {
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState({});
const [form, setForm] = useState({ shipmentId: '', base: 0, insurance: 0, extraDelivery: 0, vat: 0, total: 0 });


useEffect(() => {
if (entry && entry.id) setForm({
shipmentId: entry.shipmentId ?? '', base: entry.base ?? 0, insurance: entry.insurance ?? 0,
extraDelivery: entry.extraDelivery ?? 0, vat: entry.vat ?? 0, total: entry.total ?? 0,
});
}, [entry]);


useEffect(() => {
if (forcedShipmentId) setForm((f) => ({ ...f, shipmentId: forcedShipmentId }));
}, [forcedShipmentId]);


const handleChange = (e) => {
const { name, value } = e.target;
setForm((f) => ({ ...f, [name]: value }));
};


useEffect(() => {
const n = (x) => (isNaN(parseFloat(x)) ? 0 : parseFloat(x));
const total = n(form.base) + n(form.insurance) + n(form.extraDelivery) + n(form.vat);
setForm((f) => ({ ...f, total }));
}, [form.base, form.insurance, form.extraDelivery, form.vat]);


const submit = async (e) => {
e.preventDefault();
setIsLoading(true); setErrors({});
try {
const payload = {
shipmentId: Number(form.shipmentId) || null,
base: Number(form.base) || 0,
insurance: Number(form.insurance) || 0,
extraDelivery: Number(form.extraDelivery) || 0,
vat: Number(form.vat) || 0,
total: Number(form.total) || 0,
};
if (entry.id) await updateCharges(entry.id, payload); else await createCharges(payload);
onSaved?.();
} catch (err) {
setErrors({ form: err.response?.data?.message || err.message });
} finally { setIsLoading(false); }
};


return (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
<div className="bg-white rounded-xl p-6 w-full max-w-xl">
<h3 className="text-lg font-semibold mb-4">{entry.id ? 'Edit Charges' : 'New Charges'}</h3>
{errors.form && <div className="mb-3 text-red-600 text-sm">{errors.form}</div>}
<form onSubmit={submit} className="space-y-6">
<FormSection title="Charges">
<FormInput label="Shipment ID" name="shipmentId" value={form.shipmentId} onChange={handleChange} />
<FormInput label="Base" name="base" type="number" step="0.01" value={form.base} onChange={handleChange} />
<FormInput label="Insurance" name="insurance" type="number" step="0.01" value={form.insurance} onChange={handleChange} />
<FormInput label="Extra Delivery" name="extraDelivery" type="number" step="0.01" value={form.extraDelivery} onChange={handleChange} />
<FormInput label="VAT" name="vat" type="number" step="0.01" value={form.vat} onChange={handleChange} />
<FormInput label="Total" name="total" type="number" step="0.01" value={form.total} readOnly />
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