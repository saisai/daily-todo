'use client'
import { useState } from 'react'
import axios  from 'axios'
import Link from 'next/link'
import { API_BASE } from '@/lib/api';

export default function Login() {
    const [form, setForm] = useState({email: '', password: ''})
    const [error, setError] = useState('')

    const handleSsubmit = async(e: React.FormEvent) => {
        e.preventDefault()
        try {
            // alert(JSON.stringify(form))
            const res = await axios.post(`${API_BASE}/login`, form)
            localStorage.setItem("token", res.data.token)
            alert('Login successful')
            window.location.href = '/dashborad'
        } catch(err: any) {
            setError(err.response?.data?.error || 'Login failed')
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2>Welcome Back</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handleSsubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                        type="email" 
                        required
                        className="w-full px-4 py-3 border rounded-lg" 
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" required className="w-full px-4 py-3 border rounded-lg" 
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                        Login
                    </button>
                </form>
                <div className="flex justify-between mt-6 text-sm">
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">Forgot Password?</Link>
                    <Link href="/register" className="text-blue-600 hover:underline">Create Account</Link>
                </div>
            </div>
        </div>
    )
}