import client from './client';

export const getOrders = async () => {
    const response = await client.get('/orders');
    return response.data;
};

export const getOrderById = async (orderId) => {
    const response = await client.get(`/orders/${orderId}`);
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await client.post('/orders', orderData);
    return response.data;
};
