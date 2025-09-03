export const isValidEmail = (email) => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  if (!phone) return true;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const toNumber = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

export const calculateTotalCharges = ({ base = 0, insurance = 0, extraDelivery = 0, vat = 0 }) =>
  toNumber(base) + toNumber(insurance) + toNumber(extraDelivery) + toNumber(vat);

// Alias for existing imports in ShipmentForm.jsx:
export const calculateChargesTotal = calculateTotalCharges;
