import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import SessionGate from './components/SessionGate.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        {/* Render the app only once an anonymous session (userId) is ready. */}
        <SessionGate>
          <App />
        </SessionGate>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>
);
