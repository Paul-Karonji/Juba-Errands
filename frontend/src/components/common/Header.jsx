import React from 'react';

const Header = () => (
  <div className="bg-blue-600 text-white p-4">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Juba Errands</h1>
        <p className="text-blue-100">Nairobi Branch - Record Keeping System</p>
      </div>
      <div className="text-right text-sm">
        <p>Tel: +254 723 634457 | +254 738 616167</p>
        <p>Email: jubaerrands.kenya@yahoo.com</p>
        <p className="text-xs text-blue-200 mt-1">We Deliver Regardless</p>
      </div>
    </div>
  </div>
);

export default Header;