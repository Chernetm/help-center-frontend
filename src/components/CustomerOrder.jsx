import React, { useState } from "react";

export default function OrderLookup() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false); // To know if search was attempted

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("Please enter an Order ID");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Order not found");
        } else {
          throw new Error("Failed to fetch order");
        }
        setOrder(null);
      } else {
        const data = await response.json();
        setOrder(data);
        setSearched(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Order Lookup
      </h2>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g., ORD-123)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">
            Order Details: <span className="text-blue-600">#{order.id}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-semibold capitalize text-green-600">
                {order.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-xl font-semibold">
                {order.department || <span className="text-gray-400">Not specified</span>}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Urgency</p>
              <p className="text-xl font-semibold capitalize">
                {order.urgency}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="text-xl font-semibold">
                {order.user?.name || order.user?.email || "Unknown User"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-lg">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-lg">
                {new Date(order.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!searched && !loading && !error && (
        <div className="text-center text-gray-500 mt-10">
          Enter an Order ID above to view its details
        </div>
      )}
    </div>
  );
}