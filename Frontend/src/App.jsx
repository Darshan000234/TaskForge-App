import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useRef } from 'react';
import axios from 'axios';
import {
  setAccessToken,
  clearAccessToken
} from './utils/authStore.js';
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react';
import Home from './components/Home.jsx'
import Signup_login from './components/Signup_login.jsx'
import DashboardLayout from "./components/DashboardLayout.jsx";
import Dashboard from "./components/Home_Component/Dashboard.jsx";
import Projects from "./components/Home_Component/Projects.jsx";
import Team from "./components/Home_Component/Team.jsx";
import Settings from "./components/Home_Component/Settings.jsx";
import Notification from "./components/Home_Component/Notification.jsx";
import ProjectDetail from './components/Home_Component/Project_Component/ProjectDetail_Component/ProjectDetail.jsx';
import TaskDetail from './components/Home_Component/Task_Component/TaskDetail.jsx';
import Task from './components/Home_Component/Task.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const URL = import.meta.env.VITE_URL;

const App = () => {
  const [loading, setLoading] = useState(true);

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;

    didInit.current = true;
    const initAuth = async () => {
      try {
        const res = await axios.post(
          `${URL}/user/refresh`,
          {},
          { withCredentials: true }
        );
        // console.log(res);

        setAccessToken(res.data.accessToken);
      } catch {
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);


  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          },
        }}
      />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/Signup_login' element={<Signup_login />} />
        <Route path="/user/dashboard"
          element={
            <ProtectedRoute loading={loading}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notification" element={<Notification />} />
          <Route path="task" element={<Task />} />
          <Route path="task/:id" element={<TaskDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App