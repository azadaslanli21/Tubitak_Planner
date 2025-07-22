import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import apiClient from './api';
import { toast } from 'react-toastify';

export class AddDeliverableModal extends Component {
  // The constructor and componentDidMount for fetching data can be removed.

  handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    const payload = {
        name: form.name.value,
        description: form.description.value,
        deadline: parseInt(form.deadline.value),
        work_package: this.props.workPackageId, // <-- Use the ID from props
    };

    try {
        const response = await apiClient.post('deliverables/', payload);
        toast.success(response.data.message);
        this.props.onDataChange(); // <-- Refresh the main page
        this.props.onHide();       // <-- Close the modal
    } catch (error) {
        // Errors are handled by the global interceptor
        console.error("Failed to add task.");
    }
  };

  render() {
    

    return (
      <Modal {...this.props} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Deliverable</Modal.Title>
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
                
                <Form.Group controlId="deadline">
                  <Form.Label>Deadline</Form.Label>
                  <Form.Control type="number" name="deadline" required placeholder="Deadline" />
                </Form.Group>

                <Form.Group>
                  <Button variant="primary" type="submit" className="mt-3">
                    Add Deliverable
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