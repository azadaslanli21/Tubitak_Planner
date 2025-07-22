import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import apiClient from './api';
import { toast } from 'react-toastify';

export class EditDeliverableModal extends Component {

  handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    const payload = {
        name: form.name.value,
        description: form.description.value,
        deadline: parseInt(form.deadline.value),
        work_package: this.props.deliverable.work_package,
    };

    try {
        const response = await apiClient.put(`deliverables/${this.props.deliverable.id}/`, payload);
        toast.success(response.data.message);
        this.props.onDataChange(); // Refresh the main page
        this.props.onHide();       // Close the modal
    } catch (error) {
        console.error("Failed to update deliverable.");
    }
  };

  render() {
    const { deliverable } = this.props;

    return (
      <Modal {...this.props} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Deliverable</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col sm={6}>
              <Form onSubmit={this.handleSubmit}>
                {/* All fields are pre-filled using the 'deliverable' prop */}
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" required defaultValue={deliverable.name} />
                </Form.Group>

                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" defaultValue={deliverable.description} />
                </Form.Group>

                <Form.Group controlId="deadline">
                  <Form.Label>Deadline</Form.Label>
                  <Form.Control type="number" name="deadline" required defaultValue={deliverable.deadline} />
                </Form.Group>


                <Form.Group>
                  <Button variant="primary" type="submit" className="mt-3">
                    Update Deliverable
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