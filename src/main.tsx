import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { startLauncherBridge } from '@/launcherBridge';
import './index.css';

// 원클릭 실행기 모드면 디스크 세이브 동기화가 끝난 뒤 렌더한다 (일반 브라우저에서는 즉시)
void startLauncherBridge().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
