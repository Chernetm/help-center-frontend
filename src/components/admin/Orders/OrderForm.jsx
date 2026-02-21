import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../../../api/orders";
import { Button } from "../../ui/Button";
import {
  Hash,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    id: "", // This will be Customer ID
    order_id: "",
    status: "pending",
    urgency: "normal",
    estimated_time: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

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
        id: formData.id,
        order_id: formData.order_id,
        status: formData.status,
        urgency: formData.urgency,
        estimated_time: formData.estimated_time
          ? new Date(formData.estimated_time).toISOString()
          : null,
      });

      setMessage({ type: "success", text: "Order created successfully!" });

      setFormData({
        id: "",
        order_id: "",
        status: "pending",
        urgency: "normal",
        estimated_time: "",
      });

      setTimeout(() => {
        navigate("/admin-orders");
      }, 1500);
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
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="absolute top-6 left-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin-orders")}
                className="text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft size={20} className="mr-1" /> Back
              </Button>
            </div>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4">
              <Plus size={32} />
            </div>

            <h2 className="text-3xl font-bold text-gray-900">New Order</h2>
            <p className="text-gray-500 mt-2">
              Enter the details to register a new order.
            </p>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                  }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <div className="text-sm font-medium">{message.text}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer ID */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Customer ID (Numeric) *
              </label>
              <div className="relative mt-2">
                <Hash
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g. 12"
                />
              </div>
            </div>

            {/* Business Order ID */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Business Order ID *
              </label>
              <div className="relative mt-2">
                <FileText
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
                <input
                  type="text"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="e.g. ORD-2026-001"
                />
              </div>
            </div>

            {/* Status and Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Initial Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full mt-2 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Urgency *
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full mt-2 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="express">Express</option>
                </select>
              </div>
            </div>

            {/* Estimated Time (Optional) */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Estimated Completion (Optional)
              </label>
              <div className="relative mt-2">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
                <input
                  type="datetime-local"
                  name="estimated_time"
                  value={formData.estimated_time}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 font-semibold rounded-xl flex justify-center items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Plus size={20} /> Create Order
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
