import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add the JWT token and project ID to the headers
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  const projcetId = localStorage.getItem('project_id');
  if (projcetId) {
    config.headers['X-Project-Id'] = projcetId; // Add project ID to headers
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Upgraded Response Interceptor with Token Refresh and Notification Logic ---
apiClient.interceptors.response.use(
  (response) => {
    // Check if the request was a method that modifies data
    const method = response.config.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // If the server sends back a success message, display it
      if (response.data && response.data.message) {
        toast.success(response.data.message);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 and haven't already retried the request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request as retried to prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            // If there's no refresh token, the user must log in again
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Make a request to the refresh token endpoint
        const response = await axios.post(`${process.env.REACT_APP_API}token/refresh/`, {
          refresh: refreshToken
        });
        
        const newAccessToken = response.data.access;
        
        // Save the new access token
        localStorage.setItem('access_token', newAccessToken);
        
        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request with the new token
        return apiClient(originalRequest);

      } catch (refreshError) {
        // If refreshing the token also fails, the session is truly over
        localStorage.clear();
        window.location.href = '/login';
        toast.error("Your session has expired. Please log in again.");
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, display the generic error toast from your backend
    if (error.response?.data?.error) {
      // Use ?. for safety, in case response or data is not available
      const errorData = error.response.data.error;
      // The register error returns an object, so we format it.
      if (typeof errorData === 'object') {
        const messages = Object.entries(errorData).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`);
        toast.error(messages.join(' | '));
      } else {
        toast.error(errorData);
      }
    } else {
      toast.error('An unexpected network error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;