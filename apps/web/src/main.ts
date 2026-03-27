/**
 * Vite Entry Point
 * Initializes React and mounts the application to the DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in HTML');
}

ReactDOM.createRoot(rootElement).render(React.createElement(App));
