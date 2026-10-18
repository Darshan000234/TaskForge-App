import { lazy, Suspense, useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import {
  setAccessToken,
  clearAccessToken,
} from './utils/authStore.js';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Route components are loaded only when their routes are needed.
// This keeps the landing page's initial JavaScript smaller.
const Home = lazy(() => import('./components/Home.jsx'));
const Signup_login = lazy(() => import('./components/Signup_login.jsx'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout.jsx'));
const Dashboard = lazy(() => import('./components/Home_Component/Dashboard.jsx'));
const Projects = lazy(() => import('./components/Home_Component/Projects.jsx'));
const Team = lazy(() => import('./components/Home_Component/Team.jsx'));
const Settings = lazy(() => import('./components/Home_Component/Settings.jsx'));
const Notification = lazy(() => import('./components/Home_Component/Notification.jsx'));
const ProjectDetail = lazy(() =>
  import('./components/Home_Component/Project_Component/ProjectDetail_Component/ProjectDetail.jsx')
);
const TaskDetail = lazy(() =>
  import('./components/Home_Component/Task_Component/TaskDetail.jsx')
);
const Task = lazy(() => import('./components/Home_Component/Task.jsx'));

const URL = import.meta.env.VITE_URL;
const PERFORMANCE_LOGS =
  import.meta.env.DEV || import.meta.env.VITE_PERFORMANCE_LOGS === "true";

const RouteLoadingFallback = () => (
  <div
    className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300"
    role="status"
    aria-live="polite"
  >
    <span className="text-sm">Loading page...</span>
  </div>
);

const LazyRoute = ({ children }) => (
  <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
);

const App = () => {
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;

    didInit.current = true;

    const initAuth = async () => {
      const startedAt = performance.now();
      let status = "network-error";
      let requestId = null;

      try {
        const res = await axios.post(
          `${URL}/user/refresh`,
          {},
          { withCredentials: true }
        );

        status = res.status;
        requestId = res.headers?.["x-request-id"] ?? null;
        setAccessToken(res.data.accessToken);
      } catch (error) {
        status = error.response?.status ?? "network-error";
        requestId = error.response?.headers?.["x-request-id"] ?? null;
        clearAccessToken();
      } finally {
        if (PERFORMANCE_LOGS) {
          console.info("[TaskForge perf] startup.auth_refresh", {
            durationMs: Math.round(performance.now() - startedAt),
            status,
            requestId,
          });
        }
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
        <Route
          path="/"
          element={
            <LazyRoute>
              <Home />
            </LazyRoute>
          }
        />
        <Route
          path="/Signup_login"
          element={
            <LazyRoute>
              <Signup_login />
            </LazyRoute>
          }
        />

        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute loading={loading}>
              <LazyRoute>
                <DashboardLayout />
              </LazyRoute>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <LazyRoute>
                <Dashboard />
              </LazyRoute>
            }
          />
          <Route
            path="projects"
            element={
              <LazyRoute>
                <Projects />
              </LazyRoute>
            }
          />
          <Route
            path="projects/:id"
            element={
              <LazyRoute>
                <ProjectDetail />
              </LazyRoute>
            }
          />
          <Route
            path="team"
            element={
              <LazyRoute>
                <Team />
              </LazyRoute>
            }
          />
          <Route
            path="settings"
            element={
              <LazyRoute>
                <Settings />
              </LazyRoute>
            }
          />
          <Route
            path="notification"
            element={
              <LazyRoute>
                <Notification />
              </LazyRoute>
            }
          />
          <Route
            path="task"
            element={
              <LazyRoute>
                <Task />
              </LazyRoute>
            }
          />
          <Route
            path="task/:id"
            element={
              <LazyRoute>
                <TaskDetail />
              </LazyRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
