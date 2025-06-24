import React from 'react';

export function AnimationDebugTest() {
  const inlineStyles = {
    container: {
      position: 'relative',
      width: '400px',
      height: '200px',
      border: '2px solid #ccc',
      margin: '20px',
      backgroundColor: '#f9f9f9',
      overflow: 'hidden'
    },
    chicken: {
      position: 'absolute',
      bottom: '20px',
      width: '40px',
      height: '30px',
      backgroundColor: '#fff',
      border: '2px solid #f97316',
      borderRadius: '50%',
      animation: 'slideAcross 3s linear infinite'
    },
    chef: {
      position: 'absolute',
      bottom: '20px',
      width: '30px',
      height: '40px',
      backgroundColor: '#fff',
      border: '2px solid #000',
      animation: 'chaseAcross 3s linear infinite'
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Animation Debug Test</h2>
      
      <div style={inlineStyles.container}>
        <div style={inlineStyles.chicken}></div>
        <div style={inlineStyles.chef}></div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideAcross {
            0% { left: -50px; }
            50% { left: calc(100% + 20px); }
            100% { left: -50px; }
          }
          
          @keyframes chaseAcross {
            0% { left: -80px; }
            50% { left: calc(100% - 10px); }
            100% { left: -80px; }
          }
        `
      }} />
      
      <div style={{ marginTop: '20px' }}>
        <p>If you see two boxes moving horizontally, CSS animations are working.</p>
        <p>If they're not moving, there's a fundamental CSS animation issue.</p>
      </div>
    </div>
  );
}

export default AnimationDebugTest;
