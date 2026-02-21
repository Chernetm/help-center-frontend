import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Button } from "../components/ui/Button";
import { forgotPasswordAdmin, forgotPasswordCustomer } from "../api/auth";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get("type") || "customer"; // "admin" or "customer"

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setStatus("loading");

        try {
            if (type === "admin") {
                await forgotPasswordAdmin(email);
            } else {
                await forgotPasswordCustomer(email);
            }
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setError(err.response?.data?.error || "Failed to send reset email. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
                >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-500 mb-8">
                        We've sent a password reset link to <strong>{email}</strong>.
                    </p>
                    <Button
                        onClick={() => navigate(type === "admin" ? "/admin-login" : "/login")}
                        className="w-full py-3"
                    >
                        Back to Login
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden relative">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 z-0"></div>

                    <div className="relative z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-6 group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Back
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
                            <p className="text-gray-500 mt-2">
                                No worries, we'll send you reset instructions.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter your registered email"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full py-3 text-base flex items-center justify-center gap-2 group"
                            >
                                {status === "loading" ? "Sending..." : (
                                    <>
                                        Reset Password <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
