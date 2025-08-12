// LoginPage.js
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
  
    fetch(process.env.REACT_APP_API + 'token/verify/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token }),
    })
      .then((res) => {
        if (res.ok) {
          navigate('/');
        } else {
          // Token is invalid or expired — remove it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });
  }, [navigate]);
  

  const handleSubmit = e => {
    e.preventDefault();
  
    fetch(process.env.REACT_APP_API + 'token/', {
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Login failed');
        return response.json();
      })
      .then(data => {
        // Save tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
      })
      .catch((e) => {
        console.log(e);
        setMessage('Wrong credentials');
      }).then(() => {
        if (localStorage.getItem('access_token')) navigate('/');
      });
  };
  
  return (
    <Container className="mt-4" style={{ maxWidth: 500 }}>
      <h3>Project Coordinator Login</h3>

      {message && <Alert onClose={() => setMessage(null)} dismissible>{message}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Form.Control
            value={credentials.username}
            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={credentials.password}
            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            required
          />
        </Form.Group>

        
        
        <Button type="submit" className="mt-3">Login</Button>
        <Button variant='secondary' className="mt-3" onClick={() => navigate('/register')}>Register</Button>
      </Form>
    </Container>
  );
}
