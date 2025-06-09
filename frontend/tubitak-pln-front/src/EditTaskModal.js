import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

export class EditTaskModal extends Component {
  constructor(props) {
    super(props);
    this.state = { users: [], workpackages: [] };
  }

  componentDidMount() {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'users').then(res => res.json()),
      fetch(process.env.REACT_APP_API + 'workpackages').then(res => res.json()),
    ]).then(([users, wps]) => this.setState({ users, workpackages: wps }));
  }

  handleSubmit = event => {
    event.preventDefault();
    const form = event.target;

    const checkedUserIds = Array.from(form.querySelectorAll('input[name="userCheckbox"]:checked')).map(cb => parseInt(cb.value));
    const selectedUserIds = this.state.users
      .filter(u => checkedUserIds.includes(u.id))
      .map(u => u.id);

    const wpName = form.work_package.value;
    const wpId = this.state.workpackages.find(wp => wp.name === wpName)?.id;

    fetch(process.env.REACT_APP_API + 'tasks/' + this.props.taskid + '/', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name.value,
        description: form.description.value,
        start_date: parseInt(form.start_date.value),
        end_date: parseInt(form.end_date.value),
        status: form.status.value,
        work_package: wpId,
        users: selectedUserIds,
      }),
    })
      .then(res => res.json())
      .then(
        result => alert(result),
        () => alert('Failed'),
      );
  };

  render() {
    const defaultWPName = this.state.workpackages.find(wp => wp.id === this.props.work_package)?.name;

    return (
      <Modal {...this.props} size="lg" centered>
        <Modal.Header style={{ position: 'relative' }}>
          <Modal.Title>Edit Task</Modal.Title>
          <Button
            variant="danger"
            style={{ position: 'absolute', top: '1rem', right: '1rem' }}
            onClick={this.props.onHide}
          >
            Close
          </Button>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col sm={6}>
              <Form onSubmit={this.handleSubmit}>
                <Form.Group controlId="taskid">
                  <Form.Label>Task ID</Form.Label>
                  <Form.Control type="text" value={this.props.taskid} readOnly plaintext />
                </Form.Group>

                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" required defaultValue={this.props.name} />
                </Form.Group>

                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" required defaultValue={this.props.description} />
                </Form.Group>

                <Form.Group controlId="start_date">
                  <Form.Label>Start Month</Form.Label>
                  <Form.Control type="number" required defaultValue={this.props.start_date} />
                </Form.Group>

                <Form.Group controlId="end_date">
                  <Form.Label>End Month</Form.Label>
                  <Form.Control type="number" required defaultValue={this.props.end_date} />
                </Form.Group>

                <Form.Group controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Control as="select" defaultValue={this.props.status}>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="work_package">
                  <Form.Label>WorkPackage</Form.Label>
                  <Form.Control as="select" defaultValue={defaultWPName}>
                    {this.state.workpackages.map(wp => (
                      <option key={wp.id}>{wp.name}</option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="users">
                  <Form.Label>Users</Form.Label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ced4da', borderRadius: 4, padding: '0.5rem' }}>
                    {this.state.users.map(u => (
                      <Form.Check
                        key={u.id}
                        type="checkbox"
                        id={`user-checkbox-${u.id}`}
                        label={u.name}
                        value={u.id}
                        name="userCheckbox"
                        className="mb-1"
                        defaultChecked={this.props.usernames && (this.props.usernames.includes(u.name) || this.props.usernames.includes(u.id))}
                      />
                    ))}
                  </div>
                </Form.Group>

                <Form.Group>
                  <Button variant="primary" type="submit" className="mt-3">
                    Update Task
                  </Button>
                </Form.Group>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    );
  }
}
