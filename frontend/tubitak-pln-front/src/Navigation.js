import React,{Component} from 'react';
import {NavLink} from 'react-router-dom';
import {Navbar,Nav} from 'react-bootstrap';

export class Navigation extends Component{

    render(){
        return(
            <Navbar bg="dark" expand="lg">
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse id="basic-navbar-nav">
                <Nav>
                <NavLink className="d-inline p-2 bg-dark text-white" to="/">
                    Home
                </NavLink>
                <NavLink className="d-inline p-2 bg-dark text-white" to="/user">
                    User
                </NavLink>
                <NavLink className="d-inline p-2 bg-dark text-white" to="/project">
                    Project Management 
                </NavLink>
                <NavLink className="d-inline p-2 bg-dark text-white" to="/gantt">
                    Gantt Chart
                </NavLink>         
                <NavLink className="d-inline p-2 bg-dark text-white" to="/budget">
                    Budget Table
                </NavLink> 
                <NavLink className="d-inline p-2 bg-dark text-white" to="/formattedbudget">
                    TUBITAK FORMATTED BUDGET
                </NavLink> 
                </Nav>
                </Navbar.Collapse>
            </Navbar>
        )
    }
}