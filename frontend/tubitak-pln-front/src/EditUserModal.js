import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

export class EditUserModal extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    fetch(process.env.REACT_APP_API + 'users/' + this.props.userid + '/', {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: event.target.name.value,
        wage: event.target.wage.value
      })
    })
    .then(res => res.json())
    .then((result) => {
      alert(result);
    },
    (error) => {
      alert('Failed');
    });
  }

  render() {
    return (
      <div className="container">
        <Modal
          {...this.props}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header style={{ position: 'relative' }}>
            <Modal.Title id="contained-modal-title-vcenter">
              Edit User
            </Modal.Title>
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
                    <Form.Control
                      type="text"
                      name="name"
                      required
                      defaultValue={this.props.username}
                      placeholder="Name"
                    />
                  </Form.Group>
                  <Form.Group controlId="wage">
                    <Form.Label>Wage</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="wage"
                      required
                      defaultValue={this.props.userwage}
                      placeholder="Wage"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Button variant="primary" type="submit">
                      Update User
                    </Button>
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

export default EditUserModal; // At the end of AddUserModal.js
