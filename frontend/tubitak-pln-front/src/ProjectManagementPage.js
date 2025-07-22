import React, { Component } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import apiClient from './api';
import { AddWorkPackageModal } from './AddWorkPackageModal';
import { WorkPackageCard } from './WorkPackageCard'; // We will create this next

export class ProjectManagementPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            workPackages: [], // This will hold the final, nested data
            addWpModalShow: false,
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    // --- 1. Fetch ALL data and structure it ---
    fetchData = async () => {
        try {
            // Fetch all data types in parallel
            const [wpsRes, tasksRes, deliverablesRes, usersRes] = await Promise.all([
                apiClient.get('workpackages/'),
                apiClient.get('tasks/'),
                apiClient.get('deliverables/'),
                apiClient.get('users/')
            ]);

            const tasks = tasksRes.data;
            const deliverables = deliverablesRes.data;
            
            // Create a lookup map for users
            const userMap = usersRes.data.reduce((map, user) => {
                map[user.id] = user.name;
                return map;
            }, {});

            // Nest tasks and deliverables inside their parent work package
            const nestedWorkPackages = wpsRes.data.map(wp => ({
                ...wp,
                tasks: tasks.filter(t => t.work_package === wp.id),
                deliverables: deliverables.filter(d => d.work_package === wp.id),
                userMap: userMap // Pass the userMap down for convenience
            }));

            this.setState({ workPackages: nestedWorkPackages });

        } catch (error) {
            console.error("Failed to fetch project data", error);
            // The error popup is already handled by the interceptor
        }
    }

    render() {
        const { workPackages, addWpModalShow } = this.state;
        const addWpModalClose = () => this.setState({ addWpModalShow: false });

        return (
            <Container fluid className="mt-4">
                <Row>
                    <Col>
                        <Button variant="primary" onClick={() => this.setState({ addWpModalShow: true })}>
                            + Add New Work Package
                        </Button>
                    </Col>
                </Row>

                {/* --- 2. Render a card for each Work Package --- */}
                <div className="mt-4">
                    {workPackages.map(wp => (
                        <WorkPackageCard 
                            key={wp.id} 
                            workPackage={wp} 
                            onDataChange={this.fetchData} // Pass the refresh function as a prop
                        />
                    ))}
                </div>

                {/* The Add Work Package Modal is managed here */}
                <AddWorkPackageModal 
                    show={addWpModalShow} 
                    onHide={addWpModalClose}
                    onDataChange={this.fetchData} // Pass refresh function
                />
            </Container>
        );
    }
}