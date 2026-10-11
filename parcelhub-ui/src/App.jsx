import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateParcel from "./pages/CreateParcel";
import TrackParcel from "./pages/TrackParcel";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AIAssistant from "./pages/AIAssistant";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* PUBLIC */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* CUSTOMER */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER"
                            ]}
                        >
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/create-parcel"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                                "ADMIN"
                            ]}
                        >
                            <CreateParcel />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/track/:id"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                                "DELIVERY_AGENT",
                                "ADMIN"
                            ]}
                        >
                            <TrackParcel />
                        </ProtectedRoute>
                    }
                />

                {/* AI ASSISTANT */}

                <Route
                    path="/ai-assistant"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                                "DELIVERY_AGENT",
                                "ADMIN"
                            ]}
                        >
                            <AIAssistant />
                        </ProtectedRoute>
                    }
                />

                {/* DELIVERY AGENT */}

                <Route
                    path="/agent-dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "DELIVERY_AGENT"
                            ]}
                        >
                            <AgentDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* ADMIN */}

                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "ADMIN"
                            ]}
                        >
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* FALLBACK */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;