import React, { useEffect, useState } from 'react';
import FormSection from './FormSection';
import FormInput from './FormInput';
import { createSender, updateSender } from '../../services/senders';

export default function SenderForm({ entry = {}, onClose, onSaved }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idPassportNo: '',
    companyName: '',
    buildingFloor: '',
    streetAddress: '',
    estateTown: '',
    telephone: ''
  });

  useEffect(() => {
    if (entry && entry.id) {
      setForm({
        name: entry.name || '',
        phone: entry.phone || '',
        email: entry.email || '',
        address: entry.address || '',
        idPassportNo: entry.idPassportNo || entry.id_passport_no || '',
        companyName: entry.companyName || entry.company_name || '',
        buildingFloor: entry.buildingFloor || entry.building_floor || '',
        streetAddress: entry.streetAddress || entry.street_address || '',
        estateTown: entry.estateTown || entry.estate_town || '',
        telephone: entry.telephone || ''
      });
    }
  }, [entry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    
    // Email validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Convert to snake_case for API
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email,
        address: form.address,
        id_passport_no: form.idPassportNo,
        company_name: form.companyName,
        building_floor: form.buildingFloor,
        street_address: form.streetAddress,
        estate_town: form.estateTown,
        telephone: form.telephone
      };
      
      if (entry.id) {
        await updateSender(entry.id, payload);
      } else {
        await createSender(payload);
      }
      onSaved?.();
    } catch (err) {
      setErrors({ form: err.response?.data?.message || err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {entry.id ? 'Edit Sender' : 'New Sender'}
        </h3>
        
        {errors.form && (
          <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={submit} className="space-y-6">
          <FormSection title="Basic Information">
            <FormInput
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
            <FormInput
              label="ID/Passport Number"
              name="idPassportNo"
              value={form.idPassportNo}
              onChange={handleChange}
              error={errors.idPassportNo}
            />
            <FormInput
              label="Company Name"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              error={errors.companyName}
            />
          </FormSection>

          <FormSection title="Contact Information">
            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />
            <FormInput
              label="Telephone"
              name="telephone"
              type="tel"
              value={form.telephone}
              onChange={handleChange}
              error={errors.telephone}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
          </FormSection>

          <FormSection title="Address Information">
            <FormInput
              label="Building/Floor"
              name="buildingFloor"
              value={form.buildingFloor}
              onChange={handleChange}
              error={errors.buildingFloor}
            />
            <FormInput
              label="Street Address"
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
              error={errors.streetAddress}
            />
            <FormInput
              label="Estate/Town"
              name="estateTown"
              value={form.estateTown}
              onChange={handleChange}
              error={errors.estateTown}
            />
            <div className="md:col-span-2">
              <FormInput
                label="Full Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                error={errors.address}
                placeholder="Complete address (optional if above fields are filled)"
              />
            </div>
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