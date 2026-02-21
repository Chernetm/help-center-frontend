import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Phone, User, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerCustomer } from "../api/auth";
import { Button } from "../components/ui/Button";

export default function Register() {
    const [form, setForm] = useState({ name: "", phone: "", password: "", confirmPassword: "", email: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const getPasswordStrength = (pass) => {
        let score = 0;
        if (!pass) return { score: 0, label: "", color: "bg-gray-200" };
        if (pass.length > 6) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) return { score: 25, label: "Weak", color: "bg-red-500" };
        if (score === 2) return { score: 50, label: "Fair", color: "bg-yellow-500" };
        if (score === 3) return { score: 75, label: "Good", color: "bg-blue-500" };
        return { score: 100, label: "Strong", color: "bg-emerald-500" };
    };

    const strength = getPasswordStrength(form.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (strength.label === "Weak") {
            setError("Please use a stronger password");
            return;
        }

        setLoading(true);

        try {
            await registerCustomer({
                name: form.name,
                phoneNumber: form.phone, // match backend expectation
                password: form.password,
                email: form.email || undefined
            });

            // Optionally auto-login or redirect to login
            navigate("/login", { state: { message: "Account created! Please log in." } });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse"
            >
                {/* Right Side - Image */}
                <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-30"></div>
                    <div className="relative z-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold mb-6">Join Us Today</h2>
                        <p className="text-indigo-100 mb-8">Create an account to track orders, manage tickets, and get personalized support.</p>
                        <ul className="space-y-3 text-sm text-indigo-50 hidden md:block">
                            <li className="flex items-center gap-2">✓ Real-time tracking</li>
                            <li className="flex items-center gap-2">✓ 24/7 Support access</li>
                            <li className="flex items-center gap-2">✓ Order history</li>
                        </ul>
                    </div>
                </div>

                {/* Left Side - Form */}
                <div className="md:w-1/2 p-12">
                    <div className="text-center md:text-left mb-8">
                        <h3 className="text-2xl font-bold text-gray-900">Create Account</h3>
                        <p className="text-gray-500 text-sm mt-1">It's free and takes less than a minute.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User size={18} /></div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Phone size={18} /></div>
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="+251..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {form.password && (
                                <div className="mt-2 text-[10px] uppercase font-bold tracking-wider">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-500">Strength: {strength.label}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1">
                                        <div className={`${strength.color} h-1 rounded-full transition-all duration-300`} style={{ width: `${strength.score}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>}

                        <Button type="submit" disabled={loading} className="w-full mt-2">
                            {loading ? "Creating..." : "Register"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                            Log In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
