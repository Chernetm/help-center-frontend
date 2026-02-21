import client from './client';

export const getOrders = async () => {
    const response = await client.get('/admin/orders');
    return response.data;
};

export const getOrderById = async (orderId) => {
    const response = await client.get(`/admin/orders/${orderId}`);
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await client.post('/admin/orders', orderData);
    return response.data;
};
