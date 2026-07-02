// src/components/SearchBar.tsx
import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useAppContext } from '../context/AppContext';
import { useWebSocket } from '../hooks/webSocketHook'; // assume existing hook for WS, will be stabilized later

/**
 * SearchBar – instant suggestions with keyboard navigation.
 * Calls `/search?q=&lat=&lon=` and stores results in global context.
 */
export const SearchBar: React.FC = () => {
  const { dispatch } = useAppContext();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const { latestEvent } = useWebSocket(); // placeholder – not used directly here

  const fetchResults = async (q: string) => {
    if (!q) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }
    try {
      // Use navigator.geolocation if available for lat/lon fallback
      const { latitude, longitude } = await new Promise<GeolocationCoordinates>((res, rej) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => res(pos.coords), err => rej(err));
        } else {
          rej(new Error('Geolocation not supported'));
        }
      }).catch(() => ({ latitude: 0, longitude: 0 } as any));
      const resp = await fetch(`/search?q=${encodeURIComponent(q)}&lat=${latitude}&lon=${longitude}`);
      const data = await resp.json();
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: data });
      setShowDropdown(true);
    } catch (e) {
      console.error('Search error', e);
    }
  };

  const debouncedFetch = useDebounce(fetchResults, 350);

  useEffect(() => {
    debouncedFetch(query);
  }, [query]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const results = (dispatch as any)._currentValue?.state?.searchResults || [];
    if (e.key === 'ArrowDown') {
      setActiveIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) {
        selectResult(results[activeIdx]);
      }
    }
  };

  const selectResult = (result: any) => {
    // Center map on the result and highlight it via global state
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: { lat: result.lat, lon: result.lon } });
    setShowDropdown(false);
    setQuery(result.name);
  };

  const results = (dispatch as any)._currentValue?.state?.searchResults || [];

  return (
    <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
      <input
        type="text"
        placeholder="Search POIs, addresses…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-input"
        style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
      />
      {showDropdown && results.length > 0 && (
        <ul className="search-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          {results.map((r: any, idx: number) => (
            <li
              key={r.id}
              onClick={() => selectResult(r)}
              onMouseEnter={() => setActiveIdx(idx)}
              style={{
                padding: '6px 10px',
                background: idx === activeIdx ? 'rgba(0,0,0,0.1)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <strong>{r.name}</strong>
              <span style={{ float: 'right', opacity: 0.7 }}>
                {(r.confidence * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
