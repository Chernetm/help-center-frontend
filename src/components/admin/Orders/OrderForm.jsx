import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createOrder } from "../../../api/orders";
import { Button } from "../../ui/Button";
import { Hash, Layers, FileText, CheckCircle, AlertCircle, Plus, Loader2 } from "lucide-react";

export default function OrderForm() {
    const [formData, setFormData] = useState({
        orderId: "",
        status: "pending",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (message) setMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await createOrder({
                id: formData.orderId,
                status: formData.status,
                urgency: "normal", // or add urgency field to form if needed/default
            });

            setMessage({ type: "success", text: "Order created successfully!" });
            setFormData({ orderId: "", status: "pending" });
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Failed to create order." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto my-12"
        >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                <div className="p-8 md:p-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4">
                            <Plus size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">New Order</h2>
                        <p className="text-gray-500 mt-2">Enter the details to register a new order in the system.</p>
                    </div>

                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, mb: 0 }}
                                animate={{ opacity: 1, height: "auto", mb: 24 }}
                                exit={{ opacity: 0, height: 0, mb: 0 }}
                                className={`rounded-xl p-4 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}
                            >
                                {message.type === 'success' ? <CheckCircle className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
                                <div className="text-sm font-medium pt-0.5">{message.text}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order ID */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    Order ID <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Hash size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="orderId"
                                        value={formData.orderId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="e.g. ORD-2024-001"
                                        required
                                    />
                                </div>
                            </div>


                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                Initial Status <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    <FileText size={18} />
                                </div>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none font-medium cursor-pointer"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="printing">Printing</option>
                                    <option value="completed">Completed</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 text-base font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-shadow rounded-xl flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Create Order</>}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}
