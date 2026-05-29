import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Landing from './pages/Landing';
import CallRoom from './pages/CallRoom';
import Handoff from './pages/Handoff';
import UseCases from './pages/UseCases';
import Pricing from './pages/Pricing';
import BookDemo from './pages/BookDemo';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/app/DashboardHome';
import Leads from './pages/app/Leads';
import LeadDetail from './pages/app/LeadDetail';
import Handoffs from './pages/app/Handoffs';
import KnowledgeBase from './pages/app/KnowledgeBase';
import Settings from './pages/app/Settings';
import Admin from './pages/app/Admin';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './components/Toaster';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        {/* Public marketing pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/book-demo" element={<BookDemo />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected app routes — anyone signed in can access these.
            Add `requiredPermissions` to specific child routes as needed. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:leadId" element={<LeadDetail />} />
            <Route path="handoffs" element={<Handoffs />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="admin"
              element={<ProtectedRoute requiredPermissions={['roles.manage']} />}
            >
              <Route index element={<Admin />} />
            </Route>
          </Route>
          <Route path="/call/:sessionId" element={<CallRoom />} />
          <Route path="/handoff/:sessionId" element={<Handoff />} />
        </Route>
      </Routes>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  </StrictMode>,
);
