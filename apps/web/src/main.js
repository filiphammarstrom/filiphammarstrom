import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { SupabaseProvider } from './context/SupabaseContext';
import './index.css';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 1000 * 60 },
    },
});
// Electron loads files via file:// protocol, which requires HashRouter.
// Web (GitHub Pages) uses BrowserRouter.
const Router = window.electronAPI ? HashRouter : BrowserRouter;
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(Router, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(SupabaseProvider, { children: _jsx(App, {}) }) }) }) }));
