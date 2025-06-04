// HomePage.js
import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [project, setProject] = useState({ name: '', start_date: '' });
  const [message, setMessage] = useState(null);

  // Fetch once
  useEffect(() => {
    fetch(process.env.REACT_APP_API + 'project/')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setProject(data))
      .catch(() => {})   // no project yet
      .finally(() => setLoaded(true));
  }, []);

  const handleSubmit = e => {
    e.preventDefault();
    const method = project.id ? 'PUT' : 'POST';
    fetch(process.env.REACT_APP_API + 'project/', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setMessage('Saved!'))
      .catch(() => setMessage('Error saving project.'));
  };

  if (!loaded) return null;

  return (
    <Container className="mt-4" style={{ maxWidth: 500 }}>
      <h3>Project Settings</h3>

      {message && <Alert onClose={() => setMessage(null)} dismissible>{message}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Project Name</Form.Label>
          <Form.Control
            value={project.name}
            onChange={e => setProject({ ...project, name: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Start Date</Form.Label>
          <Form.Control
            type="date"
            value={project.start_date}
            onChange={e => setProject({ ...project, start_date: e.target.value })}
            required
          />
        </Form.Group>

        <Button type="submit" className="mt-3">Save</Button>
      </Form>
    </Container>
  );
}
