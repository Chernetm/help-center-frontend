import client from './client';

export const getUserPerformance = async () => {
  const response = await client.get('/admin/super/user-performance');
  return response.data;
}
export const getAdmins = async () => {
  const response = await client.get("/admin/super/users");
  return response.data;
};
export const updateAdmin = async (uid, data) => {
  const response = await client.put(`/admin/super/users/${uid}`, data);
  return response.data;
};
/** Get all cases (used to extract departments) */
export const getAdminCases = async () => {
  const response = await client.get("/admin/cases/");
  return response.data;
};

// Customer Management
export const getCustomers = async () => {
  const response = await client.get("/admin/customers");
  return response.data;
};

export const updateCustomerStatus = async (id, status) => {
  const response = await client.patch(`/admin/customers/${id}/status`, { status });
  return response.data;
};
