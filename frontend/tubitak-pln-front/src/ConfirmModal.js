import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

export class ConfirmModal extends Component {
    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{this.props.body}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.props.onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={this.props.onConfirm}>
                        Confirm Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}