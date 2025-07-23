// src/api.js

import axios from 'axios';
import { toast } from 'react-toastify';

// Create a configured instance of axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API, // Uses the API URL from your project's environment
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// add jwt token if there is one to not have to change every usage of apiClient in code
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add a "response interceptor" to handle errors globally
apiClient.interceptors.response.use(
  // This function is called for any successful response (status code 2xx)
  (response) => {
    return response;
  },
  // This function is called for any failed response
  (error) => {
    // Check if the error response has a specific error message from your Django backend
    if (error.response && error.response.data && error.response.data.error) {
      // Use the custom error message from your backend
      toast.error(error.response.data.error);
    } else {
      // Fallback for generic network errors or other issues
      toast.error('An unexpected network error occurred.');
    }
    
    // This makes sure the error is still passed down, so a component's .catch() can run if needed
    return Promise.reject(error);
  }
);

export default apiClient;