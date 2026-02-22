import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackOrder } from "../../../api/orders";
import { Button } from "../../ui/Button";

export default function OrderLookup() {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError("");
        setOrder(null);
        setSearched(true);

        try {
            const data = await trackOrder(orderId);
            console.log("Fetched order data:", data);
            setOrder(data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError("Order not found");
            } else {
                setError("Failed to fetch order details");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-12 p-6">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Track Your Order</h2>
                <p className="mt-2 text-gray-500">Enter your Order ID to check real-time status.</p>
            </div>

            <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onSubmit={handleSubmit}
                className="relative max-w-xl mx-auto mb-12"
            >
                <div className="relative">
                    <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="Enter Order ID (e.g., ORD-123)"
                        className="w-full pl-6 pr-32 py-4 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                    />
                    <div className="absolute right-2 top-2 bottom-2">
                        <Button
                            type="submit"
                            disabled={loading || !orderId.trim()}
                            className="h-full rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? "Searching..." : "Track"}
                        </Button>
                    </div>
                </div>
            </motion.form>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-xl mx-auto p-4 bg-red-50 text-red-600 rounded-lg text-center border border-red-100"
                    >
                        {error}
                    </motion.div>
                )}

                {order && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
                    >
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <div className="text-blue-100 text-sm font-medium">Order ID</div>
                                <div className="text-2xl font-bold">#{order.order_id}</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-semibold capitalize">
                                {order.status}
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailItem label="Status" value={order.status} capitalize />
                            <DetailItem label="Urgency" value={order.urgency} capitalize />
                            <DetailItem label="Department" value={order.department} />
                            <DetailItem label="Estimated Completion" value={order.EstimatedTime ? new Date(order.EstimatedTime).toLocaleString() : "Not scheduled"} />
                            <DetailItem label="Last Updated" value={new Date(order.UpdatedAt).toLocaleString()} />
                            <div className="md:col-span-2">
                                <DetailItem label="Description" value={order.description} />
                            </div>
                        </div>

                        {/* Simple progress bar visualization */}
                        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                            {["pending", "processing", "printing", "completed", "delivered"].indexOf(order.status) >= 0
                                                ? `${Math.min((["pending", "processing", "printing", "completed", "delivered"].indexOf(order.status) + 1) * 20, 100)}%`
                                                : "Status"}
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                                    <div
                                        style={{ width: `${Math.min((["pending", "processing", "printing", "completed", "delivered"].indexOf(order.status) + 1) * 20, 100)}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const DetailItem = ({ label, value, capitalize }) => (
    <div>
        <div className="text-sm text-gray-500 font-medium mb-1">{label}</div>
        <div className={`text-lg font-semibold text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
            {value || <span className="text-gray-400 italic">Not specified</span>}
        </div>
    </div>
);
