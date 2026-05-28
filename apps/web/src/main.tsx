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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/book-demo" element={<BookDemo />} />
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:leadId" element={<LeadDetail />} />
          <Route path="handoffs" element={<Handoffs />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/call/:sessionId" element={<CallRoom />} />
        <Route path="/handoff/:sessionId" element={<Handoff />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
