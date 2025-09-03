// src/services/mappers/shipmentsMapper.js

// Toggle this to match your backend:
// - "flat": controllers expect flat columns (sender_name, receiver_name, weight_kg, etc.)
// - "nested": controllers expect nested objects (sender:{}, receiver:{}, charges:{}, payment:{})
export const API_SHAPE = "flat"; // "flat" | "nested"

const n = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

export function mapFormToApi(form) {
  if (API_SHAPE === "nested") {
    // Send exactly what the form holds
    return {
      ...form,
      charges: {
        base: n(form.charges.baseCharge),
        other: n(form.charges.other),
        insurance: n(form.charges.insurance),
        extraDelivery: n(form.charges.extraDelivery),
        vat: n(form.charges.vat),
        total: n(form.charges.total),
      },
    };
  }

  // Default: flat (most MySQL CRUD samples use snake_case columns)
  return {
    date: form.date,
    // sender_* columns
    sender_name: form.sender?.name || "",
    sender_id_passport: form.sender?.idPassport || "",
    sender_company_name: form.sender?.companyName || "",
    sender_building_floor: form.sender?.buildingFloor || "",
    sender_street_address: form.sender?.streetAddress || "",
    sender_estate_town: form.sender?.estateTown || "",
    sender_telephone: form.sender?.telephone || "",
    sender_email: form.sender?.email || "",

    // receiver_* columns
    receiver_name: form.receiver?.name || "",
    receiver_id_passport: form.receiver?.idPassport || "",
    receiver_company_name: form.receiver?.companyName || "",
    receiver_building_floor: form.receiver?.buildingFloor || "",
    receiver_street_address: form.receiver?.streetAddress || "",
    receiver_estate_town: form.receiver?.estateTown || "",
    receiver_telephone: form.receiver?.telephone || "",
    receiver_email: form.receiver?.email || "",

    quantity: n(form.quantity),
    weight_kg: n(form.weightKg),
    description: form.description || "",
    commercial_value: n(form.commercialValue),
    delivery_location: form.deliveryLocation || "",
    status: form.status || "",
    notes: form.notes || "",
    receipt_reference: form.receiptReference || "",
    courier_name: form.courierName || "",
    staff_no: form.staffNo || "",

    // charges_* columns
    base: n(form.charges?.baseCharge),
    other: n(form.charges?.other),
    insurance: n(form.charges?.insurance),
    extra_delivery: n(form.charges?.extraDelivery),
    vat: n(form.charges?.vat),
    total: n(form.charges?.total),

    // payment_* columns
    payer_account_no: form.payment?.payerAccountNo || "",
    payment_method: form.payment?.paymentMethod || "",
    // amountPaid (if you capture it on create; otherwise backend computes)
  };
}

export function mapApiToForm(row) {
  // Normalizes either flat DB row or nested API to the form shape
  const get = (o, ...keys) => keys.reduce((v, k) => v ?? o?.[k], undefined);

  const charges = {
    baseCharge: get(row, "charges?.base", "base") ?? "",
    other: get(row, "charges?.other", "other") ?? "",
    insurance: get(row, "charges?.insurance", "insurance") ?? "",
    extraDelivery: get(row, "charges?.extraDelivery", "extra_delivery") ?? "",
    vat: get(row, "charges?.vat", "vat") ?? "",
    total: get(row, "charges?.total", "total") ?? "",
  };

  return {
    date: row.date || "",
    sender: {
      name: get(row, "sender?.name", "sender_name") || "",
      idPassport: get(row, "sender?.idPassport", "sender_id_passport") || "",
      companyName: get(row, "sender?.companyName", "sender_company_name") || "",
      buildingFloor: get(row, "sender?.buildingFloor", "sender_building_floor") || "",
      streetAddress: get(row, "sender?.streetAddress", "sender_street_address") || "",
      estateTown: get(row, "sender?.estateTown", "sender_estate_town") || "",
      telephone: get(row, "sender?.telephone", "sender_telephone") || "",
      email: get(row, "sender?.email", "sender_email") || "",
    },
    receiver: {
      name: get(row, "receiver?.name", "receiver_name") || "",
      idPassport: get(row, "receiver?.idPassport", "receiver_id_passport") || "",
      companyName: get(row, "receiver?.companyName", "receiver_company_name") || "",
      buildingFloor: get(row, "receiver?.buildingFloor", "receiver_building_floor") || "",
      streetAddress: get(row, "receiver?.streetAddress", "receiver_street_address") || "",
      estateTown: get(row, "receiver?.estateTown", "receiver_estate_town") || "",
      telephone: get(row, "receiver?.telephone", "receiver_telephone") || "",
      email: get(row, "receiver?.email", "receiver_email") || "",
    },
    quantity: get(row, "quantity") ?? "",
    weightKg: get(row, "weightKg", "weight_kg") ?? "",
    description: row.description || "",
    commercialValue: get(row, "commercialValue", "commercial_value") ?? "",
    deliveryLocation: get(row, "deliveryLocation", "delivery_location") || "",
    status: row.status || "",
    notes: row.notes || "",
    receiptReference: get(row, "receiptReference", "receipt_reference") || "",
    courierName: get(row, "courierName", "courier_name") || "",
    staffNo: get(row, "staffNo", "staff_no") || "",
    charges,
    payment: {
      payerAccountNo: get(row, "payment?.payerAccountNo", "payer_account_no") || "",
      paymentMethod: get(row, "payment?.paymentMethod", "payment_method") || "",
    },
  };
}
