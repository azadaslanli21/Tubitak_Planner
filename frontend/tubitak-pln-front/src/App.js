import logo from './logo.svg';
import './App.css';

import { Home } from './HomePage';
import { User } from './User';
import { WorkPackage } from './WorkPackage';
import { Task } from './Task';
import { Navigation } from './Navigation';
import { GanttChartPage } from './GanttChartPage';
import { BudgetPage } from './BudgetPage';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <h3 className="m-3 d-flex justify-content-center">
          TUBITAK PROJECT PLANNER
        </h3>

        <Navigation />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user" element={<User />} />
          <Route path="/workpackage" element={<WorkPackage />} />
          <Route path="/task" element={<Task />} />
          <Route path="/gantt" element={<GanttChartPage />} />
          <Route path="/budget" element={<BudgetPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
