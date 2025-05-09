import React, { Component } from 'react';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal.js';

export class User extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      addModalShow: false,
      editModalShow: false,
      userid: null,
      username: '',
      userwage: ''
    };
  }

  refreshList() {
    fetch(process.env.REACT_APP_API + 'users/')
      .then(response => response.json())
      .then(data => {
        this.setState({ users: data });
      });
  }

  componentDidMount() {
    this.refreshList();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.addModalShow !== this.state.addModalShow ||
        prevState.editModalShow !== this.state.editModalShow) {
      this.refreshList();
    }
  }

  deleteUser(userid) {
    if (window.confirm('Are you sure you want to delete this user?')) {
      fetch(process.env.REACT_APP_API + 'users/' + userid + '/', {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(result => alert(result));
    }
  }

  render() {
    const { users, userid, username, userwage } = this.state;
    let addModalClose = () => this.setState({ addModalShow: false });
    let editModalClose = () => this.setState({ editModalShow: false });

    return (
      <div>
        <Table className="mt-4" striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Wage</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user =>
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.wage}</td>
                <td>
                  <ButtonToolbar>
                    <Button
                      className="mr-2"
                      variant="info"
                      onClick={() => this.setState({
                        editModalShow: true,
                        userid: user.id,
                        username: user.name,
                        userwage: user.wage
                      })}
                    >
                      Edit
                    </Button>
                    <Button
                      className="mr-2"
                      variant="danger"
                      onClick={() => this.deleteUser(user.id)}
                    >
                      Delete
                    </Button>
                    <EditUserModal
                      show={this.state.editModalShow}
                      onHide={editModalClose}
                      userid={userid}
                      username={username}
                      userwage={userwage}
                    />
                  </ButtonToolbar>
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        <ButtonToolbar>
          <Button
            variant="primary"
            onClick={() => this.setState({ addModalShow: true })}
          >
            Add User
          </Button>

          <AddUserModal
            show={this.state.addModalShow}
            onHide={addModalClose}
          />
        </ButtonToolbar>
      </div>
    );
  }
}
