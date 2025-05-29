import React, { Component } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

export class AddDeliverableModal extends Component {
  constructor(props) {
    super(props);
    this.state = { workpackages: [] };
  }

  componentDidMount() {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(res => res.json()),
    ]).then(([wps]) => this.setState({workpackages: wps }));
  }

  handleSubmit = event => {
    event.preventDefault();
    const form = event.target;


    const wpName = form.work_package.value;
    const wpId = this.state.workpackages.find(wp => wp.name === wpName)?.id;

    fetch(process.env.REACT_APP_API + 'deliverables/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name.value,
        description: form.description.value,
        deadline: parseInt(form.deadline.value),
        work_package: wpId,
      }),
    })
      .then(res => res.json())
      .then(
        result => alert(result),
        () => alert('Failed'),
      );
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
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" required placeholder="Name" />
                </Form.Group>

                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" required placeholder="Description" />
                </Form.Group>

                <Form.Group controlId="deadline">
                  <Form.Label>Deadline</Form.Label>
                  <Form.Control type="number" required placeholder="Deadline" />
                </Form.Group>

                <Form.Group controlId="work_package">
                  <Form.Label>WorkPackage</Form.Label>
                  <Form.Control as="select" required>
                    {this.state.workpackages.map(wp => (
                      <option key={wp.id}>{wp.name}</option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Form.Group>
                  <Button variant="primary" type="submit">
                    Add Deliverable
                  </Button>
                </Form.Group>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={this.props.onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
