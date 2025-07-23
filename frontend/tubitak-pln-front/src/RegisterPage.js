import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = e => {
    e.preventDefault();

    fetch(process.env.REACT_APP_API + 'register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(JSON.stringify(data.error));
          });
        }
        return response.json();
      })
      .then(() => {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);  // delay so user sees success message
      })
      .catch(err => {
        try {
          const parsedError = JSON.parse(err.message);
          const combined = Object.entries(parsedError)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join(' | ');
          setMessage(combined);
        } catch {
          setMessage('Registration failed. Please try again.');
        }
      });
  };

  return (
    <Container className="mt-4" style={{ maxWidth: 500 }}>
      <h3>Register as Project Coordinator</h3>

      {message && (
        <Alert variant="warning" onClose={() => setMessage(null)} dismissible>
          {message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Form.Control
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            value={formData.password_confirm}
            onChange={e => setFormData({ ...formData, password_confirm: e.target.value })}
            required
          />
        </Form.Group>

        <Button type="submit" className="mt-3">Register</Button>
        <Button
          variant="secondary"
          className="mt-3 ms-2"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </Button>
      </Form>
    </Container>
  );
}
