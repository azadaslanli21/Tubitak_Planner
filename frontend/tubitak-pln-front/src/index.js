import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// overrided fetch that has json refresh and auth
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
  };

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {})
  };

  const finalOptions = {
    ...options,
    headers: mergedHeaders
  };

  let response = await originalFetch(url, finalOptions);

  if (response.status === 401 && !options._retry) {
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = '/login';
      return new Promise(() => {});;
    }

    try {
      const refreshResponse = await originalFetch(`${process.env.REACT_APP_API}token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (!refreshResponse.ok) {
        throw new Error('Refresh failed');
      }

      const data = await refreshResponse.json();
      const newAccessToken = data.access;
      localStorage.setItem('access_token', newAccessToken);

      const retryHeaders = {
        ...mergedHeaders,
        'Authorization': `Bearer ${newAccessToken}`
      };

      return originalFetch(url, {
        ...options,
        headers: retryHeaders,
        _retry: true 
      });

    } catch (err) {
      localStorage.clear();
      window.location.href = '/login';
      return new Promise(() => {});
    }
  }

  return response;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
