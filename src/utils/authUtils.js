/**
 * Decodes a JWT token and checks if it is expired.
 * @param {string} token - The JWT token to check.
 * @returns {boolean} - True if expired or invalid, false otherwise.
 */
export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return true;

        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;

        if (!exp) return false; // No expiration set

        return Date.now() >= exp * 1000;
    } catch (e) {
        return true; // Invalid token
    }
};

/**
 * Removes all auth tokens from local storage and cookies.
 */
export const clearAuthData = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('customerRefreshToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('tokenRefreshToken'); // generic if any
    localStorage.removeItem('adminId');
    localStorage.removeItem('role');

    // Clear cookies if used
    document.cookie = "customerToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "customerRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "adminRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};
