// FormattedBudgetPage.js
import React, { Component } from 'react';
import { Container, Row, Col, Form, Table, Alert } from 'react-bootstrap';
import dayjs from 'dayjs';

export class FormattedBudgetPage extends Component {
  state = {
    projectStart: '',
    workPackages: [],
    users: [],
    budget: {},               // { "wp_user_month": contribution }
    selectedWP: '',
    selectedUser: '',
    segments: [],             // calculated blocks to display
    message: ''
  };

  /* ---------------- pick helpers -------------- */
  wpById = id => this.state.workPackages.find(w => w.id === id);
  userById = id => this.state.users.find(u => u.id === id);

  /* ---------------- lifecycle ----------------- */
  componentDidMount() {
    // 1. get project start date
    fetch(process.env.REACT_APP_API + 'project/')
      .then(r => (r.ok ? r.json() : { start_date: '' }))
      .then(p => this.setState({ projectStart: p.start_date || '' }, this.loadData));
  }

  loadData = () => {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
      fetch(process.env.REACT_APP_API + 'users').then(r => r.json()),
      fetch(process.env.REACT_APP_API + 'budget').then(r => r.json()) // dict
    ]).then(([wps, users, budget]) =>
      this.setState({ workPackages: wps, users, budget })
    );
  };

  /* -------------- build segments -------------- */
  buildSegments = () => {
    const { selectedWP, selectedUser, budget } = this.state;
    if (!selectedWP || !selectedUser) return;

    // collect all months with contribution > 0
    const months = [];
    for (const [key, value] of Object.entries(budget)) {
      const [wpId, userId, m] = key.split('_').map(Number);
      if (
        wpId === parseInt(selectedWP) &&
        userId === parseInt(selectedUser) &&
        parseFloat(value) > 0
      ) {
        months.push({ month: m, contrib: parseFloat(value) });
      }
    }

    months.sort((a, b) => a.month - b.month);

    const segments = [];
    let i = 0;
    while (i < months.length) {
      const startMonth = months[i].month;
      const pm = months[i].contrib;
      let duration = 1;
      let j = i + 1;
      while (
        j < months.length &&
        months[j].month === months[j - 1].month + 1 &&
        months[j].contrib === pm
      ) {
        duration += 1;
        j += 1;
      }
      segments.push({ startMonth, duration, pm });
      i = j;
    }

    this.setState({ segments });
  };

  /* -------------- render -------------- */
  render() {
    const {
      projectStart,
      workPackages,
      users,
      selectedWP,
      selectedUser,
      segments,
      message
    } = this.state;

    const wpUsers = selectedWP
      ? this.wpById(parseInt(selectedWP))?.users || []
      : [];

    return (
      <Container className="mt-4">
        {message && <Alert variant="info">{message}</Alert>}

        {/* WP picker */}
        <Row className="mb-3">
          <Col sm={4}>
            <Form.Group>
              <Form.Label>Select Work-Package</Form.Label>
              <Form.Control
                as="select"
                value={selectedWP}
                onChange={e =>
                  this.setState(
                    { selectedWP: e.target.value, selectedUser: '', segments: [] },
                    () => {
                      if (!this.wpById(parseInt(e.target.value)))
                        this.setState({ message: '' });
                    }
                  )
                }
              >
                <option value="">— choose —</option>
                {workPackages.map(wp => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>

          {/* User picker */}
          {selectedWP && (
            <Col sm={4}>
              <Form.Group>
                <Form.Label>Select User</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedUser}
                  onChange={e =>
                    this.setState(
                      { selectedUser: e.target.value },
                      this.buildSegments
                    )
                  }
                >
                  <option value="">— choose —</option>
                  {wpUsers.map(uid => {
                    const u = this.userById(uid);
                    return (
                      <option key={uid} value={uid}>
                        {u?.username || u?.name || uid}
                      </option>
                    );
                  })}
                </Form.Control>
              </Form.Group>
            </Col>
          )}
        </Row>

        {/* Output tables */}
        {segments.length > 0 &&
          segments.map((seg, idx) => {
            const startDate = dayjs(projectStart)
              .add(seg.startMonth - 1, 'month')
              .format('DD.MM.YYYY');
            return (
              <Table
                bordered
                size="sm"
                key={idx}
                style={{ maxWidth: 450, marginBottom: '1.5rem' }}
              >
                <thead>
                  <tr>
                    <th colSpan={4}>
                      {this.wpById(parseInt(selectedWP))?.name} —{' '}
                      {this.userById(parseInt(selectedUser))?.name}
                    </th>
                  </tr>
                  <tr>
                    <th>Start</th>
                    <th>Duration&nbsp;(mo)</th>
                    <th>PM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{startDate}</td>
                    <td>{seg.duration}</td>
                    <td>{seg.pm}</td>
                  </tr>
                </tbody>
              </Table>
            );
          })}
      </Container>
    );
  }
}

