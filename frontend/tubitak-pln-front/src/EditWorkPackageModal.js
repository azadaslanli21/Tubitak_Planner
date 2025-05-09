import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

export class EditWorkPackageModal extends Component {
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
            .map(user => user.userID);

        fetch(process.env.REACT_APP_API + 'workpackages/', {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wpId: this.props.wpid,
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
                    <Modal.Header closeButton>
                        <Modal.Title>Edit WorkPackage</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col sm={6}>
                                <Form onSubmit={this.handleSubmit}>
                                    <Form.Group controlId="wpId">
                                        <Form.Label>WP ID</Form.Label>
                                        <Form.Control type="text" disabled defaultValue={this.props.wpid} />
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
                                        <Form.Label>Start Week</Form.Label>
                                        <Form.Control type="number" required defaultValue={this.props.start_date} />
                                    </Form.Group>

                                    <Form.Group controlId="end_date">
                                        <Form.Label>End Week</Form.Label>
                                        <Form.Control type="number" required defaultValue={this.props.end_date} />
                                    </Form.Group>

                                    <Form.Group controlId="status">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Control as="select" defaultValue={this.props.status}>
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group controlId="users">
                                        <Form.Label>Users</Form.Label>
                                        <Form.Control as="select" multiple>
                                            {this.state.users.map(user =>
                                                <option key={user.userID}
                                                    selected={this.props.usernames.includes(user.name)}>
                                                    {user.name}
                                                </option>
                                            )}
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group>
                                        <Button variant="primary" type="submit">Update WorkPackage</Button>
                                    </Form.Group>
                                </Form>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={this.props.onHide}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}
