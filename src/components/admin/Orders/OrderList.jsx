import React, { useEffect, useState } from "react";
import { getOrders } from "../../../api/orders";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../../ui/Button";

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
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
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        const id = order.order_id?.toLowerCase() || "";
        const status = order.status?.toLowerCase() || "";
        const department = order.department?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return id.includes(term) || status.includes(term) || department.includes(term);
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
                                <th className="px-6 py-4 font-medium">Date Created</th>
                                <th className="px-6 py-4 font-medium">Estimated Time</th>

                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <FileText size={48} className="text-gray-200" />
                                            <p>No orders found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => (
                                    <motion.tr
                                        key={order.id || order.order_id || idx} // fallback key
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            #{order.order_id || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'}`}>
                                                {order.status || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {order.department || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 capitalize">
                                            {order.urgency || "Normal"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {order.estimated_time ? new Date(order.estimated_time).toLocaleDateString() : "-"}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderList;
