import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CallRoom from './pages/CallRoom';
import Handoff from './pages/Handoff';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/call/:sessionId" element={<CallRoom />} />
        <Route path="/handoff/:sessionId" element={<Handoff />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
