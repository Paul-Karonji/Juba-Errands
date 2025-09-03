import React, { useEffect, useState } from 'react';
import FormSection from './FormSection';
import FormInput from './FormInput';
import { createReceiver, updateReceiver } from '../../services/receivers';


export default function ReceiverForm({ entry = {}, onClose, onSaved }) {
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState({});
const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });


useEffect(() => {
if (entry && entry.id) setForm({
name: entry.name || '', phone: entry.phone || '', email: entry.email || '', address: entry.address || ''
});
}, [entry]);


const handleChange = (e) => {
const { name, value } = e.target;
setForm((f) => ({ ...f, [name]: value }));
};


const submit = async (e) => {
e.preventDefault();
setIsLoading(true); setErrors({});
try {
if (entry.id) await updateReceiver(entry.id, form); else await createReceiver(form);
onSaved?.();
} catch (err) {
setErrors({ form: err.response?.data?.message || err.message });
} finally { setIsLoading(false); }
};


return (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
<div className="bg-white rounded-xl p-6 w-full max-w-xl">
<h3 className="text-lg font-semibold mb-4">{entry.id ? 'Edit Receiver' : 'New Receiver'}</h3>
{errors.form && <div className="mb-3 text-red-600 text-sm">{errors.form}</div>}
<form onSubmit={submit} className="space-y-6">
<FormSection title="Receiver">
<FormInput label="Name" name="name" value={form.name} onChange={handleChange} required />
<FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />
<FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
<FormInput label="Address" name="address" value={form.address} onChange={handleChange} />
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