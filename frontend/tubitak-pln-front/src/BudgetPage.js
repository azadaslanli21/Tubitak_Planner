import React, { Component } from 'react';
import { Container, Table, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import dayjs from 'dayjs';

// inclusive numeric range helper
const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

export class BudgetPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectStart: '',
      workPackages: [],
      users: [],
      contrib: {},          // { 'wp_user_month': number }
      maxMonth: 0,
      showAlert: null,
      alertVariant: 'danger',
      totals: null,
    };
  }

  /* ---------------- data loading ---------------- */
  componentDidMount() {
    fetch(process.env.REACT_APP_API + 'projects/' + localStorage.getItem('project_id'))
      .then((r) => (r.ok ? r.json() : { start_date: '' }))
      .then((proj) => {
        this.setState({ projectStart: proj.start_date });
        return Promise.all([
          fetch(process.env.REACT_APP_API + 'workpackages').then((r) => r.json()),
          fetch(process.env.REACT_APP_API + 'users').then((r) => r.json()),
          fetch(process.env.REACT_APP_API + 'budget/').then((r) => (r.ok ? r.json() : {})),
        ]);
      })
      .then(([wps, users, budgetData]) => {
        const maxMonth = wps.reduce((m, wp) => Math.max(m, wp.end_date), 0); // end_date is a month index (int)
        this.setState({ workPackages: wps, users, maxMonth, contrib: budgetData });
      });
  }

  /* -------------- helpers ---------------- */
  key = (wpId, userId, month) => `${wpId}_${userId}_${month}`;

  validateSum = (temp, month, userId) => {
    const { workPackages } = this.state;
    let sum = 0;
    workPackages.forEach((wp) => {
      sum += parseFloat(temp[this.key(wp.id, userId, month)]) || 0;
    });
    return sum <= 1;
  };

  handleChange = (wpId, userId, month, value) => {
    const num = parseFloat(value);
    if (value !== '' && (isNaN(num) || num < 0 || num > 1)) {
      this.setState({ showAlert: 'Input must be between 0 and 1.', alertVariant: 'danger' });
      return;
    }

    this.setState((state) => {
      const next = { ...state.contrib };
      const k = this.key(wpId, userId, month);
      value === '' ? delete next[k] : (next[k] = num);

      if (!this.validateSum(next, month, userId)) {
        return { showAlert: `Personnel total in month ${month} exceeds 1.0`, alertVariant: 'danger' };
      }
      return { contrib: next, showAlert: null };
    });
  };

  handlePropagate = (wpId, userId, startMonth, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 1) {
      this.setState({ showAlert: 'Cannot propagate invalid number.', alertVariant: 'danger' });
      return;
    }

    const wp = this.state.workPackages.find((w) => w.id === wpId);
    if (!wp) return;

    this.setState((state) => {
      const next = { ...state.contrib };
      for (let m = startMonth + 1; m <= wp.end_date; m++) {
        next[this.key(wpId, userId, m)] = num;
        if (!this.validateSum(next, m, userId)) {
          return {
            showAlert: `Propagation stopped; Personnel total in month ${m} exceeds 1.0`,
            alertVariant: 'danger',
          };
        }
      }
      return { contrib: next, showAlert: null };
    });
  };

  /* -------------- totals ---------------- */
  calculateTotals = () => {
    const { contrib, users } = this.state;
    const userTotals = {};
    const wpTotals = {};
    const monthTotals = {};

    Object.entries(contrib).forEach(([k, v]) => {
      const [wpId, uid, month] = k.split('_');
      const wage = users.find((u) => u.id === parseInt(uid))?.wage || 0;
      const amt = v * wage;

      userTotals[uid] = (userTotals[uid] || 0) + amt;
      wpTotals[wpId] = (wpTotals[wpId] || 0) + amt;
      monthTotals[month] = (monthTotals[month] || 0) + amt;
    });

    const grandTotal = Object.values(userTotals).reduce((a, b) => a + b, 0);
    this.setState({ totals: { userTotals, wpTotals, monthTotals, grandTotal }, showAlert: null });
  };

  handleSaveBudget = () => {
    fetch(process.env.REACT_APP_API + 'budget/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.state.contrib),
    })
      .then((r) =>
        r.ok
          ? r.json().then((d) => this.setState({ showAlert: d.message || 'Saved!', alertVariant: 'success' }))
          : r.json().then((d) => this.setState({ showAlert: `Save failed: ${d.detail || ''}`, alertVariant: 'danger' }))
      )
      .catch(() => this.setState({ showAlert: 'Network error saving budget.', alertVariant: 'danger' }));
  };

  handleResetBudget = () => this.setState({ contrib: {}, totals: null, showAlert: null });

  /* -------------- render helpers ---------------- */
  renderHeader = () => {
    const { maxMonth, projectStart } = this.state;
    return (
      <tr>
        <th>WorkPackage</th>
        <th>Personnel</th>
        {range(1, maxMonth).map((m) => (
          <th key={m} className="budget-month-header">
            {projectStart ? dayjs(projectStart).add(m - 1, 'month').format('MMM YY') : m} ({m})
          </th>
        ))}
      </tr>
    );
  };

  render() {
    const { projectStart, workPackages, users, contrib, maxMonth, showAlert, alertVariant, totals } = this.state;
    const userName = Object.fromEntries(users.map((u) => [u.id, u.username || u.name]));

    return (
      <Container fluid className="mt-4">
        <Row className="mb-3">
          <Col sm={4}>
            <Form.Group>
              <Form.Label>Project Start Date</Form.Label>
              <Form.Control readOnly value={projectStart || '—'} />
            </Form.Group>
          </Col>
        </Row>

        {showAlert && (
          <Alert variant={alertVariant} onClose={() => this.setState({ showAlert: null })} dismissible>
            {showAlert}
          </Alert>
        )}

        <Table bordered size="sm" responsive>
          <thead>{this.renderHeader()}</thead>
          <tbody>
            {workPackages.map((wp) =>
              wp.users.map((uid, idx) => (
                <tr key={`${wp.id}_${uid}`}>
                  {idx === 0 && (
                    <td rowSpan={wp.users.length} className="align-middle font-weight-bold">
                      {wp.name}
                    </td>
                  )}
                  <td>{userName[uid] || uid}</td>
                  {range(1, maxMonth).map((m) => {
                    const k = this.key(wp.id, uid, m);
                    const inRange = m >= wp.start_date && m <= wp.end_date;
                    return (
                      <td key={k} style={{ minWidth: 80 }}>
                        {inRange ? (
                          <>
                            <Form.Control
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={contrib[k] ?? ''}
                              onChange={(e) => this.handleChange(wp.id, uid, m, e.target.value)}
                            />
                            {contrib[k] !== undefined && contrib[k] !== '' && (
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                className="ml-1 p-1"
                                title="Propagate right"
                                onClick={() => this.handlePropagate(wp.id, uid, m, contrib[k])}
                                style={{ fontSize: '0.7rem', lineHeight: 1 }}
                              >
                                &rarr;
                              </Button>
                            )}
                          </>
                        ) : (
                          <div style={{ background: '#eee', width: '100%', height: '100%' }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <Button variant="success" className="mr-2" onClick={this.calculateTotals}>
          Calculate Budget
        </Button>
        <Button variant="primary" className="mr-2" onClick={this.handleSaveBudget}>
          Save Budget
        </Button>
        <Button variant="warning" onClick={this.handleResetBudget}>
          Reset Budget
        </Button>

        {totals && (
          <>
            <h4 className="mt-4">User Totals</h4>
            <Table bordered size="sm" responsive>
              <thead>
                <tr>
                  <th>Personnel</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals.userTotals).map(([uid, val]) => (
                  <tr key={uid}>
                    <td>{userName[uid] || uid}</td>
                    <td>{val.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <h4>WorkPackage Totals</h4>
            <Table bordered size="sm" responsive>
              <thead>
                <tr>
                  <th>WorkPackage</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals.wpTotals).map(([wpid, val]) => (
                  <tr key={wpid}>
                    <td>{workPackages.find((w) => String(w.id) === wpid)?.name || wpid}</td>
                    <td>{val.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <h4>Month Totals</h4>
            <Table bordered size="sm" responsive>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals.monthTotals).map(([m, val]) => (
                  <tr key={m}>
                    <td>
                      {projectStart ? dayjs(projectStart).add(m - 1, 'month').format('MMM YY') : m} ({m})
                    </td>
                    <td>{val.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <h5>Grand Total: {totals.grandTotal.toFixed(2)}</h5>
          </>
        )}
      </Container>
    );
  }
}
