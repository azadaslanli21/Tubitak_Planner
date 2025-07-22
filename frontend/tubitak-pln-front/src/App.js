import logo from './logo.svg';
import './App.css';
import { Button } from 'react-bootstrap';

import HomePage from './HomePage';
import { User } from './User';
import { Navigation } from './Navigation';
import { GanttChartPage } from './GanttChartPage';
import { BudgetPage } from './BudgetPage';
import { FormattedBudgetPage } from './FormattedBudgetPage.js'
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom';

import { ProjectManagementPage } from './ProjectManagementPage';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function NavigationStepper() {
  const routes = ["/", "/user", "/project", "/gantt", "/budget", "/formattedbudget"];
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = routes.indexOf(location.pathname);

  const handlePrev = () => {
    if (currentIndex > 0) {
      navigate(routes[currentIndex - 1]);
    }
  };
  const handleNext = () => {
    if (currentIndex < routes.length - 1) {
      navigate(routes[currentIndex + 1]);
    }
  };

  return (
    <div className="d-flex justify-content-center my-4">
      <Button
        variant="dark"
        className="mx-2"
        onClick={handlePrev}
        disabled={currentIndex <= 0}
      >
        Previous
      </Button>
      <Button
        variant="dark"
        className="mx-2"
        onClick={handleNext}
        disabled={currentIndex === -1 || currentIndex >= routes.length - 1}
      >
        Next
      </Button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />

    
      <div className="container">
        <h3 className="m-3 d-flex justify-content-center">
          TUBITAK PROJECT PLANNER
        </h3>

        <Navigation />
        <NavigationStepper />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user" element={<User />} />
          <Route path="/project" element={<ProjectManagementPage />} />
          <Route path="/gantt" element={<GanttChartPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/formattedbudget" element={<FormattedBudgetPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
