// FormattedBudgetPage.js
import React, { Component } from 'react';
import { Container, Row, Col, Form, Table, Alert } from 'react-bootstrap';
import dayjs from 'dayjs';

export class FormattedBudgetPage extends Component {
  state = {
    projectStart: '',
    workPackages: [],
    users: [],
    budget: {},             // { "wp_user_month": value }
    selectedWP: '',
    selectedUser: '',
    segments: [],
    message: ''
  };

  /* ---------------- helpers ---------------- */
  wpById = id => this.state.workPackages.find(w => w.id === id);
  userById = id => this.state.users.find(u => u.id === id);

  /* --------------- load data --------------- */
  componentDidMount() {
    fetch(process.env.REACT_APP_API + 'project/')
      .then(r => (r.ok ? r.json() : { start_date: '' }))
      .then(p => this.setState({ projectStart: p.start_date || '' }, this.loadData));
  }

  loadData = () => {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
      fetch(process.env.REACT_APP_API + 'users').then(r => r.json()),
      fetch(process.env.REACT_APP_API + 'budget').then(r => r.json())
    ]).then(([wps, users, budget]) =>
      this.setState({ workPackages: wps, users, budget })
    );
  };

  /* -------- segment builder (unchanged) -------- */
  buildSegments = () => {
    const { selectedWP, selectedUser, budget } = this.state;
    if (!selectedWP || !selectedUser) return;

    const months = [];
    Object.entries(budget).forEach(([k, v]) => {
      const [wpId, userId, m] = k.split('_').map(Number);
      if (wpId === +selectedWP && userId === +selectedUser && v > 0)
        months.push({ month: m, contrib: v });
    });

    months.sort((a, b) => a.month - b.month);

    const segments = [];
    let i = 0;
    while (i < months.length) {
      const start = months[i].month;
      const pm = months[i].contrib;
      let dur = 1;
      let j = i + 1;
      while (j < months.length && months[j].month === months[j - 1].month + 1 && months[j].contrib === pm) {
        dur++; j++;
      }
      segments.push({ startMonth: start, duration: dur, pm });
      i = j;
    }
    this.setState({ segments });
  };

  /* ---------- matrix aggregation ------------- */
  buildMatrix = () => {
    const { workPackages, users, budget } = this.state;

    // matrix[wpId][userId] = total person-months
    const matrix = {};
    workPackages.forEach(wp => (matrix[wp.id] = {}));

    Object.entries(budget).forEach(([k, v]) => {
      const [wpId, userId] = k.split('_').map(Number);
      matrix[wpId][userId] = (matrix[wpId][userId] || 0) + parseFloat(v);
    });

    // row totals and column totals
    const rowTotals = {};
    const colTotals = {};
    Object.entries(matrix).forEach(([wpId, row]) => {
      rowTotals[wpId] = Object.values(row).reduce((s, n) => s + n, 0);
      Object.entries(row).forEach(([uid, val]) => {
        colTotals[uid] = (colTotals[uid] || 0) + val;
      });
    });
    return { matrix, rowTotals, colTotals };
  };

  /* ---------------- render ---------------- */
  render() {
    const {
      projectStart, workPackages, users,
      selectedWP, selectedUser, segments, message
    } = this.state;

    const { matrix, rowTotals, colTotals } = this.buildMatrix();

    const allUserIds = users.map(u => u.id);      // keep consistent column order

    const wpUsers = selectedWP ? this.wpById(+selectedWP)?.users || [] : [];

    return (
      <Container className="mt-4">
        {message && <Alert variant="info">{message}</Alert>}

        {/* pickers ---------------------------------------------------- */}
        <Row className="mb-3">
          <Col sm={4}>
            <Form.Group>
              <Form.Label>Select Work-Package</Form.Label>
              <Form.Control
                as="select"
                value={selectedWP}
                onChange={e =>
                  this.setState({ selectedWP: e.target.value, selectedUser: '', segments: [] })
                }
              >
                <option value="">— choose —</option>
                {workPackages.map(wp => (
                  <option key={wp.id} value={wp.id}>{wp.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>

          {selectedWP && (
            <Col sm={4}>
              <Form.Group>
                <Form.Label>Select User</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedUser}
                  onChange={e => this.setState({ selectedUser: e.target.value }, this.buildSegments)}
                >
                  <option value="">— choose —</option>
                  {wpUsers.map(uid => {
                    const u = this.userById(uid);
                    return <option key={uid} value={uid}>{u?.username || u?.name || uid}</option>;
                  })}
                </Form.Control>
              </Form.Group>
            </Col>
          )}
        </Row>

        {/* segments ---------------------------------------------------- */}
        {segments.length > 0 && segments.map((seg, i) => {
          const start = dayjs(projectStart).add(seg.startMonth - 1, 'month').format('DD.MM.YYYY');
          return (
            <Table bordered size="sm" key={i} style={{ maxWidth: 450, marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th colSpan={3}>
                    {this.wpById(+selectedWP)?.name} — {this.userById(+selectedUser)?.name}
                  </th>
                </tr>
                <tr><th>Start</th><th>Duration (mo)</th><th>PM</th></tr>
              </thead>
              <tbody>
                <tr><td>{start}</td><td>{seg.duration}</td><td>{seg.pm}</td></tr>
              </tbody>
            </Table>
          );
        })}

        {/* NEW Matrix table ------------------------------------------- */}
        <h4 className="mt-4">Work-Package × User Contribution (PM)</h4>
        <Table bordered size="sm" responsive>
          <thead>
            <tr>
              <th>WP \\ User</th>
              {allUserIds.map(uid => (
                <th key={uid}>{this.userById(uid)?.username || this.userById(uid)?.name || uid}</th>
              ))}
              <th>Total (WP)</th>
            </tr>
          </thead>
          <tbody>
            {workPackages.map(wp => (
              <tr key={wp.id}>
                <td className="font-weight-bold">{wp.name}</td>
                {allUserIds.map(uid => (
                  <td key={uid}>{(matrix[wp.id]?.[uid] || 0).toFixed(2)}</td>
                ))}
                <td className="font-weight-bold">{(rowTotals[wp.id] || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total (User)</th>
              {allUserIds.map(uid => (
                <th key={uid}>{(colTotals[uid] || 0).toFixed(2)}</th>
              ))}
              <th>{Object.values(rowTotals).reduce((s, v) => s + v, 0).toFixed(2)}</th>
            </tr>
          </tfoot>
        </Table>
      </Container>
    );
  }
}
