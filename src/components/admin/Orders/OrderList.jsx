import React, { useEffect, useState } from "react";
import { getOrders, updateOrder } from "../../../api/orders";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Loader2, AlertCircle, Edit2, Check, X } from "lucide-react";
import { Button } from "../../ui/Button";

const STATUS_OPTIONS = ["pending", "processing", "completed", "delivered", "cancelled"];
const DEPARTMENT_OPTIONS = ["Sales", "Support", "Billing", "Hardware", "Software"];
const URGENCY_OPTIONS = ["Low", "Normal", "High", "Critical"];

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [updating, setUpdating] = useState(false);

    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            console.log("Fetched orders:", data);
            setOrders(data || []);
        } catch (err) {
            setError("Failed to fetch orders");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleEdit = (order) => {
        setEditingId(order.id || order.order_id);
        setEditData({
            status: order.status || "pending",
            urgency: order.urgency || "Normal",
            description: order.description || "",
            estimated_time: order.EstimatedTime ? new Date(order.EstimatedTime).toISOString().slice(0, 10) : "",
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleUpdate = async (id) => {
        setUpdating(true);
        try {
            const payload = {
                status: editData.status,
                urgency: editData.urgency,
                description: editData.description,
                estimated_time: editData.estimated_time ? new Date(editData.estimated_time).toISOString() : null,
            };
            // Note: Department is taken from middleware in backend
            await updateOrder(id, payload);
            setEditingId(null);
            fetchOrders();
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update order");
        } finally {
            setUpdating(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        const id = order.order_id?.toLowerCase() || "";
        const status = order.status?.toLowerCase() || "";
        const department = order.department?.toLowerCase() || "";
        const description = order.description?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return id.includes(term) || status.includes(term) || department.includes(term) || description.includes(term);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-red-600 bg-red-50 rounded-xl p-8 border border-red-100 mx-auto max-w-2xl mt-10">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-lg font-medium">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 mt-1">Manage and track all system orders.</p>
                </div>
                <Link to="/admin-orders/new">
                    <Button className="flex items-center gap-2">
                        <Plus size={18} />
                        Create New Order
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="text-sm text-gray-500">
                        Total: <span className="font-semibold text-gray-900">{filteredOrders.length}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider text-left">
                            <tr>
                                <th className="px-6 py-4 font-medium">Order ID</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Department</th>
                                <th className="px-6 py-4 font-medium">Urgency</th>
                                <th className="px-6 py-4 font-medium">Description</th>
                                <th className="px-6 py-4 font-medium">Estimated Time</th>
                                <th className="px-6 py-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <FileText size={48} className="text-gray-200" />
                                            <p>No orders found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => {
                                    const isEditing = editingId === (order.id || order.order_id);
                                    return (
                                        <motion.tr
                                            key={order.id || order.order_id || idx}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                #{order.order_id || "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <select
                                                        value={editData.status}
                                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'}`}>
                                                        {order.status || "-"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {order.department || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {isEditing ? (
                                                    <select
                                                        value={editData.urgency}
                                                        onChange={(e) => setEditData({ ...editData, urgency: e.target.value })}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    >
                                                        {URGENCY_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`capitalize ${order.urgency === 'Critical' || order.urgency === 'High' ? 'text-red-600 font-semibold' : ''}`}>
                                                        {order.urgency || "Normal"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editData.description}
                                                        placeholder="Description..."
                                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 w-full outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                ) : (
                                                    order.description || "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        value={editData.estimated_time}
                                                        onChange={(e) => setEditData({ ...editData, estimated_time: e.target.value })}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                ) : (
                                                    order.EstimatedTime ? new Date(order.EstimatedTime).toLocaleDateString() : "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdate(order.order_id)}
                                                                disabled={updating}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                title="Save"
                                                            >
                                                                {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={handleCancel}
                                                                disabled={updating}
                                                                className="p-1 text-gray-400 hover:bg-gray-50 rounded transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(order)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderList;
