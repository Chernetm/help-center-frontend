import client from './client';

export const getCases = async () => {
    const response = await client.get('/cases');
    return response.data;
};

export const createCase = async (caseData) => {
    const response = await client.post('/admin/cases/', caseData);
    return response.data;
};

export const getAgentTickets = async (limit = 10, offset = 0) => {
    const response = await client.get(`/admin/tickets?limit=${limit}&offset=${offset}`);
    return response.data;
};

export const getCustomerTickets = async (limit = 10, offset = 0) => {
    const response = await client.get(`/customer/tickets?limit=${limit}&offset=${offset}`);
    return response.data;
};

export const getTicket = async (ticketId, role = 'customer') => {
    const response = await client.get(`/${role}/tickets/${ticketId}`);
    return response.data;
};

export const createTicket = async (ticketData) => {
    const response = await client.post('/customer/tickets', ticketData);
    return response.data;
};

export const getTicketRating = async (ticketId) => {
    const response = await client.get(`/customer/tickets/${ticketId}/rating`);
    return response.data;
};


export const sendMessage = async (messageData) => {
    console.log("Sending message data:", messageData);
    const response = await client.post('/customer/tickets/messages', messageData);
    console.log("API Response:", response);
    return response.data;
};
export const sendAgentMessage = async (messageData) => {
    const response = await client.post(`/admin/tickets/messages`, messageData);
    return response.data;
};

export const rateTicket = async (ticketId, { customerId, score, comment }) => {
    const res = await client.post(`/customer/tickets/${ticketId}/rating`, {
        customerId,
        score,
        comment
    });
    return res.data;
};

export const markMessagesAsRead = async (ticketId, role) => {
    // role: 'admin' or 'customer'
    // Routes: /api/admin/tickets/:id/read OR /api/customer/tickets/:id/read
    const response = await client.put(`/${role}/tickets/${ticketId}/read`);
    return response.data;
};

export const closeTicket = async (ticketId) => {
    const response = await client.put(`/admin/tickets/${ticketId}/close`);
    return response.data;
};

