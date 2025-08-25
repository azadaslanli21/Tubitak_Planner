import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import apiClient from './api';
import { toast } from 'react-toastify';

export class EditTaskModal extends Component {

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
        work_package: this.props.task.work_package,
        users: checkedUserIds,
    };

    try {
        const response = await apiClient.put(`tasks/${this.props.task.id}/`, payload);
        toast.success(response.data.message);
        this.props.onDataChange(); // Refresh the main page
        this.props.onHide();       // Close the modal
    } catch (error) {
        console.error("Failed to update task.");
    }
  };

  render() {
    const { task, userMap, wpUsers } = this.props;

    return (
      <Modal {...this.props} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col sm={6}>
              <Form onSubmit={this.handleSubmit}>
                {/* All fields are pre-filled using the 'task' prop */}
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" required defaultValue={task.name} />
                </Form.Group>

                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" defaultValue={task.description} />
                </Form.Group>

                <Form.Group controlId="start_date">
                  <Form.Label>Start Month</Form.Label>
                  <Form.Control type="number" name="start_date" required defaultValue={task.start_date} />
                </Form.Group>

                <Form.Group controlId="end_date">
                  <Form.Label>End Month</Form.Label>
                  <Form.Control type="number" name="end_date" required defaultValue={task.end_date} />
                </Form.Group>

                <Form.Group controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Control as="select" name="status" defaultValue={task.status}>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="users">
                  <Form.Label>Personnelss</Form.Label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ced4da', borderRadius: 4, padding: '0.5rem' }}>
                    {wpUsers && wpUsers.map(userId => (
                      <Form.Check
                        key={userId}
                        type="checkbox"
                        label={userMap[userId]}
                        value={userId}
                        name="userCheckbox"
                        defaultChecked={task.users.includes(userId)}
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