import logo from './logo.svg';
import './App.css';
import { Button } from 'react-bootstrap';
import HomePage from './HomePage';
import { User } from './User';
import { ProjectManagementPage } from './ProjectManagementPage';
import { Navigation } from './Navigation';
import { GanttChartPage } from './GanttChartPage';
import { BudgetPage } from './BudgetPage';
import { FormattedBudgetPage } from './FormattedBudgetPage.js'
import { BrowserRouter, Route, Routes, useNavigate, useLocation, Navigate, Outlet} from 'react-router-dom';

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

//NO_TOKEN => ROUTE TO LOGIN
function RequireAuth({ children }) {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('access_token');
  
  if (!isAuthenticated) {
    if (!['/login', '/register'].includes(location.pathname)) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return null;
  }
  
  return children || <Outlet />; 
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
        <RequireAuth>
          <Navigation />
          <NavigationStepper />
        </RequireAuth>
        
        <Routes>
          <Route path="/login" element={ <LoginPage />}/>
          <Route path="/register" element={ <RegisterPage />}/>
          <Route path="/" element={ <RequireAuth><HomePage /></RequireAuth>}/>
          <Route path="/user" element={<RequireAuth><User /></RequireAuth>} />
          <Route path="/project" element={<ProjectManagementPage />} />
          <Route path="/gantt" element={<RequireAuth><GanttChartPage /></RequireAuth>} />
          <Route path="/budget" element={<RequireAuth><BudgetPage /></RequireAuth>} />
          <Route path="/formattedbudget" element={<RequireAuth><FormattedBudgetPage /></RequireAuth>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
