import client from './client';

export const login = async (credentials) => {
    const response = await client.post('/customer/login', credentials);
    return response.data;
};
export const loginAdmin = async (credentials) => {
    const response = await client.post('/admin/login', credentials);
    return response.data;
};
export const logoutAdmin = async () => {
    const response = await client.post('/admin/logout');
    return response.data;
};


export const registerAdmin = async (userData) => {
    const response = await client.post('/admin/register', userData);
    return response.data;
};

export const registerCustomer = async (customerData) => {
    const response = await client.post('/customer/register', customerData);
    return response.data;
};
