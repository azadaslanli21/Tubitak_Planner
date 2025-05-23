// BudgetPage.js – interactive budget worksheet
// --------------------------------------------------------------
// Requirements:
//   npm i dayjs react-bootstrap
// --------------------------------------------------------------
import React, { Component } from 'react';
import { Container, Table, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import dayjs from 'dayjs';

// Utility: build array [start, start+1, ... end] inclusive
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export class BudgetPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectStart: '',      // ISO date string (needed for calendar labels)
      workPackages: [],      // fetched
      users: [],             // fetched (with wage)
      // contributions: { [wpId_userId_month]: number }
      contrib: {},
      maxMonth: 0,
      showAlert: null,       // validation messages
      totals: null           // {userTotals, grandTotal}
    };
  }

  /* ----------------------- data loading ----------------------- */
  componentDidMount() {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
      fetch(process.env.REACT_APP_API + 'users').then(r => r.json())
    ]).then(([wps, users]) => {
      const maxMonth = wps.reduce((m, wp) => Math.max(m, wp.end_date), 0);
      this.setState({ workPackages: wps, users, maxMonth });
    });
  }

  /* ----------------------- helpers ---------------------------- */
  key = (wpId, userId, month) => `${wpId}_${userId}_${month}`;

  handleChange = (wpId, userId, month, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 1) return; // simple validation

    // Compute new total for this user & month across all WPs
    const { contrib } = this.state;
    const newKey = this.key(wpId, userId, month);
    const temp = { ...contrib, [newKey]: num };

    const monthlySum = Object.entries(temp)
      .filter(([k, v]) => k.endsWith(`_${userId}_${month}`))
      .reduce((s, [, v]) => s + v, 0);

    if (monthlySum > 1) {
      this.setState({ showAlert: `Total for user exceeds 1 in month ${month}` });
      return;
    }

    this.setState({ contrib: temp, showAlert: null });
  };

  calculateTotals = () => {
    const { contrib, users } = this.state;
    const userTotals = {}; // userId -> total money

    Object.entries(contrib).forEach(([key, value]) => {
      const [, userId] = key.split('_');
      const wage = users.find(u => u.id === parseInt(userId))?.wage || 0;
      userTotals[userId] = (userTotals[userId] || 0) + value * wage;
    });

    const grandTotal = Object.values(userTotals).reduce((s, v) => s + v, 0);
    this.setState({ totals: { userTotals, grandTotal } });
  };

  /* ----------------------- rendering -------------------------- */
  renderHeader = () => {
    const { maxMonth, projectStart } = this.state;
    return (
      <tr>
        <th>WorkPackage</th>
        <th>User</th>
        {range(1, maxMonth).map(m => {
          const label = projectStart ? dayjs(projectStart).add(m - 1, 'month').format('MMM YY') : m;
          return <th key={m}>{label}</th>;
        })}
      </tr>
    );
  };

  render() {
    const { workPackages, users, maxMonth, contrib, showAlert, totals, projectStart } = this.state;

    const userMap = {};
    users.forEach(u => (userMap[u.id] = u.username || u.name));

    return (
      <Container fluid className="mt-4">
        {/* Project start date for column labels */}
        <Row className="mb-3">
          <Col sm={4}>
            <Form.Group controlId="projectStart">
              <Form.Label>Project Start Date:</Form.Label>
              <Form.Control
                type="date"
                value={projectStart}
                onChange={e => this.setState({ projectStart: e.target.value })}
              />
            </Form.Group>
          </Col>
        </Row>

        {showAlert && (
          <Alert variant="danger" onClose={() => this.setState({ showAlert: null })} dismissible>
            {showAlert}
          </Alert>
        )}

        <Table bordered size="sm" className="budget-table">
          <thead>{this.renderHeader()}</thead>
          <tbody>
            {workPackages.map(wp => (
              wp.users.map((uid, idx) => (
                <tr key={`${wp.id}-${uid}`}>
                  {idx === 0 && (
                    <td rowSpan={wp.users.length} className="align-middle font-weight-bold">
                      {wp.name}
                    </td>
                  )}
                  <td>{userMap[uid] || uid}</td>
                  {range(1, maxMonth).map(month => {
                    const k = this.key(wp.id, uid, month);
                    return (
                      <td key={k} style={{ minWidth: 80 }}>
                        <Form.Control
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={contrib[k] ?? ''}
                          onChange={e => this.handleChange(wp.id, uid, month, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            ))}
          </tbody>
        </Table>

        <Button variant="success" onClick={this.calculateTotals} className="mb-3">
          Calculate Budget
        </Button>

        {totals && (
          <>
            <h4>User Totals</h4>
            <Table bordered size="sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total Budget</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals.userTotals).map(([uid, val]) => (
                  <tr key={uid}>
                    <td>{userMap[uid] || uid}</td>
                    <td>{val.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <h5>Total Project Budget: {totals.grandTotal.toFixed(2)}</h5>
          </>
        )}

        {/* Basic styling */}
        <style>{`
          .budget-table input {
            width: 70px;
          }
        `}</style>
      </Container>
    );
  }
}
