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

// Forgot Password
export const forgotPasswordAdmin = async (email) => {
    const response = await client.post('/admin/forgot-password', { email });
    return response.data;
};

export const forgotPasswordCustomer = async (email) => {
    const response = await client.post('/customer/forgot-password', { email });
    return response.data;
};

// Change Password
export const changePasswordAdmin = async (newPassword) => {
    const response = await client.post('/admin/change-password', { newPassword });
    return response.data;
};

export const changePasswordCustomer = async (newPassword) => {
    const response = await client.post('/customer/change-password', { newPassword });
    return response.data;
};
