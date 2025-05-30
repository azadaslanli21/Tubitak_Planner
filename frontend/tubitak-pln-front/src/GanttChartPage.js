// GanttChartPage.js
import React, { Component } from 'react';
import { Container, Row, Col, Form, Modal, Table } from 'react-bootstrap';
import { FrappeGantt } from 'frappe-gantt-react';
import dayjs from 'dayjs';

import './GanttChartPage.css';

export class GanttChartPage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			projectStart: '',
			workPackages: [],
			tasks: [],
			users: [],
			deliverables: [],
			ganttTasks: [],
			showInfo: false,
			infoItem: null,
			filterStatus: 'all',
			filterUser: 'all',
			filterWPs: 'all',
			rangeFrom: '',
			rangeTo: '',
			showWorkPackages: true,
			showTasks: true,
			showDeliverables: true,
		};
	}

	componentDidMount() {
		fetch(process.env.REACT_APP_API + 'project/')
			.then(r => (r.ok ? r.json() : { start_date: '' }))
			.then(p => this.setState({ projectStart: p.start_date || '' }, this.fetchData));
	}

	fetchData = () => {
		Promise.all([
			fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
			fetch(process.env.REACT_APP_API + 'tasks').then(r => r.json()),
			fetch(process.env.REACT_APP_API + 'users').then(r => r.json()),
			fetch(process.env.REACT_APP_API + 'deliverables').then(r => r.json())
		]).then(([wps, tasks, users, deliverables]) =>
			this.setState({ workPackages: wps, tasks, users, deliverables }, this.buildGanttData)
		);
	};

	inRange = (a, b) => {
		const { rangeFrom, rangeTo } = this.state;
		if (!rangeFrom && !rangeTo) return true;
		const s = dayjs(a), e = dayjs(b);
		if (rangeFrom && e.isBefore(rangeFrom)) return false;
		if (rangeTo && s.isAfter(rangeTo)) return false;
		return true;
	};

	buildGanttData = () => {
		const {
			projectStart, workPackages, tasks, deliverables,
			filterStatus, filterUser, filterWPs,
			showWorkPackages, showTasks, showDeliverables
		} = this.state;
		if (!projectStart) return;

		const pStart = dayjs(projectStart);
		const gantt = [];
		const wpIdToBarId = {};

		const wpAllowed = id => filterWPs === 'all' || filterWPs.includes(id);

		if (showWorkPackages) {
			workPackages
				.filter(wp => {
					if (!wpAllowed(wp.id)) return false;
					if (filterStatus !== 'all' && wp.status !== filterStatus) return false;
					if (filterUser !== 'all') {
						const ids = wp.users.map(u => (typeof u === 'object' ? u.id : u));
						if (!ids.includes(parseInt(filterUser))) return false;
					}
					const barS = pStart.add(wp.start_date - 1, 'month');
					const barE = pStart.add(wp.end_date, 'month');
					return this.inRange(barS, barE);
				})
				.forEach(wp => {
					const barS = pStart.add(wp.start_date - 1, 'month');
					const barE = pStart.add(wp.end_date, 'month');
					const bar = {
						id: `WP-${wp.id}`,
						name: wp.name,
						start: barS.format('YYYY-MM-DD'),
						end: barE.format('YYYY-MM-DD'),
						custom_class: 'bar-wp',
						progress: 100
					};
					gantt.push(bar);
					wpIdToBarId[wp.id] = bar.id;
				});
		}

		if (showTasks) {
			tasks
				.filter(t => {
					if (!wpIdToBarId[t.work_package]) return false;
					if (filterStatus !== 'all' && t.status !== filterStatus) return false;
					if (filterUser !== 'all') {
						const ids = t.users.map(u => (typeof u === 'object' ? u.id : u));
						if (!ids.includes(parseInt(filterUser))) return false;
					}
					const barS = pStart.add(t.start_date - 1, 'month');
					const barE = pStart.add(t.end_date, 'month');
					return this.inRange(barS, barE);
				})
				.forEach(t => {
					const barS = pStart.add(t.start_date - 1, 'month');
					const barE = pStart.add(t.end_date, 'month');
					gantt.push({
						id: `T-${t.id}`,
						name: t.name,
						start: barS.format('YYYY-MM-DD'),
						end: barE.format('YYYY-MM-DD'),
						parent: wpIdToBarId[t.work_package],
						custom_class: 'bar-task',
						progress: 100
					});
				});
		}

		if (showDeliverables) {
			deliverables
				.filter(d => {
					if (filterUser !== 'all') return false; // if needed, you can assign users to deliverables
					if (!wpAllowed(d.work_package)) return false;
					const deadline = pStart.add(d.deadline - 1, 'month');
					return this.inRange(deadline, deadline);
				})
				.forEach(d => {
					const deadline = pStart.add(d.deadline - 1, 'month');
					gantt.push({
						id: `D-${d.id}`,
						name: d.name,
						start: deadline.format('YYYY-MM-DD'),
						end: deadline.format('YYYY-MM-DD'),
						custom_class: 'bar-deliverable',
						progress: 0
					});
				});
		}

		this.setState({ ganttTasks: gantt });
	};

	userMap = () => Object.fromEntries(this.state.users.map(u => [u.id, u.username || u.name]));

	render() {
		const {
			ganttTasks, showInfo, infoItem,
			projectStart, users, workPackages,
			filterStatus, filterUser, filterWPs,
			rangeFrom, rangeTo,
			showWorkPackages, showTasks, showDeliverables
		} = this.state;

		const userMap = this.userMap();

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

				<Row className="mb-3">
					<Col sm={2}>
						<Form.Group>
							<Form.Label>Status</Form.Label>
							<Form.Control
								as="select" value={filterStatus}
								onChange={e => this.setState({ filterStatus: e.target.value }, this.buildGanttData)}
							>
								<option value="all">All</option>
								<option value="active">Active</option>
								<option value="closed">Closed</option>
							</Form.Control>
						</Form.Group>
					</Col>

					<Col sm={2}>
						<Form.Group>
							<Form.Label>Member</Form.Label>
							<Form.Control
								as="select" value={filterUser}
								onChange={e => this.setState({ filterUser: e.target.value }, this.buildGanttData)}
							>
								<option value="all">All</option>
								{users.map(u => (
									<option key={u.id} value={u.id}>{userMap[u.id]}</option>
								))}
							</Form.Control>
						</Form.Group>
					</Col>

					<Col sm={3}>
						<Form.Group>
							<Form.Label>WorkPackages</Form.Label>
							<Form.Control
								as="select" multiple
								value={filterWPs === 'all' ? [] : filterWPs}
								onChange={e => {
									const sel = Array.from(e.target.selectedOptions).map(o => parseInt(o.value));
									this.setState({ filterWPs: sel.length ? sel : 'all' }, this.buildGanttData);
								}}
							>
								{workPackages.map(wp => (
									<option key={wp.id} value={wp.id}>{wp.name}</option>
								))}
							</Form.Control>
						</Form.Group>
					</Col>

					<Col sm={3}>
						<Form.Group>
							<Form.Label>Date Range</Form.Label>
							<Row>
								<Col><Form.Control
									type="date" value={rangeFrom}
									onChange={e => this.setState({ rangeFrom: e.target.value }, this.buildGanttData)}
								/></Col>
								<Col><Form.Control
									type="date" value={rangeTo}
									onChange={e => this.setState({ rangeTo: e.target.value }, this.buildGanttData)}
								/></Col>
							</Row>
						</Form.Group>
					</Col>
				</Row>

				<Row className="mb-3">
					<Col sm={6} className="d-flex gap-4">
						<Form.Check
							type="checkbox" label="Show WPs" checked={showWorkPackages}
							onChange={e => this.setState({ showWorkPackages: e.target.checked }, this.buildGanttData)}
						/>
						<Form.Check
							type="checkbox" label="Show Tasks" checked={showTasks}
							onChange={e => this.setState({ showTasks: e.target.checked }, this.buildGanttData)}
						/>
						<Form.Check
							type="checkbox" label="Show Deliverables" checked={showDeliverables}
							onChange={e => this.setState({ showDeliverables: e.target.checked }, this.buildGanttData)}
						/>
					</Col>
				</Row>

				{ganttTasks.length > 0 && (
					<FrappeGantt
						tasks={ganttTasks}
						viewMode="Month"
						listCellWidth="220px"
						onClick={bar => {
							const id = parseInt(bar.id.substring(bar.id.indexOf('-') + 1));
							const type = bar.id.slice(0, 2);
							let data;
							if (type === 'WP') data = this.state.workPackages.find(w => w.id === id);
							else if (type === 'T-') data = this.state.tasks.find(t => t.id === id);
							else if (type === 'D-') data = this.state.deliverables.find(d => d.id === id);
							this.setState({ infoItem: { type: type === 'D-' ? 'Deliverable' : (type === 'T-' ? 'Task' : 'WorkPackage'), data }, showInfo: true });
						}}
					/>
				)}

				<Modal show={showInfo} onHide={() => this.setState({ showInfo: false })} size="lg" centered>
					<Modal.Header closeButton>
						<Modal.Title>{infoItem?.type} — {infoItem?.data?.name}</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						{infoItem && (
							<Table bordered size="sm">
								<tbody>
									{Object.entries(infoItem.data).map(([k, v]) => {
										if (k === 'id') return null;
										let val = v;
										if (Array.isArray(v)) val = v.map(x => userMap[x.id ?? x] ?? x).join(', ');
										if (typeof v === 'number' && (k === 'user' || k === 'owner')) val = userMap[v] ?? v;
										return (<tr key={k}><th>{k}</th><td>{val}</td></tr>);
									})}
								</tbody>
							</Table>
						)}
					</Modal.Body>
				</Modal>


			</Container>
		);
	}
}
