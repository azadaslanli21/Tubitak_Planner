import React, { Component } from 'react';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import { AddWorkPackageModal } from './AddWorkPackageModal';
import { EditWorkPackageModal } from './EditWorkPackageModal';

export class WorkPackage extends Component {
    constructor(props) {
        super(props);
        this.state = { wps: [], addModalShow: false, editModalShow: false };
    }

    refreshList() {
        fetch(process.env.REACT_APP_API + 'workpackages')
            .then(response => response.json())
            .then(data => this.setState({ wps: data }));
    }

    componentDidMount() {
        this.refreshList();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.addModalShow !== this.state.addModalShow || prevState.editModalShow !== this.state.editModalShow) {
            this.refreshList();
        }
    }

    deleteWP(id) {
        if (window.confirm('Are you sure?')) {
            fetch(process.env.REACT_APP_API + 'workpackages/' + id + "/", {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            }).then(() => this.refreshList());
        }
    }

    render() {
        const { wps, wpid, name, description, start_date, end_date, status, usernames } = this.state;
        let addModalClose = () => this.setState({ addModalShow: false });
        let editModalClose = () => this.setState({ editModalShow: false });

        return (
            <div>
                <Table className="mt-4" striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Description</th><th>Start</th><th>End</th><th>Status</th><th>Users</th><th>Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wps.map(wp =>
                            <tr key={wp.id}>
                                <td>{wp.id}</td>
                                <td>{wp.name}</td>
                                <td>{wp.description}</td>
                                <td>{wp.start_date}</td>
                                <td>{wp.end_date}</td>
                                <td>{wp.status}</td>
                                <td>{wp.users.map(uid => this.state.userMap?.[uid] || uid).join(', ')}</td>
                                <td>
                                    <ButtonToolbar>
                                        <Button className="mr-2" variant="info"
                                            onClick={() => this.setState({
                                                editModalShow: true,
                                                wpid: wp.id,
                                                name: wp.name,
                                                description: wp.description,
                                                start_date: wp.start_date,
                                                end_date: wp.end_date,
                                                status: wp.status,
                                                usernames: this.getUserNamesByIds(wp.users)
                                            })}>
                                            Edit
                                        </Button>
                                        <Button className="mr-2" variant="danger"
                                            onClick={() => this.deleteWP(wp.id)}>
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
                        status={status} usernames={usernames || []} />
                </ButtonToolbar>
            </div>
        );
    }

    getUserNamesByIds(ids) {
        if (!this.state.userMap) return ids;
        return ids.map(id => this.state.userMap[id] || id);
    }

    componentWillMount() {
        fetch(process.env.REACT_APP_API + 'users')
            .then(res => res.json())
            .then(users => {
                let map = {};
                users.forEach(u => map[u.id] = u.name);
                this.setState({ userMap: map });
            });
    }
}
