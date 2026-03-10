import client from './client';

/**
 * Fetches receipt information from the backend proxy.
 * Hits http://localhost:8090/api/external/receipts/{id}
 */
export const getExternalReceipt = async (id) => {
    // Relative to baseURL (.../api)
    const response = await client.get(`customer/orders/external/${id}`);
    return response.data;
};
