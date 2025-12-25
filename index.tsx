import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Only execute DOM manipulation in the browser (client-side)
if (typeof window !== 'undefined') {
  // Safe to use document here
  const element = document.getElementById("some-id");
  // You can perform additional logic with 'element' if needed
  if (element) {
    // e.g., element.innerHTML = 'Hello, World!';
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
