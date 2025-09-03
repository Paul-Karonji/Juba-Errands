import React from 'react';
import { BarChart3, FileText } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange }) => (
  <div className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto">
      <div className="flex space-x-8 p-4">
        <NavigationTab
          icon={<BarChart3 size={20} />}
          label="Dashboard"
          tabKey="dashboard"
          activeTab={activeTab}
          onClick={() => onTabChange('dashboard')}
        />
        <NavigationTab
          icon={<FileText size={20} />}
          label="Shipments"
          tabKey="shipments"
          activeTab={activeTab}
          onClick={() => onTabChange('shipments')}
        />
      </div>
    </div>
  </div>
);

const NavigationTab = ({ icon, label, tabKey, activeTab, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      activeTab === tabKey 
        ? 'bg-blue-100 text-blue-600' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Navigation;