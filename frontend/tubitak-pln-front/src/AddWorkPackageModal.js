import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

export class AddWorkPackageModal extends Component {
    constructor(props) {
        super(props);
        this.state = { users: [] };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        fetch(process.env.REACT_APP_API + 'users')
            .then(response => response.json())
            .then(data => this.setState({ users: data }));
    }

    handleSubmit(event) {
        event.preventDefault();
        const selectedUserNames = Array.from(event.target.users.selectedOptions, option => option.value);
        const selectedUserIds = this.state.users
            .filter(user => selectedUserNames.includes(user.name))
            .map(user => user.id);

        fetch(process.env.REACT_APP_API + 'workpackages/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: event.target.name.value,
                description: event.target.description.value,
                start_date: parseInt(event.target.start_date.value),
                end_date: parseInt(event.target.end_date.value),
                status: event.target.status.value,
                users: selectedUserIds
            })
        })
            .then(res => res.json())
            .then(result => alert(result), error => alert('Failed'));
    }

    render() {
        return (
            <div className="container">
                <Modal {...this.props} size="lg" centered>
                    <Modal.Header style={{ position: 'relative' }}>
                        <Modal.Title>Add WorkPackage</Modal.Title>
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
                                    <Form.Group controlId="name">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" required placeholder="Name" />
                                    </Form.Group>

                                    <Form.Group controlId="description">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control as="textarea" required placeholder="Description" />
                                    </Form.Group>

                                    <Form.Group controlId="start_date">
                                        <Form.Label>Start Month</Form.Label>
                                        <Form.Control type="number" required placeholder="Start Month" />
                                    </Form.Group>

                                    <Form.Group controlId="end_date">
                                        <Form.Label>End Month</Form.Label>
                                        <Form.Control type="number" required placeholder="End Month" />
                                    </Form.Group>

                                    <Form.Group controlId="status">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Control as="select">
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group controlId="users">
                                        <Form.Label>Users</Form.Label>
                                        <Form.Control as="select" multiple>
                                            {this.state.users.map(user =>
                                                <option key={user.id}>{user.name}</option>
                                            )}
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group>
                                        <Button variant="primary" type="submit" className="mt-3">Add WorkPackage</Button>
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
