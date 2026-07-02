// src/components/POIClusterLayer.tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { fetchPOIs } from '../hooks/apiHooks';
import { useAppContext } from '../context/AppContext';
import { useStabilizedWebSocket } from '../hooks/useStabilizedWebSocket';

/**
 * POIClusterLayer – handles fetching POIs for the current viewport,
 * clustering them via leaflet.markercluster, and updating marker icons
 * based on provider health events received from the WebSocket stream.
 */
export const POIClusterLayer: React.FC = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const { latestEvent } = useStabilizedWebSocket();

  // Create a MarkerClusterGroup once
  const clusterGroupRef = React.useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!clusterGroupRef.current) {
      const cluster = L.markerClusterGroup({
        // optional clustering options for performance
        maxClusterRadius: 60,
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });
      map.addLayer(cluster);
      clusterGroupRef.current = cluster;
    }
    // Cleanup on unmount
    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map]);

  // Fetch POIs for current viewport – debounced via a timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const load = async () => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      try {
        const pois = await fetchPOIs(bbox);
        // Clear previous markers
        clusterGroupRef.current?.clearLayers();
        const markers = pois.map((p: any) => {
          const marker = L.marker([p.lat, p.lng], {
            title: p.name,
            riseOnHover: true,
          });
          // Store provider key for later styling
          (marker as any).providerKey = p.providerKey;
          // Initial icon based on provider health (if known)
          const health = state.liveProviders[p.providerKey] ?? state.providers[p.providerKey];
          const status = health?.healthFactor === 1 ? 'green' : health?.healthFactor === 0 ? 'red' : 'orange';
          marker.setIcon(
            new L.Icon({
              iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${status}.png`,
              shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              tooltipAnchor: [16, -28],
              shadowSize: [41, 41],
            })
          );
          return marker;
        });
        clusterGroupRef.current?.addLayers(markers);
        // Store POIs in global state for any other component that needs them
        dispatch({ type: 'SET_POIS', payload: pois });
      } catch (e) {
        console.error('Failed to load POIs', e);
      }
    };
    // Debounce map move events
    const handler = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(load, 300);
    };
    map.on('moveend', handler);
    // Initial load
    load();
    return () => {
      map.off('moveend', handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [map, state.providers, state.liveProviders, dispatch]);

  // React to health change events and recolor relevant markers
  useEffect(() => {
    if (!latestEvent) return;
    const { event, payload } = latestEvent;
    if (event === 'provider.health.changed') {
      const key = payload.key as string;
      // Find markers belonging to this provider and update icon
      clusterGroupRef.current?.eachLayer((layer: any) => {
        if ((layer as any).providerKey === key) {
          const status = payload.healthFactor === 1 ? 'green' : payload.healthFactor === 0 ? 'red' : 'orange';
          layer.setIcon(
            new L.Icon({
              iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${status}.png`,
              shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              tooltipAnchor: [16, -28],
              shadowSize: [41, 41],
            })
          );
        }
      });
    }
  }, [latestEvent]);

  return null; // This component only manipulates Leaflet layers directly
};
