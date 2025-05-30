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
			contrib: {},
			maxMonth: 0,
			showAlert: null,
			totals: null
		};
	}

	/* ----------------------- data loading ----------------------- */
	componentDidMount() {
		// 1️⃣ fetch project → then WP + users
		fetch(process.env.REACT_APP_API + 'project/')
			.then(r => r.ok ? r.json() : Promise.resolve({ start_date: '' }))
			.then(project => {
				this.setState({ projectStart: project.start_date });
				return Promise.all([
					fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
					fetch(process.env.REACT_APP_API + 'users').then(r => r.json()),
					fetch(process.env.REACT_APP_API + 'budget/').then(r => r.ok ? r.json() : {})
				]);
			})
			.then(([wps, users, budgetData]) => {
				const maxMonth = wps.reduce((m, wp) => Math.max(m, wp.end_date), 0);
				this.setState({
					workPackages: wps,
					users,
					maxMonth,
					contrib: budgetData || {}
				});
			});
	}

	/* ----------------------- helpers ---------------------------- */
	key = (wpId, userId, month) => `${wpId}_${userId}_${month}`;

	handleChange = (wpId, userId, month, value) => {
		const num = parseFloat(value);
		if (value !== '' && (isNaN(num) || num < 0 || num > 1)) {
			this.setState({ showAlert: `Input must be a number between 0 and 1.` });
			return;
		}

		const { contrib, workPackages, users } = this.state;
		const newKey = this.key(wpId, userId, month);

		// create a temporary copy
		const tempContrib = { ...contrib };
		if (value === '') {
			delete tempContrib[newKey]; // Remove if empty
		} else {
			tempContrib[newKey] = num;
		}

		// Calculate the sum for the user (userId) in that month across all work packages
		let userMonthSum = 0;
		for (const wp_iter of workPackages) {
			const keyForSum = this.key(wp_iter.id, userId, month);
			userMonthSum += tempContrib[keyForSum] || 0;
		}

		if (userMonthSum > 1) {
			const user = users.find(u => u.id === userId);
			const userName = user ? (user.username || user.name) : `User ID ${userId}`;
			this.setState({ showAlert: `Total for User '${userName}' in month ${month} (${userMonthSum.toFixed(2)}) cannot exceed 1.` });
			return; // do not update state if sum exceeds 1
		}

		// if valid update the actual contributions
		this.setState({ contrib: tempContrib, showAlert: null });
	};

	handlePropagate = (wpId, userId, month, currentValue) => {
		const { contrib, workPackages, maxMonth, users } = this.state;
		const numValue = parseFloat(currentValue);

		if (isNaN(numValue) || numValue < 0 || numValue > 1) {
			this.setState({ showAlert: "Cannot propagate: invalid source value." });
			return;
		}

		let tempContrib = { ...contrib };
		const originalContrib = { ...contrib }; // to revert if propagation fails

		for (let m = month + 1; m <= maxMonth; m++) {
			const keyToUpdate = this.key(wpId, userId, m);
			tempContrib[keyToUpdate] = numValue;

			// calculate the sum for the user (userId) in month cross all work packages
			let userMonthSum = 0;
			for (const wp_iter of workPackages) {
				const keyForSum = this.key(wp_iter.id, userId, m);
				userMonthSum += tempContrib[keyForSum] || 0;
			}

			if (userMonthSum > 1) {
				const user = users.find(u => u.id === userId);
				const userName = user ? (user.username || user.name) : `User ID ${userId}`;
				this.setState({
					contrib: originalContrib, // Revert to original state before this failed propagation
					showAlert: `Propagation stopped. Total for User '${userName}' in month ${m} (${userMonthSum.toFixed(2)}) would exceed 1.`
				});
				return;
			}
		}

		// If all propagations are valid
		this.setState({ contrib: tempContrib, showAlert: null });
	};

	calculateTotals = () => {
		const { contrib, users } = this.state;
		const userTotals = {};
		const wpTotals = {};
		const monthTotals = {};

		Object.entries(contrib).forEach(([key, value]) => {
			const [wpId, userId, month] = key.split('_');
			const wage = users.find(u => u.id === parseInt(userId))?.wage || 0;
			const amount = value * wage;

			userTotals[userId] = (userTotals[userId] || 0) + amount;
			wpTotals[wpId] = (wpTotals[wpId] || 0) + amount;
			monthTotals[month] = (monthTotals[month] || 0) + amount;
		});

		const grandTotal = Object.values(userTotals).reduce((s, v) => s + v, 0);
		this.setState({ totals: { userTotals, wpTotals, monthTotals, grandTotal } });
	};

	handleSaveBudget = () => {
		fetch(process.env.REACT_APP_API + 'budget/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(this.state.contrib),
		})
			.then(response => {
				if (response.ok) {
					return response.json().then(data => {
						this.setState({ showAlert: data.message || "Budget saved successfully", alertVariant: 'success' });
					});
				} else {
					return response.json().then(data => {
						console.error("Failed to save budget:", data);
						this.setState({ showAlert: `Failed to save budget. ${data.detail || (data.errors ? JSON.stringify(data.errors) : '')}`, alertVariant: 'danger' });
					});
				}
			})
			.catch(error => {
				console.error('Error saving budget:', error);
				this.setState({ showAlert: 'An error occurred while saving the budget.', alertVariant: 'danger' });
			});
	};

	/* ----------------------- rendering -------------------------- */
	renderHeader = () => {
		const { maxMonth, projectStart } = this.state;
		return (
			<tr>
				<th>WorkPackage</th>
				<th>User</th>
				{range(1, maxMonth).map(m => {
					const dateLabel = projectStart ? dayjs(projectStart).add(m - 1, 'month').format('MMM YY') : `Month ${m}`;
					const finalLabel = `${dateLabel} (${m})`;
					return <th key={m} className="budget-month-header">{finalLabel}</th>;
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
				{/* Project start date display (read-only) */}
				<Row className="mb-3">
					<Col sm={4}>
						<Form.Group>
							<Form.Label>Project Start Date:</Form.Label>
							<Form.Control type="text" readOnly value={projectStart || '—'} />
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
												{(contrib[k] !== undefined && contrib[k] !== '') && (
													<Button
														size="sm"
														variant="outline-secondary"
														className="ml-1 p-1"
														title="Propagate this value to the right"
														onClick={() => this.handlePropagate(wp.id, uid, month, contrib[k])}
														style={{ lineHeight: '1', fontSize: '0.7rem' }} // Smaller button
													>
														&rarr;
													</Button>
												)}
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
				<Button variant="primary" onClick={this.handleSaveBudget} className="mb-3 ml-2">
					Save Budget
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

						<h4>WorkPackage Totals</h4>
						<Table bordered size="sm">
							<thead>
								<tr>
									<th>WorkPackage</th>
									<th>Total Budget</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(totals.wpTotals).map(([wpid, val]) => {
									const wp = workPackages.find(w => w.id.toString() === wpid);
									return (
										<tr key={wpid}>
											<td>{wp?.name || wpid}</td>
											<td>{val.toFixed(2)}</td>
										</tr>
									);
								})}
							</tbody>
						</Table>

						<h4>Month Totals</h4>
						<Table bordered size="sm">
							<thead>
								<tr>
									<th>Month</th>
									<th>Total Budget</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(totals.monthTotals).map(([m, val]) => (
									<tr key={m}>
										<td>{projectStart ? dayjs(projectStart).add(parseInt(m) - 1, 'month').format('MMM YY') : m}</td>
										<td>{val.toFixed(2)}</td>
									</tr>
								))}
							</tbody>
						</Table>

						<h5>Total Project Budget: {totals.grandTotal.toFixed(2)}</h5>
					</>
				)}

				<style>{`
          .budget-table input {
            width: 70px;
            display: inline-block;
          }
          .budget-table .btn-sm {
            margin-left: 2px;
          }
          .budget-month-header {
            min-width: 100px;
            text-align: center;
          }
        `}</style>
			</Container>
		);
	}
}
