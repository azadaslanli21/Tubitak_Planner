import React, { Component } from 'react';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';

export class Task extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      addModalShow: false,
      editModalShow: false,
      userMap: {},
      wpMap: {},
    };
  }

  /* ------------------ helpers ------------------ */
  refreshList = () => {
    fetch(process.env.REACT_APP_API + 'tasks')
      .then(res => res.json())
      .then(data => this.setState({ tasks: data }));
  };

  getUserNamesByIds = ids => ids.map(id => this.state.userMap[id] || id);

  getWPName = id => this.state.wpMap[id] || id;

  deleteTask = id => {
    if (window.confirm('Are you sure?')) {
      fetch(process.env.REACT_APP_API + 'tasks/' + id + '/', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }).then(this.refreshList);
    }
  };

  /* ------------------ lifecycle ------------------ */
  componentDidMount() {
    // Pre‑load lookup maps, then tasks
    Promise.all([
      fetch(process.env.REACT_APP_API + 'users').then(r => r.json()),
      fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
    ]).then(([users, wps]) => {
      const userMap = {};
      users.forEach(u => (userMap[u.id] = u.name));
      const wpMap = {};
      wps.forEach(wp => (wpMap[wp.id] = wp.name));
      this.setState({ userMap, wpMap }, this.refreshList);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.addModalShow !== this.state.addModalShow ||
      prevState.editModalShow !== this.state.editModalShow
    ) {
      this.refreshList();
    }
  }

  /* ------------------ render ------------------ */
  render() {
    const { tasks } = this.state;
    const addModalClose = () => this.setState({ addModalShow: false });
    const editModalClose = () => this.setState({ editModalShow: false });

    return (
      <div>
        <Table className="mt-4" striped bordered hover size="sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>WorkPackage</th>
              <th>Users</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.description}</td>
                <td>{t.start_date}</td>
                <td>{t.end_date}</td>
                <td>{t.status}</td>
                <td>{this.getWPName(t.work_package)}</td>
                <td>{this.getUserNamesByIds(t.users).join(', ')}</td>
                <td>
                  <ButtonToolbar>
                    <Button
                      className="mr-2"
                      variant="info"
                      onClick={() =>
                        this.setState({
                          editModalShow: true,
                          taskid: t.id,
                          name: t.name,
                          description: t.description,
                          start_date: t.start_date,
                          end_date: t.end_date,
                          status: t.status,
                          usernames: this.getUserNamesByIds(t.users),
                          work_package: t.work_package,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button className="mr-2" variant="danger" onClick={() => this.deleteTask(t.id)}>
                      Delete
                    </Button>
                  </ButtonToolbar>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <ButtonToolbar>
          <Button variant="primary" onClick={() => this.setState({ addModalShow: true })}>
            Add Task
          </Button>

          <AddTaskModal show={this.state.addModalShow} onHide={addModalClose} />

          <EditTaskModal
            show={this.state.editModalShow}
            onHide={editModalClose}
            taskid={this.state.taskid}
            name={this.state.name}
            description={this.state.description}
            start_date={this.state.start_date}
            end_date={this.state.end_date}
            status={this.state.status}
            usernames={this.state.usernames || []}
            work_package={this.state.work_package}
          />
        </ButtonToolbar>
      </div>
    );
  }
}
