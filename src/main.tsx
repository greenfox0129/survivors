import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { startLauncherBridge } from '@/launcherBridge';
import './index.css';

startLauncherBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
