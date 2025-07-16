import React, { Component } from 'react';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import { AddWorkPackageModal } from './AddWorkPackageModal';
import { EditWorkPackageModal } from './EditWorkPackageModal';
import { ConfirmModal } from './ConfirmModal'; // --- 1. Import the new modal ---
import apiClient from './api';
import { toast } from 'react-toastify';

export class WorkPackage extends Component {
    constructor(props) {
        super(props);
        // --- 2. Add state for the confirmation modal ---
        this.state = { 
            wps: [], 
            userMap: {}, 
            addModalShow: false, 
            editModalShow: false,
            confirmModalShow: false, // Controls visibility of the confirm modal
            deletingId: null          // Stores the ID of the WP to be deleted
        };
    }

    async refreshList() {
        try {
            const response = await apiClient.get('workpackages/');
            this.setState({ wps: response.data });
        } catch (error) {
            console.error("Could not fetch work packages.");
        }
    }

    async fetchUserMap() {
        try {
            const response = await apiClient.get('users/');
            const userMap = response.data.reduce((map, user) => {
                map[user.id] = user.name;
                return map;
            }, {});
            this.setState({ userMap });
        } catch (error) {
            console.error("Could not fetch users.");
        }
    }

    componentDidMount() {
        this.refreshList();
        this.fetchUserMap();
    }
    
    componentDidUpdate(prevProps, prevState) {
        if (prevState.addModalShow !== this.state.addModalShow || prevState.editModalShow !== this.state.editModalShow) {
            if (!this.state.addModalShow && !this.state.editModalShow) {
                this.refreshList();
            }
        }
    }

    // --- 3. Create a handler that shows the modal ---
    handleDeleteClick = (id) => {
        this.setState({ confirmModalShow: true, deletingId: id });
    }

    // --- 4. Create a handler for when the user confirms the deletion ---
    handleConfirmDelete = async () => {
        try {
            await apiClient.delete(`workpackages/${this.state.deletingId}/`);
            toast.success('Work Package deleted successfully!');
            this.refreshList();
        } catch (error) {
            console.error("Failed to delete work package.");
        } finally {
            // Hide the modal and clear the ID regardless of success or failure
            this.setState({ confirmModalShow: false, deletingId: null });
        }
    }

    render() {
        const { wps, wpid, name, description, start_date, end_date, status, users } = this.state;
        let addModalClose = () => this.setState({ addModalShow: false });
        let editModalClose = () => this.setState({ editModalShow: false });
        let confirmModalClose = () => this.setState({ confirmModalShow: false, deletingId: null });

        return (
            <div>
                <Table className="mt-4" striped bordered hover size="sm">
                    <thead>
                        {/* ... table headers ... */}
                    </thead>
                    <tbody>
                        {wps.map(wp =>
                            <tr key={wp.id}>
                                {/* ... table cells ... */}
                                <td>{wp.id}</td>
                                <td>{wp.name}</td>
                                <td>{wp.description}</td>
                                <td>{wp.start_date}</td>
                                <td>{wp.end_date}</td>
                                <td>{wp.status}</td>
                                <td>{wp.users.map(uid => this.state.userMap[uid] || `ID: ${uid}`).join(', ')}</td>
                                <td>
                                    <ButtonToolbar>
                                        <Button className="mr-2" variant="info"
                                            onClick={() => this.setState({
                                                editModalShow: true,
                                                wpid: wp.id, name: wp.name, description: wp.description,
                                                start_date: wp.start_date, end_date: wp.end_date,
                                                status: wp.status, users: wp.users
                                            })}>
                                            Edit
                                        </Button>
                                        {/* --- 5. Update the Delete button's onClick --- */}
                                        <Button className="mr-2" variant="danger"
                                            onClick={() => this.handleDeleteClick(wp.id)}>
                                            Delete
                                        </Button>
                                    </ButtonToolbar>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>

                <ButtonToolbar>
                    <Button variant="primary" onClick={() => this.setState({ addModalShow: true })}>
                        Add WorkPackage
                    </Button>
                    <AddWorkPackageModal show={this.state.addModalShow} onHide={addModalClose} />
                    <EditWorkPackageModal show={this.state.editModalShow} onHide={editModalClose}
                        wpid={wpid} name={name} description={description}
                        start_date={start_date} end_date={end_date}
                        status={status} userids={users || []} />

                    {/* --- 6. Add the new ConfirmModal to your render method --- */}
                    <ConfirmModal 
                        show={this.state.confirmModalShow}
                        onClose={confirmModalClose}
                        onConfirm={this.handleConfirmDelete}
                        title="Confirm Deletion"
                        body="Are you sure you want to delete this work package?"
                    />
                </ButtonToolbar>
            </div>
        );
    }
}