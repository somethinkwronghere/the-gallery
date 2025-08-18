import React, { useState } from "react"
import { createRoot } from 'react-dom/client';
import './style/css/index.css';
import App from './components/App/App';
import reportWebVitals from './reportWebVitals';
import Loading from './components/Loading/Loading';

const Overlay = () => {
  const [ready, setReady] = useState(false)

  // Overlay readiness is controlled explicitly via click now

  return (
    <>
      <App />
      {!ready && (
        <>
          <div className="overlay"
            onClick={() => {
              setReady(true);
              const canvas = document.querySelector('canvas');
              if (canvas && !document.pointerLockElement) {
                canvas.requestPointerLock();
              }
            }}
          >
            <div className={"start"}>Digistory'ye Başla</div>
            <img className={"controlsL"} src="./assets/Images/ControlsL.png" alt="Hareket: WASD\nZıpla: SPACE\nKoş: SHIFT"></img>
            <img className={"controlsR"} src="./assets/Images/ControlsR.png" alt="Bak: MOUSE"></img>
            <img className={"controlsTR"} src="./assets/Images/ControlsTR.png" alt="Performans: P\nGece Modu: N"></img>
          </div>
          <div className="dot" 
            onClick={() => {
              setReady(true);
              const canvas = document.querySelector('canvas');
              if (canvas && !document.pointerLockElement) {
                canvas.requestPointerLock();
              }
            }}
          />
        </>
      )}
      {ready && (
        <div className="dot" style={{ pointerEvents: 'none' }} />
      )}
      <Loading />
      </>
  )
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Overlay />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
