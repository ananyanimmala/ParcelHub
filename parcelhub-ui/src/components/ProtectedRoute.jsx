import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Not logged in
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but wrong role
    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === "ADMIN") {
            return <Navigate to="/admin-dashboard" replace />;
        }

        if (role === "DELIVERY_AGENT") {
            return <Navigate to="/agent-dashboard" replace />;
        }

        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;