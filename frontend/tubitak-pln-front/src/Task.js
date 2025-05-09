import React, { Component } from 'react';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';

export class Task extends Component {
  constructor(props) {
    super(props);
    this.state = { tasks: [], addModalShow: false, editModalShow: false, selectedTask: null };
  }

  refreshList() {
    fetch(process.env.REACT_APP_API + 'tasks')
      .then(response => response.json())
      .then(data => this.setState({ tasks: data }));
  }

  componentDidMount() {
    this.refreshList();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.tasks !== this.state.tasks) {
      this.refreshList();
    }
  }

  deleteTask(taskId) {
    if (window.confirm('Are you sure?')) {
      fetch(process.env.REACT_APP_API + 'tasks/' + taskId, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(() => this.refreshList());
    }
  }

  render() {
    const { tasks, addModalShow, editModalShow, selectedTask } = this.state;

    return (
      <div>
        <Table className="mt-4" striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Users</th>
              <th>Work Package</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task =>
              <tr key={task.id}>
                <td>{task.name}</td>
                <td>{task.description}</td>
                <td>{task.start_date}</td>
                <td>{task.end_date}</td>
                <td>{task.status}</td>
                <td>{task.users.map(u => u.username).join(', ')}</td>
                <td>{task.work_package.name}</td>
                <td>
                  <ButtonToolbar>
                    <Button
                      className="mr-2"
                      variant="info"
                      onClick={() => this.setState({ editModalShow: true, selectedTask: task })}
                    >
                      Edit
                    </Button>
                    <Button
                      className="mr-2"
                      variant="danger"
                      onClick={() => this.deleteTask(task.id)}
                    >
                      Delete
                    </Button>
                  </ButtonToolbar>
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        <ButtonToolbar className="mt-2">
          <Button variant="primary" onClick={() => this.setState({ addModalShow: true })}>
            Add Task
          </Button>
        </ButtonToolbar>

        <AddTaskModal
          show={addModalShow}
          onHide={() => this.setState({ addModalShow: false })}
        />

        {selectedTask && (
          <EditTaskModal
            show={editModalShow}
            onHide={() => this.setState({ editModalShow: false })}
            {...selectedTask}
          />
        )}
      </div>
    );
  }
}
