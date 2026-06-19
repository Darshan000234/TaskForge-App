import { Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/authStore";

const ProtectedRoute = ({ children, loading }) => {
  const token = getAccessToken();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/Signup_login" replace />;
  }

  return children;
};

export default ProtectedRoute;