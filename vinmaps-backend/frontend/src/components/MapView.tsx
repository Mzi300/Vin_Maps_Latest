import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '../context/AppContext';
import { POIClusterLayer } from './POIClusterLayer';

// Fix default icon issue in Leaflet when bundled
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Props {
  /** initial coordinates for map center (longitude, latitude) */
  center: [number, number];
  /** initial zoom level */
  zoom?: number;
}

export const MapView: React.FC<Props> = ({ center, zoom = 13 }) => {
  const { state } = useAppContext();
  const routeGeoJson = state.route?.geojson;
  const coordinates = routeGeoJson?.features?.[0]?.geometry?.coordinates;
  const isValidRoute = Array.isArray(coordinates) && coordinates.length > 0;
  const mapRef = useRef<L.Map | null>(null);

  // WebSocket for health/stream events – throttled UI updates (handled elsewhere)
  // const { latestEvent } = useWebSocket(); // removed, POIClusterLayer handles health events

  // Route loading is now handled via RoutingPanel UI and context state

  // Pan map to selected location from SearchBar
  useEffect(() => {
    if (state.selectedLocation && mapRef.current) {
      const { lat, lon } = state.selectedLocation;
      mapRef.current.setView([lat, lon], mapRef.current.getZoom(), { animate: true });
    }
  }, [state.selectedLocation]);

  // Custom component to expose map instance to ref
  const SetMapInstance = () => {
    const map = useMap();
    mapRef.current = map;
    return null;
  };

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100vh', width: '100%' }}>
      <SetMapInstance />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {state.isSnapshotLoaded && isValidRoute && (
        <Polyline
          positions={coordinates.map((c: any) => [c[1], c[0]])}
          color='#ff6600'
          weight={4}
          eventHandlers={{ add: (e) => e.target.bringToFront() }}
        />
      )}
      {/* POI clustering layer */}
      <POIClusterLayer />
    </MapContainer>
  );
};
