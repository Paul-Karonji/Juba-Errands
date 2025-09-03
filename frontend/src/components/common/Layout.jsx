import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';


export default function Layout() {
const navigate = useNavigate();


const tabs = [
{ to: '/dashboard', label: 'Dashboard' },
{ to: '/senders', label: 'Senders' },
{ to: '/receivers', label: 'Receivers' },
{ to: '/charges', label: 'Charges' },
{ to: '/payments', label: 'Payments' },
];


return (
<div className="min-h-screen bg-gray-50">
<header className="bg-white border-b">
<div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
<h1 className="text-xl font-semibold">Juba Errands</h1>
<nav className="flex gap-4">
{tabs.map((t) => (
<NavLink
key={t.to}
to={t.to}
className={({ isActive }) =>
`px-3 py-2 rounded-md ${isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`
}
>
{t.label}
</NavLink>
))}
</nav>
<div className="flex gap-2">
<button
onClick={() => navigate('/login')}
className="px-3 py-2 rounded-md border"
>
Login
</button>
</div>
</div>
</header>
<main className="max-w-6xl mx-auto p-4">
<Outlet />
</main>
</div>
);
}