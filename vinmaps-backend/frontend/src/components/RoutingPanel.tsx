import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

// Helper to call routing API – replace endpoint as needed
import { requestRoute } from '../../services/routingService';
import { logger } from '../../utils/logger';

const isValidNumber = (v: any) => !isNaN(v) && isFinite(v);

export const RoutingPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [startLat, setStartLat] = useState('');
  const [startLon, setStartLon] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLon, setEndLon] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // UI when snapshot not yet loaded
  if (!state.isSnapshotLoaded) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', maxWidth: '320px' }}>
        <p>Waiting for map data…</p>
      </div>
    );
  }

  const handlePlan = async () => {
    // Hard block – safeguard
    if (!state.isSnapshotLoaded) return;

    // Input validation
    const sLat = parseFloat(startLat);
    const sLon = parseFloat(startLon);
    const eLat = parseFloat(endLat);
    const eLon = parseFloat(endLon);
    if (!isValidNumber(sLat) || !isValidNumber(sLon) || !isValidNumber(eLat) || !isValidNumber(eLon)) {
      setLocalError('All coordinates must be valid numbers');
      return;
    }
    if (sLat === eLat && sLon === eLon) {
      setLocalError('Start and end coordinates must differ');
      return;
    }
    setLocalError(null);
    // Set loading status
    dispatch({ type: 'SET_ROUTING_STATUS', payload: RoutingStatus.LOADING });
    logger.info('Routing request started', { start: { lat: sLat, lon: sLon }, end: { lat: eLat, lon: eLon } });
    try {
      const routeData = await requestRoute({ start: { lat: sLat, lon: sLon }, end: { lat: eLat, lon: eLon } });
      dispatch({ type: 'SET_ROUTE', payload: routeData });
      dispatch({ type: 'SET_ROUTING_STATUS', payload: RoutingStatus.SUCCESS });
      dispatch({ type: 'CLEAR_ROUTE_ERROR' });
      logger.info('Routing request succeeded', routeData);
    } catch (e: any) {
      const msg = e?.message ?? 'Unknown routing error';
      dispatch({ type: 'SET_ROUTE_ERROR', payload: msg });
      dispatch({ type: 'SET_ROUTING_STATUS', payload: RoutingStatus.ERROR });
      setLocalError(msg);
      logger.error('Routing request failed', e);
    }
  };

  return (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', maxWidth: '320px' }}>
      <h3>Plan Route</h3>
      <p>Routing ready</p>
      {state.routeError && <p style={{ color: 'red' }}>{state.routeError}</p>}
      {localError && <p style={{ color: 'red' }}>{localError}</p>}
      <div>
        <label>Start Lat:
          <input type="number" value={startLat} onChange={e => setStartLat(e.target.value)} />
        </label>
        <label>Start Lon:
          <input type="number" value={startLon} onChange={e => setStartLon(e.target.value)} />
        </label>
      </div>
      <div>
        <label>End Lat:
          <input type="number" value={endLat} onChange={e => setEndLat(e.target.value)} />
        </label>
        <label>End Lon:
          <input type="number" value={endLon} onChange={e => setEndLon(e.target.value)} />
        </label>
      </div>
      <button onClick={handlePlan}>Plan Route</button>
      {state.route && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Distance:</strong> {state.route.summary.distance}m<br />
          <strong>Duration:</strong> {state.route.summary.duration}s
        </div>
      )}
    </div>
  );
};
