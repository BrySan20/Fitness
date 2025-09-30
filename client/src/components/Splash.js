import React, { useEffect, useState } from 'react';
import './Splash.css';

const Splash = () => {
  const [animationPhase, setAnimationPhase] = useState('initial');

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('pulse'), 500);
    const timer2 = setTimeout(() => setAnimationPhase('glow'), 1500);
    const timer3 = setTimeout(() => setAnimationPhase('final'), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className={`splash-screen ${animationPhase}`}>
      <div className="splash-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="splash-content">
        <div className="logo-container">
          <div className="logo-icon">
            <span className="icon-text">💪</span>
          </div>
          <div className="ripple-effect"></div>
        </div>

        <div className="brand-text">
          <h1 className="app-title">Fitness Tracker</h1>
          <p className="app-subtitle">Tu compañero de entrenamiento</p>
        </div>

        <div className="loading-container">
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          <p className="loading-text">Preparando tu experiencia...</p>
        </div>
      </div>

      <div className="floating-elements">
        <div className="float-element element-1">🏃‍♂️</div>
        <div className="float-element element-2">🏋️‍♀️</div>
        <div className="float-element element-3">⚡</div>
        <div className="float-element element-4">🎯</div>
      </div>
    </div>
  );
};

export default Splash;