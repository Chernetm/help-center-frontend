import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User, ArrowRight, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { loginAdmin } from "../api/auth";

export default function AdminLogin() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setError("");
    //     setLoading(true);

    //     try {
    //         const res = await fetch("http://localhost:8090/api/admin/login", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({email, password }),
    //         });

    //         const data = await res.json();

    //         if (!res.ok) {
    //             if (res.status === 404 || res.status === 401) {
    //                 setError("Invalid username or password.");
    //             } else {
    //                 setError("Login failed. Please try again.");
    //             }
    //             throw new Error();
    //         }

    //         // store token
    //         localStorage.setItem("adminToken", data.token);

    //         navigate("/agent");

    //     } catch {
    //         // error already set above
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await loginAdmin({ email, password });

            // Store user info and tokens
            localStorage.setItem("adminId", data.user.id);
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminRefreshToken", data.refreshToken);

            // Set cookies with expiresIn from backend
            const maxAge = data.expiresIn || 3600;
            document.cookie = `adminToken=${data.token}; max-age=${maxAge}; path=/`;
            document.cookie = `adminRefreshToken=${data.refreshToken}; max-age=${3600 * 24 * 30}; path=/`; // 30 days

            // Role-based navigation
            if (data.user.role === "super-admin") {
                navigate("/dashboard");
            } else if (data.user.role === "admin" || data.user.role === "agent") {
                navigate("/agent");
            } else {
                // fallback (optional)
                navigate("/");
            }

        } catch (err) {
            if (err.response?.status === 404 || err.response?.status === 401) {
                setError("Invalid credentials. Please check your email or password.");
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
                {/* Left Panel */}
                <div className="md:w-1/2 bg-indigo-900 p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560264388-63e5a89eb3aa?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center opacity-20"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Admin Portal</h2>
                        <p className="text-indigo-200">
                            Sign in to manage support tickets and communicate with customers.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 text-sm text-indigo-300 flex items-center gap-2">
                        <div className="w-8 h-[1px] bg-indigo-500" />
                        Secure Admin Access
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900">Admin Login</h3>
                        <p className="text-gray-500 text-sm mt-2">Enter your credentials</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
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
                                    to="/forgot-password?type=admin"
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
                                    Log In
                                    <ArrowRight
                                        size={18}
                                        className="group-hover:translate-x-1 transition-transform"
                                    />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                            <Users size={16} />
                            Access Customer Portal
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
