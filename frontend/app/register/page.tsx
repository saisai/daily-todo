'use client';
import {  useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { API_BASE } from '@/lib/api';

export default function Register() {
    const [form, setForm] = useState({name: '', email: '', password: ''})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handlerSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try{
            await axios.post(`${API_BASE}/register`, form)
            alert("Registration successful! PLease login.")
            window.location.href = '/login'
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed")
        }
        setLoading(false)
    };

    return (
        <div className="min-h-screen bg-gray--50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-8">Create Account</h2>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handlerSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            type="email"
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus-ring-2 focus:ring-blue-500"
                            onChange={(e) => setForm({...form, email: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password"
                            required 
                            minLength={6}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setForm({...form, password: e.target.value})}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                    >
                        {loading ? ' Creating Account...' : 'Register'}
                    </button>
                </form>
                <p className="text-center mt-6 text-sm">
                    Already have an ccount?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
                </p>
            </div>

        </div>
    )

}