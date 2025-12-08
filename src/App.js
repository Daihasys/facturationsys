import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Products from "./components/pages/Products";
import Sales from "./components/pages/Sales";
import SalesList from "./components/pages/SalesList";
import Categories from "./components/pages/Categories";
import Reports from "./components/pages/Reports";
import Users from "./components/pages/Users";
import Roles from "./components/pages/Roles";
import Backup from "./components/pages/Backup";
import Login from "./components/auth/Login";
import PasswordRecovery from "./components/auth/PasswordRecovery";
import Settings from "./components/pages/Settings";
import ErrorReports from "./components/pages/ErrorReports";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./context/AuthContext";
import "./index.css";

// Simple ProtectedRoute for authentication check only
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>; // Or a loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const { isAuthenticated, logout, isLoading, user } = useAuth();


  if (isLoading) {
    return <div>Cargando aplicación...</div>; // Global app loading state
  }

  return (
    <ErrorBoundary userId={user?.userId}>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />

          {/* Protected Routes (requires authentication) */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout onLogout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/list" element={<SalesList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="backups" element={<Backup />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="settings" element={<Settings />} />
            <Route path="error-reports" element={<ErrorReports />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;