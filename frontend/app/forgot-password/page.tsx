'use client'

import axios from "axios"
import { useState } from "react"
import { API_BASE } from '@/lib/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try{
            await axios.post(`${API_BASE}/forgot-password`, {email})
            setMessage('Reset link sent to your email (check console in dev')
            setError('')
        } catch(err: any) {
            setError("Something went wrong")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-8">Reset Password</h2>
                {message && <p className="text-green-600 text-center mb-4">{message}</p>}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input 
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="w-full px-4 py-4 border rounded-lg mb-6"
                        value={email}
                        onChange={(e)=> setEmail(e.target.value)}
                    />
                
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                    Send Reset Link 
                </button>
                </form>
            </div>

        </div>
    )
}