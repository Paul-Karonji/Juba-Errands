import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function Login() {
const [token, setToken] = useState('');
const navigate = useNavigate();


const onSubmit = (e) => {
e.preventDefault();
if (token) localStorage.setItem('token', token);
navigate('/dashboard');
};


return (
<div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
<h2 className="text-lg font-semibold mb-4">Login (temporary)</h2>
<p className="text-sm text-gray-500 mb-4">
Paste a JWT or any string to simulate auth while wiring your real backend auth.
</p>
<form onSubmit={onSubmit} className="space-y-3">
<input
type="text"
value={token}
onChange={(e) => setToken(e.target.value)}
placeholder="Token"
className="w-full border rounded px-3 py-2"
/>
<button type="submit" className="w-full bg-black text-white rounded px-3 py-2">
Continue
</button>
</form>
</div>
);
}