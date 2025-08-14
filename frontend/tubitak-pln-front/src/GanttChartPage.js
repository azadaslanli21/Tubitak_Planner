// GanttChartPage.js
import React, { Component, createRef } from 'react';
import { Container, Row, Col, Form, Modal, Table, Button } from 'react-bootstrap';
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
		this.ganttRef = createRef();
	}

	componentDidMount() {
		fetch(process.env.REACT_APP_API + 'projects/' + localStorage.getItem('project_id'))
			.then(r => (r.ok ? r.json() : { start_date: '' }))
			.then(p => this.setState({ projectStart: p.start_date || '' }, this.fetchData));
	}

	componentDidUpdate(prevProps, prevState) {
        // --- THIS IS THE FIX ---
        // We wrap the logic in a setTimeout to ensure the Gantt chart has finished rendering
		setTimeout(() => {
			if (this.ganttRef.current && this.ganttRef.current._gantt) {
				const gantt = this.ganttRef.current._gantt;
				gantt.options.popup_trigger = 'manual';
	
				const bars = gantt.$svg.querySelectorAll('.bar-wrapper');
				bars.forEach(bar => {
					bar.onmouseenter = e => {
						const id = bar.getAttribute('data-id');
						const task = gantt.get_task(id);
						if (task) {
							gantt.show_popup({
								target_element: bar.querySelector('.bar'),
								title: task.name,
								subtitle: `${task.start} – ${task.end}`,
								task
							});
						}
					};
					bar.onmouseleave = e => {
						gantt.hide_popup();
					};
					bar.onclick = e => {
						const id = bar.getAttribute('data-id');
						const task = gantt.get_task(id);
						this.handleBarClick(task);
					};
				});
	
				this.drawDeliverableMarkers();
			}
		}, 0); // A 0ms timeout defers execution until the browser is ready
	}

	drawDeliverableMarkers = () => {
		const gantt = this.ganttRef.current._gantt;
		const { projectStart, deliverables, showDeliverables } = this.state;
		const pStart = dayjs(projectStart);

		gantt.$svg.querySelectorAll('.deliverable-marker').forEach(marker => marker.remove());

		if (!showDeliverables || !projectStart) return;

		const ganttBody = gantt.$svg.querySelector('.gantt-body');
		if (!ganttBody) return;

		deliverables.forEach(del => {
			const parentBar = gantt.$svg.querySelector(`.bar-wrapper[data-id="WP-${del.work_package}"]`);
			if (!parentBar) return;

			const deadlineDate = pStart.add(del.deadline - 1, 'month').toDate();
			const xPos = gantt.date_to_x(deadlineDate);

			const yPos = parseFloat(parentBar.getAttribute('y'));
			const barHeight = parseFloat(parentBar.querySelector('.bar').getAttribute('height'));

			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', xPos);
			line.setAttribute('y1', yPos - 2);
			line.setAttribute('x2', xPos);
			line.setAttribute('y2', yPos + barHeight + 2);
			line.setAttribute('stroke', '#dc3545');
			line.setAttribute('stroke-width', '2');
			line.setAttribute('class', 'deliverable-marker');

			ganttBody.appendChild(line);
		});
	};

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
        	projectStart, workPackages, tasks,
        	filterStatus, filterUser, filterWPs,
        	showWorkPackages, showTasks
    	} = this.state;
    	if (!projectStart) return;

    	const pStart = dayjs(projectStart);
    	const gantt = [];
    	const wpIdToBarId = {};

    	const wpAllowed = id => filterWPs === 'all' || filterWPs.includes(id);

    	workPackages.forEach(wp => {
        	const isWpAllowedByFilter = wpAllowed(wp.id) &&
            	(filterStatus === 'all' || wp.status === filterStatus) &&
            	(filterUser === 'all' || wp.users.some(userId => Array.isArray(filterUser) ? filterUser.includes(userId) : parseInt(filterUser) === userId));
        
        	if (showWorkPackages && isWpAllowedByFilter) {
        	    const barS = pStart.add(wp.start_date - 1, 'month');
        	    const barE = pStart.add(wp.end_date, 'month');
        	    if (this.inRange(barS, barE)) {
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
            	}
        	}

        	if (showTasks && wpIdToBarId[wp.id]) {
            	tasks
                	.filter(t => t.work_package === wp.id)
                	.forEach(t => {
                    	const isTaskAllowedByFilter = (filterStatus === 'all' || t.status === filterStatus) &&
                        	(filterUser === 'all' || t.users.some(userId => Array.isArray(filterUser) ? filterUser.includes(userId) : parseInt(filterUser) === userId));
                    
                    	if (isTaskAllowedByFilter) {
                        	const barS = pStart.add(t.start_date - 1, 'month');
                        	const barE = pStart.add(t.end_date, 'month');
                        	if (this.inRange(barS, barE)) {
                            	gantt.push({
                                	id: `T-${t.id}`,
                                	name: t.name,
                                	start: barS.format('YYYY-MM-DD'),
                                	end: barE.format('YYYY-MM-DD'),
                                	parent: wpIdToBarId[t.work_package],
                                	custom_class: 'bar-task',
                                	progress: 100
                            	});
                        	}
                    	}
                	});
        	}
    	});

    	this.setState({ ganttTasks: gantt });
	};

	userMap = () => Object.fromEntries(this.state.users.map(u => [u.id, u.username || u.name]));

	handleBarClick = bar => {
		if (this.ganttRef.current && this.ganttRef.current._gantt) {
			this.ganttRef.current._gantt.hide_popup();
		}
		if (!bar || !bar.id) return;
		const id = parseInt(bar.id.substring(bar.id.indexOf('-') + 1));
		const type = bar.id.slice(0, 2);
		let data;
		if (type === 'WP') data = this.state.workPackages.find(w => w.id === id);
		else if (type === 'T-') data = this.state.tasks.find(t => t.id === id);
		else if (type === 'D-') data = this.state.deliverables.find(d => d.id === id);
		this.setState({ infoItem: { type: type === 'D-' ? 'Deliverable' : (type === 'T-' ? 'Task' : 'WorkPackage'), data }, showInfo: true });
	};

	handleModalShow = () => {
		if (this.ganttRef.current && this.ganttRef.current._gantt) {
			this.ganttRef.current._gantt.hide_popup();
		}
	};

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
							<div style={{ border: '1px solid #ced4da', borderRadius: 4, maxHeight: 150, overflowY: 'auto', padding: '0.5rem' }}>
								<Form.Check
									type="checkbox"
									id="user-all-checkbox"
									label="All"
									checked={filterUser === 'all'}
									onChange={e => {
										if (e.target.checked) {
											this.setState({ filterUser: 'all' }, this.buildGanttData);
										} else {
											this.setState({ filterUser: [] }, this.buildGanttData);
										}
									}}
									className="mb-1"
								/>
								{users.map(u => (
									<Form.Check
										key={u.id}
										type="checkbox"
										id={`user-checkbox-${u.id}`}
										label={userMap[u.id]}
										value={u.id}
										checked={filterUser === 'all' ? false : filterUser.includes(u.id)}
										disabled={false}
										onChange={e => {
											let newUsers;
											if (filterUser === 'all') {
												newUsers = [u.id];
											} else {
												newUsers = Array.isArray(filterUser) ? [...filterUser] : [];
												const userId = u.id;
												if (e.target.checked) {
													if (!newUsers.includes(userId)) newUsers.push(userId);
												} else {
													newUsers = newUsers.filter(id => id !== userId);
												}
											}
											this.setState({ filterUser: newUsers.length ? newUsers : 'all' }, this.buildGanttData);
										}}
										className="mb-1"
									/>
								))}
							</div>
						</Form.Group>
					</Col>

					<Col sm={3}>
						<Form.Group>
							<Form.Label>WorkPackages</Form.Label>
							<div style={{ border: '1px solid #ced4da', borderRadius: 4, maxHeight: 150, overflowY: 'auto', padding: '0.5rem' }}>
								<Form.Check
									type="checkbox"
									id="wp-all-checkbox"
									label="All"
									checked={filterWPs === 'all'}
									onChange={e => {
										if (e.target.checked) {
											this.setState({ filterWPs: 'all' }, this.buildGanttData);
										} else {
											this.setState({ filterWPs: [] }, this.buildGanttData);
										}
									}}
									className="mb-1"
								/>
								{workPackages.map(wp => (
									<Form.Check
										key={wp.id}
										type="checkbox"
										id={`wp-checkbox-${wp.id}`}
										label={wp.name}
										value={wp.id}
										checked={filterWPs === 'all' ? false : filterWPs.includes(wp.id)}
										disabled={false}
										onChange={e => {
											let newWPs;
											if (filterWPs === 'all') {
												newWPs = [wp.id];
											} else {
												newWPs = Array.isArray(filterWPs) ? [...filterWPs] : [];
												const wpId = wp.id;
												if (e.target.checked) {
													if (!newWPs.includes(wpId)) newWPs.push(wpId);
												} else {
													newWPs = newWPs.filter(id => id !== wpId);
												}
											}
											this.setState({ filterWPs: newWPs.length ? newWPs : 'all' }, this.buildGanttData);
										}}
										className="mb-1"
									/>
								))}
							</div>
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
					<Col sm={6} className="d-flex align-items-center" style={{ marginRight: '1.5rem' }}>
						<div className="form-check d-flex align-items-center" style={{ marginRight: '1.5rem' }}>
							<Form.Check
								type="checkbox"
								id="showTasksCheckbox"
								label="Show Tasks"
								checked={showTasks}
								onChange={e => this.setState({ showTasks: e.target.checked }, this.buildGanttData)}
							/>
						</div>
						<div className="form-check d-flex align-items-center" style={{ marginRight: '1.5rem' }}>
							<Form.Check
								type="checkbox"
								id="showDeliverablesCheckbox"
								label="Show Deliverables"
								checked={showDeliverables}
								onChange={e => this.setState({ showDeliverables: e.target.checked })}
							/>
						</div>
					</Col>
				</Row>

				{ganttTasks.length > 0 && (
					<FrappeGantt
						ref={this.ganttRef}
						tasks={ganttTasks}
						viewMode="Month"
						listCellWidth="220px"
						onClick={this.handleBarClick}
					/>
				)}

				<Modal show={showInfo} onHide={() => this.setState({ showInfo: false })} size="lg" centered onShow={this.handleModalShow}>
					<Modal.Header style={{ position: 'relative' }}>
						<Modal.Title>{infoItem?.type} — {infoItem?.data?.name}</Modal.Title>
						<Button
							variant="danger"
							style={{ position: 'absolute', top: '0.75rem', right: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
							onClick={() => this.setState({ showInfo: false })}
						>
							Close
						</Button>
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