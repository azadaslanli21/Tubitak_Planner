// GanttChartPage.js
import React, { Component } from 'react';
import { Container, Row, Col, Form, Button, Modal, Table } from 'react-bootstrap';
import { FrappeGantt } from 'frappe-gantt-react';
import dayjs from 'dayjs';

export class GanttChartPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectStart: '', // ISO date string, e.g. '2020-01-01'
      workPackages: [],
      tasks: [],
      users: [],
      ganttTasks: [],
      showInfo: false,
      infoItem: null,
      filterStatus: 'all',  // 'all', 'active', 'closed'
      filterUser: 'all',    // user id or 'all'
    };
  }

  /* -------------------------------- helpers -------------------------------- */
  fetchData = () => {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(res => res.json()),
      fetch(process.env.REACT_APP_API + 'tasks').then(res => res.json()),
      fetch(process.env.REACT_APP_API + 'users').then(res => res.json()),
    ]).then(([wps, tasks, users]) =>
      this.setState({ workPackages: wps, tasks, users }, this.buildGanttData)
    );
  };

  buildGanttData = () => {
    const { projectStart, workPackages, tasks, filterStatus, filterUser } = this.state;
    if (!projectStart) return;

    const pStart = dayjs(projectStart);
    const ganttTasks = [];
    const wpIdToTaskId = {};

    // Filter WPs by status and user
    const filteredWPs = workPackages.filter(wp => {
      if (filterStatus !== 'all' && wp.status !== filterStatus) return false;
      if (filterUser !== 'all') {
        // Assuming wp.users is array of assigned user IDs (adjust if your data differs)
        if (!wp.users || !wp.users.includes(parseInt(filterUser))) return false;
      }
      return true;
    });

    filteredWPs.forEach(wp => {
      const start = pStart.add(wp.start_date-1, 'month');
      const end = pStart.add(wp.end_date, 'month');
      const wpTask = {
        id: 'WP-' + wp.id,
        name: wp.name,
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
        custom_class: 'bar-wp',
        progress: 100,
      };
      ganttTasks.push(wpTask);
      wpIdToTaskId[wp.id] = wpTask.id;
    });

    // Filter tasks by status and user and keep tasks only for filtered WPs
    const filteredTasks = tasks.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterUser !== 'all') {
        if (!t.users || !t.users.includes(parseInt(filterUser))) return false;
      }
      if (!wpIdToTaskId[t.work_package]) return false;
      return true;
    });

    filteredTasks.forEach(t => {
      const start = pStart.add(t.start_date-1, 'month');
      const end = pStart.add(t.end_date, 'month');
      ganttTasks.push({
        id: 'T-' + t.id,
        name: t.name,
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
        parent: wpIdToTaskId[t.work_package],
        custom_class: 'bar-task',
        progress: 100,
      });
    });

    this.setState({ ganttTasks });
  };

  /* ----------------------------- events ----------------------------- */
  onProjectStartSubmit = e => {
    e.preventDefault();
    this.buildGanttData();
  };

  handleBarClick = task => {
    const { workPackages, tasks } = this.state;

    if (task.id.startsWith('WP-')) {
      const id = parseInt(task.id.replace('WP-', ''));
      const wp = workPackages.find(w => w.id === id);
      this.setState({ infoItem: { type: 'WorkPackage', data: wp }, showInfo: true });
    } else if (task.id.startsWith('T-')) {
      const id = parseInt(task.id.replace('T-', ''));
      const t = tasks.find(tsk => tsk.id === id);
      this.setState({ infoItem: { type: 'Task', data: t }, showInfo: true });
    }
  };

  /* ----------------------------- lifecycle ----------------------------- */
  componentDidMount() {
    this.fetchData();
  }

  /* ----------------------------- render ----------------------------- */
  render() {
    const {
      ganttTasks,
      showInfo,
      infoItem,
      projectStart,
      users,
      filterStatus,
      filterUser,
    } = this.state;

    // Map userId -> username
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u.username || u.name || `User${u.id}`;
    });

    return (
      <Container fluid className="mt-4">
        {/* Project Start Date */}
        <Row className="mb-3">
          <Col sm={6}>
            <Form onSubmit={this.onProjectStartSubmit} className="d-flex align-items-center">
              <Form.Group controlId="projectStart" className="mb-0 mr-2">
                <Form.Label className="mr-2">Project Start Date:</Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={projectStart}
                  onChange={e => this.setState({ projectStart: e.target.value })}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Build Chart
              </Button>
            </Form>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-3">
          <Col sm={3}>
            <Form.Group controlId="filterStatus">
              <Form.Label>Status Filter:</Form.Label>
              <Form.Control
                as="select"
                value={filterStatus}
                onChange={e => this.setState({ filterStatus: e.target.value }, this.buildGanttData)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </Form.Control>
            </Form.Group>
          </Col>
          <Col sm={3}>
            <Form.Group controlId="filterUser">
              <Form.Label>Filter by Member:</Form.Label>
              <Form.Control
                as="select"
                value={filterUser}
                onChange={e => this.setState({ filterUser: e.target.value }, this.buildGanttData)}
              >
                <option value="all">All Members</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.name || `User ${user.id}`}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        {/* Gantt chart */}
        {ganttTasks.length > 0 && (
          <FrappeGantt
            tasks={ganttTasks}
            viewMode="Month"
            onClick={this.handleBarClick}
            listCellWidth="220px"
          />
        )}

        {/* Info Modal */}
        <Modal show={showInfo} onHide={() => this.setState({ showInfo: false })} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {infoItem?.type} Details – {infoItem?.data?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {infoItem && (
              <Table bordered size="sm" striped>
                <tbody>
                  {Object.entries(infoItem.data).map(([key, val]) => {
                    if (key === 'id') return null; // skip id field

                    let displayVal = val;

                    // If this field is an array of user IDs, replace with usernames
                    if (
                      (key === 'users' || key === 'user_ids' || key === 'assigned_users') &&
                      Array.isArray(val)
                    ) {
                      displayVal = val.map(uid => userMap[uid] || uid).join(', ');
                    }

                    // If it's a single user id, replace with username
                    if (
                      (key === 'user' || key === 'owner' || key === 'assigned_to') &&
                      typeof val === 'number'
                    ) {
                      displayVal = userMap[val] || val;
                    }

                    return (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{Array.isArray(displayVal) ? displayVal.join(', ') : displayVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Modal.Body>
        </Modal>

        {/* Styling for bars */}
        <style>{`
          .bar-wp {
            fill: rgb(0, 88, 210) !important; /* brighter blue for WorkPackages */
          }
          .bar-task {
            fill: rgb(105, 149, 105) !important; /* subdued green for Tasks */
          }
        `}</style>
      </Container>
    );
  }
}
