import React, { Component } from 'react';
import { Card, Button, Table, ButtonToolbar, Badge } from 'react-bootstrap'; // Import Badge
import { AddTaskModal } from './AddTaskModal';
import { AddDeliverableModal } from './AddDeliverableModal';
import { EditTaskModal } from './EditTaskModal'; 
import { EditDeliverableModal } from './EditDeliverableModal';
import { ConfirmModal } from './ConfirmModal';
import apiClient from './api';
import { toast } from 'react-toastify';

export class WorkPackageCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            addTaskModalShow: false,
            addDeliverableModalShow: false,
            editTaskModalShow: false,
            editingTask: null,
            editDeliverableModalShow: false,
            editingDeliverable: null,

            deletingItem: null
        };
    }


    closeAddTaskModal = () => this.setState({ addTaskModalShow: false });
    closeAddDeliverableModal = () => this.setState({ addDeliverableModalShow: false });
    closeEditTaskModal = () => this.setState({ editTaskModalShow: false, editingTask: null });
    closeEditDeliverableModal = () => this.setState({ editDeliverableModalShow: false, editingDeliverable: null });
    closeConfirmDeleteModal = () => this.setState({ deletingItem: null });


    handleDeleteClick = (id, type) => {
        this.setState({ deletingItem: { id, type } });
    }

    handleConfirmDelete = async () => {
        const { id, type } = this.state.deletingItem;
        if (!id || !type) return;

        try {
            let endpoint = '';
            let successMessage = '';

            switch (type) {
                case 'task':
                    endpoint = `tasks/${id}/`;
                    successMessage = 'Task deleted successfully!';
                    break;
                case 'deliverable':
                    endpoint = `deliverables/${id}/`;
                    successMessage = 'Deliverable deleted successfully!';
                    break;
                case 'workPackage':
                    endpoint = `workpackages/${id}/`;
                    successMessage = 'Work Package deleted successfully!';
                    break;
                default:
                    throw new Error('Invalid deletion type');
            }

            await apiClient.delete(endpoint);
            toast.success(successMessage);
            this.props.onDataChange(); 

        } catch (error) {
            console.error(`Failed to delete ${type}.`);
        } finally {
            this.closeConfirmDeleteModal();
        }
    }

    render() {
        const { workPackage, onDataChange } = this.props;

        return (
            <Card className="mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center bg-light">
                    <span><strong>{workPackage.name}</strong> (Months: {workPackage.start_date} - {workPackage.end_date})</span>
                    <div>
                        <Button variant="outline-info" size="sm" className="mr-2">Edit WP</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => this.handleDeleteClick(workPackage.id, 'workPackage')}>
                            Delete WP
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body>
                    <div className="mb-4">
                        <p className="mb-2"><strong>Description:</strong> {workPackage.description || 'No description provided.'}</p>
                        
                        <div>
                            <strong>Assigned Users:</strong> {workPackage.users.map(uid => workPackage.userMap[uid] || uid).join(', ')}
                        </div>
                        
                        <div>
                            <strong>Status:</strong>{' '}
                            <Badge variant={workPackage.status === 'active' ? 'success' : 'secondary'}>
                                {workPackage.status}
                            </Badge>
                        </div>
                        
                    </div>
                    <hr/>


                    {/* --- Tasks Table --- */}
                    <h6 className="mt-2">Tasks</h6>
                    <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Start Month</th>
                                <th>End Month</th>
                                <th>Status</th>
                                <th>Users</th>
                                <th>Options</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workPackage.tasks.map((task, index) => (
                                <tr key={task.id}>
                                    <td>{index + 1}</td>
                                    <td>{task.name}</td>
                                    <td>{task.description}</td>
                                    <td>{task.start_date}</td>
                                    <td>{task.end_date}</td>
                                    <td>{task.status}</td>
                                    <td>{task.users.map(uid => workPackage.userMap[uid] || uid).join(', ')}</td>
                                    <td>
                                        <ButtonToolbar>
                                            <Button variant="info" size="sm" className="mr-2" onClick={() => this.setState({ editTaskModalShow: true, editingTask: task })}>
                                                Edit
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => this.handleDeleteClick(task.id, 'task')}>
                                                Delete
                                            </Button>
                                        </ButtonToolbar>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Button variant="secondary" size="sm" className="mt-2" onClick={() => this.setState({ addTaskModalShow: true })}>
                        + Add Task
                    </Button>

                    <hr />

                    {/* --- Deliverables Table --- */}
                    <h6 className="mt-4">Deliverables</h6>
                     <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Deadline (Month)</th>
                                <th>Options</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workPackage.deliverables.map((deliverable, index) => (
                                <tr key={deliverable.id}>
                                    <td>{index + 1}</td>
                                    <td>{deliverable.name}</td>
                                    <td>{deliverable.deadline}</td>
                                    <td>
                                        <ButtonToolbar>
                                            <Button variant="info" size="sm" className="mr-2" onClick={() => this.setState({ editDeliverableModalShow: true, editingDeliverable: deliverable })}>
                                                Edit
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => this.handleDeleteClick(deliverable.id, 'deliverable')}>
                                                Delete
                                            </Button>
                                        </ButtonToolbar>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Button variant="secondary" size="sm" className="mt-2" onClick={() => this.setState({ addDeliverableModalShow: true })}>
                        + Add Deliverable
                    </Button>
                </Card.Body>

                {/* --- Modals --- */}
                <AddTaskModal 
                    show={this.state.addTaskModalShow}
                    onHide={this.closeAddTaskModal}
                    onDataChange={onDataChange}
                    workPackageId={workPackage.id}
                    userMap={workPackage.userMap} 
                    wpUsers={workPackage.users}
                />
                <AddDeliverableModal
                    show={this.state.addDeliverableModalShow}
                    onHide={this.closeAddDeliverableModal}
                    onDataChange={onDataChange}
                    workPackageId={workPackage.id}
                />
                {this.state.editingTask && (
                    <EditTaskModal 
                        show={this.state.editTaskModalShow}
                        onHide={this.closeEditTaskModal}
                        onDataChange={onDataChange}
                        task={this.state.editingTask}
                        userMap={workPackage.userMap}
                        wpUsers={workPackage.users}
                    />
                )}
                {this.state.editingDeliverable && (
                    <EditDeliverableModal
                        show={this.state.editDeliverableModalShow}
                        onHide={this.closeEditDeliverableModal}
                        onDataChange={onDataChange}
                        deliverable={this.state.editingDeliverable}
                    />
                )}
                <ConfirmModal 
                    show={!!this.state.deletingItem}
                    onClose={this.closeConfirmDeleteModal}
                    onConfirm={this.handleConfirmDelete}
                    title="Confirm Deletion"
                    body={`Are you sure you want to delete this ${this.state.deletingItem?.type}? This action cannot be undone.`}
                />
            </Card>
        );
    }
}