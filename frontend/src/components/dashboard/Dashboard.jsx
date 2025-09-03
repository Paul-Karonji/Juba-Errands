// src/components/dashboard/Dashboard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService'; // keep your existing service
import StatCard from './StatCard';
import StatusBreakdown from './StatusBreakdown';
import RecentShipments from './RecentShipments';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

const Dashboard = () => {
  // Stats
  const {
    data: statistics,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: dashboardService.getStatistics,
    staleTime: 60_000,
  });

  // Recent
  const {
    data: recentShipments,
    isLoading: shipmentsLoading,
    error: recentError,
  } = useQuery({
    queryKey: ['recent-shipments', { limit: 5 }],
    queryFn: () => dashboardService.getRecentShipments(5),
    staleTime: 60_000,
  });

  // Status breakdown
  const {
    data: statusBreakdown,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ['status-breakdown'],
    queryFn: dashboardService.getStatusBreakdown,
    staleTime: 60_000,
  });

  if (statsLoading) return <Loading message="Loading dashboard..." />;
  if (statsError) return <ErrorMessage error={statsError} />;

  const {
    totalShipments = 0,
    deliveredShipments = 0,
    totalRevenue = 0,
    totalWeight = 0,
  } = statistics || {};

  const revenueText =
    typeof totalRevenue === 'number'
      ? currency.format(totalRevenue)
      : `KES ${String(totalRevenue ?? 0)}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={revenueText}
          color="border-blue-500"
          icon="💰"
        />
        <StatCard
          title="Total Shipments"
          value={totalShipments}
          color="border-green-500"
          icon="📦"
        />
        <StatCard
          title="Delivered"
          value={deliveredShipments}
          color="border-yellow-500"
          icon="✅"
        />
        <StatCard
          title="Total Weight (KG)"
          value={
            typeof totalWeight === 'number'
              ? totalWeight.toFixed(1)
              : String(totalWeight ?? '0.0')
          }
          color="border-purple-500"
          icon="⚖️"
        />
      </div>

      {/* Status Breakdown */}
      {statusError ? (
        <ErrorMessage error={statusError} />
      ) : !statusLoading && statusBreakdown ? (
        <StatusBreakdown data={statusBreakdown} />
      ) : null}

      {/* Recent Shipments */}
      {recentError ? (
        <ErrorMessage error={recentError} />
      ) : !shipmentsLoading && recentShipments ? (
        <RecentShipments shipments={recentShipments} />
      ) : null}
    </div>
  );
};

export default Dashboard;
