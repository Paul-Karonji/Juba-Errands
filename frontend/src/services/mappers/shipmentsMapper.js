// src/services/mappers/shipmentsMapper.js

// Updated to match the actual database schema with foreign keys
export const API_SHAPE = "flat";

const n = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

export function mapFormToApi(form) {
  // Map form data to database schema (snake_case with foreign keys)
  return {
    waybill_no: form.waybillNo || form.waybill_no,
    date: form.date,
    sender_id: parseInt(form.senderId || form.sender_id) || null,
    receiver_id: parseInt(form.receiverId || form.receiver_id) || null,
    quantity: parseInt(form.quantity) || 1,
    weight_kg: parseFloat(form.weightKg || form.weight_kg) || 0,
    description: form.description || "",
    commercial_value: parseFloat(form.commercialValue || form.commercial_value) || 0,
    delivery_location: form.deliveryLocation || form.delivery_location || "",
    status: form.status || "Pending",
    notes: form.notes || "",
    receipt_reference: form.receiptReference || form.receipt_reference || "",
    courier_name: form.courierName || form.courier_name || "",
    staff_no: form.staffNo || form.staff_no || "",

    // Charges (these will be handled separately in the backend)
    base_charge: parseFloat(form.charges?.baseCharge || form.base_charge) || 0,
    other: parseFloat(form.charges?.other || form.other) || 0,
    insurance: parseFloat(form.charges?.insurance || form.insurance) || 0,
    extra_delivery: parseFloat(form.charges?.extraDelivery || form.extra_delivery) || 0,
    vat: parseFloat(form.charges?.vat || form.vat) || 0,
    total: parseFloat(form.charges?.total || form.total) || 0,

    // Payment (these will be handled separately in the backend)
    payer_account_no: form.payment?.payerAccountNo || form.payer_account_no || "",
    payment_method: form.payment?.paymentMethod || form.payment_method || "Cash",
    amount_paid: parseFloat(form.payment?.amountPaid || form.amount_paid) || 0,
  };
}

export function mapApiToForm(row) {
  // Handle both flat database rows and joined view results
  const get = (o, ...keys) => keys.reduce((v, k) => v ?? o?.[k], undefined);

  return {
    id: row.id,
    waybillNo: get(row, "waybill_no", "waybillNo") || "",
    date: row.date || "",
    senderId: get(row, "sender_id", "senderId") || "",
    receiverId: get(row, "receiver_id", "receiverId") || "",
    quantity: get(row, "quantity") || "",
    weightKg: get(row, "weight_kg", "weightKg") || "",
    description: row.description || "",
    commercialValue: get(row, "commercial_value", "commercialValue") || "",
    deliveryLocation: get(row, "delivery_location", "deliveryLocation") || "",
    status: row.status || "",
    notes: row.notes || "",
    receiptReference: get(row, "receipt_reference", "receiptReference") || "",
    courierName: get(row, "courier_name", "courierName") || "",
    staffNo: get(row, "staff_no", "staffNo") || "",

    // Handle charges - from separate charges table or embedded
    charges: {
      baseCharge: get(row, "base_charge", "charges?.baseCharge", "baseCharge") || "",
      other: get(row, "other", "charges?.other") || "",
      insurance: get(row, "insurance", "charges?.insurance") || "",
      extraDelivery: get(row, "extra_delivery", "charges?.extraDelivery", "extraDelivery") || "",
      vat: get(row, "vat", "charges?.vat") || "",
      total: get(row, "total", "charge_total", "charges?.total") || "",
    },

    // Handle payment - from separate payments table or embedded
    payment: {
      payerAccountNo: get(row, "payer_account_no", "payment?.payerAccountNo", "payerAccountNo") || "",
      paymentMethod: get(row, "payment_method", "payment?.paymentMethod", "paymentMethod") || "Cash",
      amountPaid: get(row, "amount_paid", "payment?.amountPaid", "amountPaid") || "",
    },

    // Additional fields that might come from the view
    senderName: get(row, "sender_name", "senderName") || "",
    receiverName: get(row, "receiver_name", "receiverName") || "",
    senderEmail: get(row, "sender_email", "senderEmail") || "",
    receiverEmail: get(row, "receiver_email", "receiverEmail") || "",
    senderTelephone: get(row, "sender_telephone", "senderTelephone") || "",
    receiverTelephone: get(row, "receiver_telephone", "receiverTelephone") || "",

    // Timestamps
    createdAt: get(row, "created_at", "createdAt") || "",
    updatedAt: get(row, "updated_at", "updatedAt") || "",
  };
}