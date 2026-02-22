import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Inbox, User, ArrowRight, ShieldCheck } from "lucide-react";
import { login } from "../api/auth";
import { Button } from "../components/ui/Button";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await login({ email, password });

            // Store tokens and expiration
            localStorage.setItem("customerToken", data.token);
            localStorage.setItem("customerRefreshToken", data.refreshToken);

            // Set cookie with expiresIn from backend
            const maxAge = data.expiresIn || 3600;
            document.cookie = `customerToken=${data.token}; max-age=${maxAge}; path=/`;
            document.cookie = `customerRefreshToken=${data.refreshToken}; max-age=${3600 * 24 * 30}; path=/`; // 30 days for refresh token

            navigate("/order-status"); // Redirect to a dashboard or order status
        } catch (err) {
            if (err.response?.status === 404 || err.response?.status === 401) {
                setError("Invalid credentials. Please check your phone or password.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Left Side - Image/Brand */}
                <div className="md:w-1/2 bg-indigo-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626544827763-d516dce335ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-20"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
                        <p className="text-indigo-200">Signin to manage your orders, track shipments, and request support.</p>
                    </div>
                    <div className="relative z-10 mt-12 md:mt-0">
                        <div className="flex items-center gap-2 text-sm text-indigo-300">
                            <div className="w-8 h-[1px] bg-indigo-500"></div>
                            Trusted by thousands
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
                        <p className="text-gray-500 text-sm mt-2">Access your customer portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Inbox size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="example@gmail.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <Link
                                    to="/forgot-password?type=customer"
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-base flex items-center justify-center gap-2 group"
                        >
                            {loading ? "Signing in..." : (
                                <>
                                    Log In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/customer-register" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline">
                            Create Account
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <Link
                            to="/admin-login"
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                            <ShieldCheck size={16} />
                            Access Admin Portal
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
