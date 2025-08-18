import React, { useState } from "react";
import { createRoot } from 'react-dom/client';
import './style/css/index.css';
import App from './components/App/App';
import reportWebVitals from './reportWebVitals';
import Loading from './components/Loading/Loading';

const Overlay: React.FC = () => {
  const [ready, setReady] = useState<boolean>(false);

  const handleStartClick = (): void => {
    setReady(true);
    const canvas = document.querySelector('canvas');
    if (canvas && !document.pointerLockElement) {
      canvas.requestPointerLock();
    }
  };

  return (
    <>
      <App />
      {!ready && (
        <>
          <div className="overlay" onClick={handleStartClick}>
            <div className={"start"}>Digistory'ye Başla</div>
            <img 
              className={"controlsL"} 
              src="./assets/Images/ControlsL.png" 
              alt="Hareket: WASD\nZıpla: SPACE\nKoş: SHIFT"
            />
            <img 
              className={"controlsR"} 
              src="./assets/Images/ControlsR.png" 
              alt="Bak: MOUSE"
            />
            <img 
              className={"controlsTR"} 
              src="./assets/Images/ControlsTR.png" 
              alt="Performans: P\nGece Modu: N\nFPS: F\nMonitor: M"
            />
          </div>
          <div className="dot" onClick={handleStartClick} />
        </>
      )}
      {ready && (
        <div className="dot" style={{ pointerEvents: 'none' }} />
      )}
      <Loading />
    </>
  );
};

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<Overlay />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();