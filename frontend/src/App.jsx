// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout.jsx';
import Dashboard from './components/dashboard/Dashboard';
import ShipmentsList from './components/shipments/ShipmentsList';
import SendersPage from './components/pages/SendersPage';
import ReceiversPage from './components/pages/ReceiversPage';
import ChargesPage from './components/pages/ChargesPage';
import PaymentsPage from './components/pages/PaymentsPage';
import Login from './auth/Login';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shipments" element={<ShipmentsList />} />
        <Route path="/senders" element={<SendersPage />} />
        <Route path="/receivers" element={<ReceiversPage />} />
        <Route path="/charges" element={<ChargesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<div className="p-6">Not Found</div>} />
    </Routes>
  );
}