import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ShipmentsList from './components/shipments/ShipmentsList';
import Login from './auth/Login';
import './App.css'; // remove if you don't want it

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shipments" element={<ShipmentsList />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<div className="p-6">Not Found</div>} />
    </Routes>
  );
}
