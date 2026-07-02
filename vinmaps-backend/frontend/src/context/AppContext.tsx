// src/context/AppContext.tsx
import React, { createContext, useReducer, useContext, Dispatch } from 'react';

// Types for shared state
export interface ProviderHealth {
  key: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthFactor: number;
  latencyMs?: number;
  errorRate?: number;
  requestVolume?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
  providerKey: string;
  confidence: number;
}

export interface RouteData {
  geojson: any;
  summary: { distance: number; duration: number };
  steps: string[];
}

// Routing state machine
export enum RoutingStatus {
  IDLE = 'IDLE', // No routing activity
  LOADING = 'LOADING', // Request in progress
  SUCCESS = 'SUCCESS', // Route computed successfully
  ERROR = 'ERROR', // Failure encountered
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lon: number;
  providerKey: string;
}

export interface AppState {
  // Snapshot data loaded once
  providers: Record<string, ProviderHealth>;
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  // Live updates merged here
  liveProviders: Record<string, ProviderHealth>;
  startLocation?: { lat: number; lon: number };
  endLocation?: { lat: number; lon: number };
  routeHistory?: RouteData[];
  route?: RouteData;
  isSnapshotLoaded: boolean;
  routeError?: string;
  // New routing status
  routingStatus: RoutingStatus;
  // UI data
  searchResults?: SearchResult[];
  pois?: POI[];
}

export type Action =
  | { type: 'SET_SNAPSHOT'; payload: { providers: Record<string, ProviderHealth>; systemHealth: AppState['systemHealth'] } }
  | { type: 'UPDATE_PROVIDER'; payload: ProviderHealth }
  | { type: 'SET_SELECTED_LOCATION'; payload: { lat: number; lon: number } }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_ROUTE'; payload: RouteData }
  | { type: 'SET_ROUTE_ERROR'; payload: string }
  | { type: 'CLEAR_ROUTE_ERROR' }
  | { type: 'RESET_SNAPSHOT' }
  | { type: 'SET_POIS'; payload: POI[] }
  // Routing status actions
  | { type: 'SET_ROUTING_STATUS'; payload: RoutingStatus };

const initialState: AppState = {
  providers: {},
  systemHealth: 'HEALTHY',
  liveProviders: {},
  searchResults: [],
  pois: [],
  route: undefined,
  routeError: undefined,
  isSnapshotLoaded: false,
  routingStatus: RoutingStatus.IDLE,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SNAPSHOT':
      return { ...state, providers: action.payload.providers, systemHealth: action.payload.systemHealth, isSnapshotLoaded: true };
    case 'RESET_SNAPSHOT':
      return { ...state, isSnapshotLoaded: false, route: undefined, routeError: undefined, searchResults: [], pois: [], routingStatus: RoutingStatus.IDLE };
    case 'UPDATE_PROVIDER':
      return {
        ...state,
        liveProviders: { ...state.liveProviders, [action.payload.key]: action.payload },
      };
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_ROUTE':
      return { ...state, route: action.payload, routingStatus: RoutingStatus.SUCCESS };
    case 'SET_ROUTE_ERROR':
      return { ...state, routeError: action.payload, routingStatus: RoutingStatus.ERROR };
    case 'CLEAR_ROUTE_ERROR':
      return { ...state, routeError: undefined };
    case 'SET_POIS':
      return { ...state, pois: action.payload };
    case 'SET_ROUTING_STATUS':
      return { ...state, routingStatus: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
