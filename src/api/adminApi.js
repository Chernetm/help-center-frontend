import client from './client';

export const fetchUserPerformance = async () => {
  const response = await client.get('/admin/super/performance');
  return response.data;
};
