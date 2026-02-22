import client from './client';

export const getOrders = async () => {
    const response = await client.get('/admin/orders');
    return response.data;
};

export const getOrderById = async (orderId) => {
    const response = await client.get(`/admin/orders/${orderId}`);
    return response.data;
};

export const trackOrder = async (orderId) => {
    const response = await client.get(`/orders/${orderId}`);
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await client.post('/admin/orders', orderData);
    return response.data;
};
export const updateOrder = async (orderId, orderData) => {
    const response = await client.put(`/admin/orders/${orderId}`, orderData);
    return response.data;
};
