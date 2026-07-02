// src/components/DevDiagnostics.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Simple development diagnostics panel – renders the entire AppContext state as JSON.
 * Visible only in development mode (process.env.NODE_ENV !== 'production').
 */
export const DevDiagnostics: React.FC = () => {
  const { state } = useAppContext();
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        maxHeight: '30vh',
        overflow: 'auto',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        padding: '0.5rem',
        zIndex: 9999,
      }}
    >
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};
