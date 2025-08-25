import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import apiClient from './api';
import { toast } from 'react-toastify';

export class AddTaskModal extends Component {
  // The constructor and componentDidMount for fetching data can be removed.

  handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    const checkedUserIds = Array.from(form.querySelectorAll('input[name="userCheckbox"]:checked')).map(cb => parseInt(cb.value));

    const payload = {
        name: form.name.value,
        description: form.description.value,
        start_date: parseInt(form.start_date.value),
        end_date: parseInt(form.end_date.value),
        status: form.status.value,
        work_package: this.props.workPackageId, // <-- Use the ID from props
        users: checkedUserIds,
    };

    try {
        const response = await apiClient.post('tasks/', payload);
        toast.success(response.data.message);
        this.props.onDataChange(); // <-- Refresh the main page
        this.props.onHide();       // <-- Close the modal
    } catch (error) {
        // Errors are handled by the global interceptor
        console.error("Failed to add task.");
    }
  };

  render() {
    // We receive the list of users allowed for THIS work package from props
    const { userMap, wpUsers } = this.props;

    return (
      <Modal {...this.props} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col sm={6}>
              <Form onSubmit={this.handleSubmit}>
                {/* Remove the WorkPackage dropdown; it's determined by props */}
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" required placeholder="Name" />
                </Form.Group>

                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" placeholder="Description" />
                </Form.Group>
                
                <Form.Group controlId="start_date">
                  <Form.Label>Start Month</Form.Label>
                  <Form.Control type="number" name="start_date" required placeholder="Start Month" />
                </Form.Group>

                <Form.Group controlId="end_date">
                  <Form.Label>End Month</Form.Label>
                  <Form.Control type="number" name="end_date" required placeholder="End Month" />
                </Form.Group>

                <Form.Group controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Control as="select" name="status">
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="users">
                  <Form.Label>Personnels</Form.Label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ced4da', borderRadius: 4, padding: '0.5rem' }}>
                    {/* Only show users that are part of the parent work package */}
                    {wpUsers && wpUsers.map(userId => (
                      <Form.Check
                        key={userId}
                        type="checkbox"
                        label={userMap[userId]}
                        value={userId}
                        name="userCheckbox"
                      />
                    ))}
                  </div>
                </Form.Group>

                <Form.Group>
                  <Button variant="primary" type="submit" className="mt-3">
                    Add Task
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