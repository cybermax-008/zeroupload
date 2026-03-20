import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { isCapacitor } from './lib/fileUtils';
import App from './App';
import HomePage from './components/HomePage';
import ToolPage from './components/ToolPage';
import BlogIndexPage from './components/BlogIndexPage';
import BlogArticlePage from './components/BlogArticlePage';
import { ROUTES } from './lib/routes';

const Router = isCapacitor() ? MemoryRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <Routes>
          <Route element={<App />}>
            <Route index element={<HomePage />} />
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<ToolPage routeKey={r.path} />} />
            ))}
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogArticlePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);
