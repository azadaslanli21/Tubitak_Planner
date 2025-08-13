// HomePage.js
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';

const API = process.env.REACT_APP_API ?? '';

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(localStorage.getItem('project_id') || '');
  const [edit, setEdit] = useState({ name: '', start_date: '' });
  const [creating, setCreating] = useState({ name: '', start_date: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const accessToken = localStorage.getItem('accessToken');
  const headers = useMemo(() => ({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
  }), [accessToken]);

  const selectedProject = useMemo(
    () => projects.find(p => String(p.id) === String(selectedId)),
    [projects, selectedId]
  );

  // Fetch all projects, initialize selection/edit form
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}projects/`, { headers });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProjects(data);

        if (!selectedId && data.length > 0) {
          const first = data[0];
          localStorage.setItem('project_id', String(first.id));
          localStorage.setItem('currentProjectName', first.name);
          setSelectedId(String(first.id));
          setEdit({ name: first.name, start_date: first.start_date });
          setMessage(`Selected project: ${first.name}`);
        } else if (selectedId) {
          const sel = data.find(p => String(p.id) === String(selectedId));
          if (sel) {
            setEdit({ name: sel.name, start_date: sel.start_date });
          } else if (data.length > 0) {
            const first = data[0];
            localStorage.setItem('project_id', String(first.id));
            localStorage.setItem('currentProjectName', first.name);
            setSelectedId(String(first.id));
            setEdit({ name: first.name, start_date: first.start_date });
          }
        }
      } catch {
        setError('Could not load projects.');
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasProjects = projects.length > 0;

  const onSelectProject = (e) => {
    const pid = e.target.value;
    setSelectedId(pid);
    const p = projects.find(pr => String(pr.id) === String(pid));
    if (p) {
      localStorage.setItem('project_id', String(p.id));
      localStorage.setItem('currentProjectName', p.name);
      setEdit({ name: p.name, start_date: p.start_date });
      setMessage(`Selected project: ${p.name}`);
    }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API}projects/${selectedProject.id}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(edit),
      });
      if (!res.ok) throw new Error();

      const updated = await res.json();
      setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      localStorage.setItem('currentProjectName', updated.name);
      setMessage('Project updated.');
    } catch {
      setError('Failed to update project.');
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`${API}projects/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(creating),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();

      const updatedList = [created, ...projects];
      setProjects(updatedList);
      localStorage.setItem('project_id', String(created.id));
      localStorage.setItem('currentProjectName', created.name);
      setSelectedId(String(created.id));
      setEdit({ name: created.name, start_date: created.start_date });
      setCreating({ name: '', start_date: '' });
      setMessage(`Created and selected: ${created.name}`);
    } catch {
      setError('Failed to create project.');
    }
  };

  const deleteProject = async () => {
    if (!selectedProject) return;
    const confirmed = window.confirm(`Are you sure you want to delete project "${selectedProject.name}"?`);
    if (!confirmed) return;

    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API}projects/${selectedProject.id}/`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error();

      const remaining = projects.filter(p => p.id !== selectedProject.id);
      setProjects(remaining);

      if (remaining.length > 0) {
        const first = remaining[0];
        setSelectedId(String(first.id));
        localStorage.setItem('project_id', String(first.id));
        localStorage.setItem('currentProjectName', first.name);
        setEdit({ name: first.name, start_date: first.start_date });
        setMessage(`Deleted project. Selected: ${first.name}`);
      } else {
        localStorage.removeItem('project_id');
        localStorage.removeItem('currentProjectName');
        setSelectedId('');
        setEdit({ name: '', start_date: '' });
        setMessage('Project deleted. No projects left.');
      }
    } catch {
      setError('Failed to delete project.');
    }
  };

  if (!loaded) return null;

  return (
    <Container className="mt-4" style={{ maxWidth: 720 }}>
      <h3 className="mb-3">Project Selection & Settings</h3>

      {message && (
        <Alert variant="success" dismissible onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!hasProjects ? (
        <>
          <Alert variant="info" className="mb-3">
            You don’t have any projects yet. Create your first project to continue.
          </Alert>
          <Form onSubmit={createProject}>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                value={creating.name}
                onChange={e => setCreating(s => ({ ...s, name: e.target.value }))}
                required
                placeholder="My First Project"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={creating.start_date}
                onChange={e => setCreating(s => ({ ...s, start_date: e.target.value }))}
                required
              />
            </Form.Group>
            <Button type="submit">Create Project</Button>
          </Form>
        </>
      ) : (
        <>
          {/* Project selector */}
          <Form className="mb-4">
            <Form.Group as={Row} className="align-items-center">
              <Form.Label column sm="4">Current Project</Form.Label>
              <Col sm="8">
                <Form.Select value={selectedId} onChange={onSelectProject}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
          </Form>

          {/* Edit selected project */}
          {selectedProject && (
            <Form onSubmit={updateProject}>
              <h5 className="mb-3">Edit Selected Project</h5>

              <Form.Group className="mb-3">
                <Form.Label>Project Name</Form.Label>
                <Form.Control
                  value={edit.name}
                  onChange={e => setEdit(s => ({ ...s, name: e.target.value }))}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={edit.start_date || ''}
                  onChange={e => setEdit(s => ({ ...s, start_date: e.target.value }))}
                  required
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary">Save Changes</Button>
                <Button type="button" variant="danger" onClick={deleteProject}>
                  Delete Project
                </Button>
              </div>
            </Form>
          )}

          {/* Quick create another project */}
          <hr className="my-4" />
          <h5 className="mb-3">Add New Project</h5>
          <Form onSubmit={createProject}>
            <Row>
              <Col md>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={creating.name}
                    onChange={e => setCreating(s => ({ ...s, name: e.target.value }))}
                    placeholder="New Project"
                  />
                </Form.Group>
              </Col>
              <Col md>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={creating.start_date}
                    onChange={e => setCreating(s => ({ ...s, start_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md="auto" className="d-flex align-items-end mb-3">
                <Button type="submit" disabled={!creating.name || !creating.start_date}>
                  Create
                </Button>
              </Col>
            </Row>
          </Form>
        </>
      )}
    </Container>
  );
}
