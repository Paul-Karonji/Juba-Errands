// src/hooks/useShipments.js
import { useCallback, useState } from 'react';
import {
  listShipments,
  getShipment,
  getByWaybill,
  createShipment,
  updateShipment,
  deleteShipment,
} from '../services/shipments';
import { mapFormToApi, mapApiToForm } from '../services/mappers/shipmentsMapper';

export default function useShipments() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async (params) => {
    setLoading(true); setError('');
    try {
      const { data } = await listShipments(params);
      const arr = Array.isArray(data) ? data : (data?.items || []);
      return arr.map(mapApiToForm);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      return [];
    } finally { setLoading(false); }
  }, []);

  const fetchOne = useCallback(async (id) => {
    setLoading(true); setError('');
    try {
      const { data } = await getShipment(id);
      return mapApiToForm(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      return null;
    } finally { setLoading(false); }
  }, []);

  const submitShipment = useCallback(async (payload, existingId) => {
    setLoading(true); setError('');
    try {
      const body = mapFormToApi(payload);
      if (existingId) {
        const { data } = await updateShipment(existingId, body);
        return data;
      } else {
        const { data } = await createShipment(body);
        return data;
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setError(msg);
      throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const removeShipment = useCallback(async (id) => {
    setLoading(true); setError('');
    try {
      await deleteShipment(id);
      return true;
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      return false;
    } finally { setLoading(false); }
  }, []);

  return {
    isLoading,
    error,
    fetchAll,
    fetchOne,
    submitShipment,
    removeShipment,
    getByWaybill,
  };
}

// Named wrappers (unchanged)
export function useCreateShipment() {
  const { submitShipment, isLoading, error } = useShipments();
  const mutateAsync = (payload) => submitShipment(payload, undefined);
  return { mutateAsync, isLoading, error };
}

export function useUpdateShipment() {
  const { submitShipment, isLoading, error } = useShipments();
  const mutateAsync = ({ id, ...payload }) => submitShipment(payload, id);
  return { mutateAsync, isLoading, error };
}
