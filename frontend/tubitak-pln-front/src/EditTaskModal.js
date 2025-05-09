import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

export class EditTaskModal extends Component {
  constructor(props) {
    super(props);
    this.state = { users: [], workPackages: [], selectedUsers: [] };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    fetch(process.env.REACT_APP_API + 'users')
      .then(res => res.json())
      .then(data => this.setState({ users: data }));

    fetch(process.env.REACT_APP_API + 'workpackages')
      .then(res => res.json())
      .then(data => this.setState({ workPackages: data }));

    this.setState({ selectedUsers: this.props.users || [] });
  }

  handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const selectedUsers = Array.from(form.users.selectedOptions).map(opt => opt.value);

    fetch(process.env.REACT_APP_API + 'task', {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: this.props.id,
        name: form.name.value,
        description: form.description.value,
        start_date: form.start_date.value,
        end_date: form.end_date.value,
        status: form.status.value,
        work_package: form.work_package.value,
        users: selectedUsers
      })
    })
    .then(res => res.json())
    .then(result => alert(result), () => alert("Failed"));
  }

  render() {
    return (
      <Modal {...this.props} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col sm={12}>
              <Form onSubmit={this.handleSubmit}>
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" required defaultValue={this.props.name} />
                </Form.Group>
                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" defaultValue={this.props.description} />
                </Form.Group>
                <Form.Group controlId="start_date">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control type="number" name="start_date" required defaultValue={this.props.start_date} />
                </Form.Group>
                <Form.Group controlId="end_date">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control type="number" name="end_date" required defaultValue={this.props.end_date} />
                </Form.Group>
                <Form.Group controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Control as="select" name="status" defaultValue={this.props.status}>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="work_package">
                  <Form.Label>Work Package</Form.Label>
                  <Form.Control as="select" name="work_package" defaultValue={this.props.work_package}>
                    {this.state.workPackages.map(wp =>
                      <option key={wp.id} value={wp.id}>{wp.name}</option>
                    )}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="users">
                  <Form.Label>Users</Form.Label>
                  <Form.Control as="select" multiple name="users" defaultValue={this.state.selectedUsers}>
                    {this.state.users.map(user =>
                      <option key={user.id} value={user.id}>{user.username}</option>
                    )}
                  </Form.Control>
                </Form.Group>
                <Button variant="primary" type="submit">Update Task</Button>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={this.props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
