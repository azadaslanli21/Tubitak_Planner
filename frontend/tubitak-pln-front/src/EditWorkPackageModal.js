import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import apiClient from './api';
import { toast } from 'react-toastify';

export class EditWorkPackageModal extends Component {
    constructor(props) {
        super(props);
        this.state = { users: [] };
    }

    async componentDidMount() {
        try {
            const response = await apiClient.get('users/');
            this.setState({ users: response.data });
        } catch (error) {
            console.error("Could not fetch users for modal.");
        }
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        const checkedUserIds = Array.from(event.target.querySelectorAll('input[name="userCheckbox"]:checked')).map(cb => parseInt(cb.value));

        const payload = {
            name: event.target.name.value,
            description: event.target.description.value,
            start_date: parseInt(event.target.start_date.value),
            end_date: parseInt(event.target.end_date.value),
            status: event.target.status.value,
            users: checkedUserIds
        };
        
        try {
            const response = await apiClient.put(`workpackages/${this.props.wpid}/`, payload);
            toast.success(response.data.message);
            this.props.onHide();
        } catch (error) {
            console.error("Failed to update work package.");
        }
    }

    render() {
        return (
            <div className="container">
                <Modal {...this.props} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit WorkPackage</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         <Row>
                            <Col sm={6}>
                                <Form onSubmit={this.handleSubmit}>
                                    <Form.Group controlId="name">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" name="name" required defaultValue={this.props.name} />
                                    </Form.Group>

                                    <Form.Group controlId="description">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control as="textarea" name="description" defaultValue={this.props.description} />
                                    </Form.Group>

                                    <Form.Group controlId="start_date">
                                        <Form.Label>Start Month</Form.Label>
                                        <Form.Control type="number" name="start_date" required defaultValue={this.props.start_date} />
                                    </Form.Group>

                                    <Form.Group controlId="end_date">
                                        <Form.Label>End Month</Form.Label>
                                        <Form.Control type="number" name="end_date" required defaultValue={this.props.end_date} />
                                    </Form.Group>

                                    <Form.Group controlId="status">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Control as="select" name="status" defaultValue={this.props.status}>
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group controlId="users">
                                        <Form.Label>Users</Form.Label>
                                        <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ced4da', borderRadius: 4, padding: '0.5rem' }}>
                                            {this.state.users.map(user => (
                                                <Form.Check
                                                    key={user.id}
                                                    type="checkbox"
                                                    label={user.name}
                                                    value={user.id}
                                                    name="userCheckbox"
                                                    defaultChecked={this.props.userids.includes(user.id)}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>

                                    <Form.Group>
                                        <Button variant="primary" type="submit" className="mt-3">Update WorkPackage</Button>
                                    </Form.Group>
                                </Form>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}