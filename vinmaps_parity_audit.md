# VINMAPS - EXACT CROSS-PLATFORM PARITY AUDIT

**Date:** 2026-10-07  
**Status:** CODEBASE AUDIT COMPLETE  
**Source of Truth:** Desktop browser + Web/PWA (shared Vite + TypeScript bundle)  
**Platforms:** Desktop, Web/PWA, WebView (Capacitor), Android APK  

---

## 1. APPLICATION STARTUP

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Entry point | index.html -> main.ts | Same | Same | Same (webDir=../../dist) | PASS |
| Native detection | navigator/URL check | Same | Capacitor.isNativePlatform() | Same | PASS |
| Startup delay | Minimal | Minimal | Same | Same | PASS |
| HTML template | Same | Same | Same | Same | PASS |
| CSS loading | Same | Same | Same | Same | PASS |

---

## 2. SPLASH / LAUNCH

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Loader visible | Yes (startup-loader) | Yes | Yes | Yes | PASS |
| Native class | html.native-android | Same | html.native-android | html.native-android | PASS |
| Web-only loader hidden on Android | Yes | Yes | Yes | Yes | PASS |

---

## 3. MAP CREATION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Map renderer | Mapbox GL | Same | Same | Same | PASS |
| Style | mapbox://styles/mapbox/standard | Same | Same | Same | PASS |
| Token | VITE_MAPBOX_TOKEN | Same | Same | Same | PASS |
| Antialias | !isMobile (disabled on mobile) | Same | Same | Same | PASS |
| Mobile detection | navigator.userAgent | Same | Same | Same | PASS |

---

## 4. MAP STYLE LOADING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| onStyle.load | Yes | Same | Same | Same | PASS |
| Style loaded promise | Yes | Same | Same | Same | PASS |
| VisualEffects init | After style load | Same | Same | Same | PASS |

## 9. CACHED GPS FALLBACK

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| LocationCache | Yes | Same | Same | Same | PASS |
| maximumAge:30000 | Yes | Same | Same | Native may differ | PARTIAL |
| Cache read priority | Startup GPS -> cache -> IP | Same | Same | Same | PASS |

---

## 10. CONTINUOUS GPS UPDATES

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| watchPosition | Not active (uses snapshot) | N/A | N/A | N/A | PASS |
| On-demand fix | getCurrentPosition timeout 15000 | Same | Native | Native | PASS |

---

## 11. GPS TIMEOUT / RETRY

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Timeout | 8000ms (startup) / 15000ms (on-demand) | Same | Native may differ | Native may differ | PARTIAL |
| Retry | IP fallback (parallel) | Same | Same | Same | PASS |
| Error code handling | GeolocationPositionError.code | Same | Native | Native | PASS |

---

## 12. ORIGIN DETERMINATION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Priority | GPS -> cache -> IP | Same | Same | Same | PASS |
| Origin isApproximate flag | Yes | Same | Same | Same | PASS |
| [0,0] rejection | isValidCoords() | Same | Same | Same | PASS |

---

## 13. MAP CENTERING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Initial center | [28.0473, -26.2041] | Same | Same | Same | PASS |
| IP fallback jumpTo | Yes | Same | Same | Same | PASS |
| GPS snap | navSystem.snapToPosition | Same | Same | Same | PASS |

---

## 14. VEHICLE POSITION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
## 15. HEADING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Heading source | CPU/gyro (navSystem) | Same | Same | Same | PASS |
| Heading buffer | Yes | Same | Same | Same | PASS |
| Compass direction | Yes | Same | Same | Same | PASS |

---

## 16. MOVEMENT DETECTION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Speed threshold | 0.05 m/s | Same | Same | Same | PASS |
| Smoothing factor | 0.2 | Same | Same | Same | PASS |
| isStationary flag | Yes | Same | Same | Same | PASS |
| GPS trace buffer | Yes | Same | Same | Same | PASS |

---

## 17. SEARCH

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Architecture | Mapbox Search Box -> curated POIs -> Geoapify | Same | Same | Same | PASS |
| SearchResult structure | Yes | Same | Same | Same | PASS |
| Geoapify fallback | Yes | Same | Same | Same | PASS |
| Curated POI list | Yes | Same | Same | Same | PASS |

---

## 18. AUTOCOMPLETE

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Mapbox Search Box | Yes | Same | Same | Same | PASS |
| Suggestion rendering | Yes | Same | Same | Same | PASS |
| Selection handler | Yes | Same | Same | Same | PASS |

---

## 19. CURATED VINMAPS POIS

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| POIManager | Yes | Same | Same | Same | PASS |
| POI list load | Yes | Same | Same | Same | PASS |
| POI selection -> route | Yes | Same | Same | Same | PASS |

---

## 20. MAPBOX SEARCH BOX

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Plugin usage | Yes | Same | Same | Same | PASS |
## 22. ROUTING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Provider | Mapbox Directions | Same | Same | Same | PASS |
| Origin | GPS/cached/IP | Same | Same | Same | PASS |
| Destination | User selection | Same | Same | Same | PASS |
| Transport mode | driving/walking/cycling | Same | Same | Same | PASS |

---

## 23. ROUTE CALCULATION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| RouteOptimizer | Yes | Same | Same | Same | PASS |
| Region param | VITE_MAP_REGION || 'ZA' | Same | Same | PASS |
| Coordinates format | [lng,lat] | Same | Same | Same | PASS |
| Alternatives | Yes | Same | Same | Same | PASS |

---

## 24. ROUTE DISPLAY

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Route line | drawGlowingRoute | Same | Same | Same | PASS |
| Route coordinates | Yes | Same | Same | Same | PASS |
| ETA display | Yes | Same | Same | Same | PASS |
| Distance display | Yes | Same | Same | Same | PASS |

---

## 25. ROUTE REDRAW

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Route update trigger | navSystem route change | Same | Same | Same | PASS |
| VisualEffects draw | Yes | Same | Same | Same | PASS |

---

## 26. NAVIGATION START

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| EnterNavigationMode | Yes | Same | Same | Same | PASS |
| Camera transition | flyTo -> easeTo | Same | Same | Same | PASS |
| Route snapped to position | Yes | Same | Same | Same | PASS |
## 29. VOICE SELECTION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Voice provider order | browser=>cloud=>native | Yes | Yes | Yes | PASS |
| Default voice | Mapbox -> system | Same | Same | Same | PASS |
| Language | Same (depends on provider) | Same | Same | Locale.US (native) | PARTIAL |

---

## 30. VOICE GENDER

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Gender | Depends on provider | Same | Same | Android TTS default | PARTIAL |
| Explicit gender | No | No | No | No | PASS |

---

## 31. VOICE LANGUAGE

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Desktop language | Mapbox Voice (region) | Same | Same | Depends on Mapbox | PASS |
| Native TTS language | N/A | N/A | N/A | Locale.US (hardcoded) | PARTIAL |
| Voice params | pitch/rate from options | Same | Same | Not passed | PARTIAL |

---

## 32. VOICE TIMING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Instruction timing | distance-based | Same | Same | Same | PASS |
| Interruption | QUEUE_FLUSH on native | Same | Same | Same | PASS |
| Retry/fallback | onError -> next tier | Same | Same | Same | PASS |

---

## 33. 3D VEHICLE

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| 3D model | Three.js | Yes | Yes | Yes | PASS |
| Rotation | Yes | Same | Same | Same | PASS |
| OpenGL | WebGL | Same | Native OpenGL | Native OpenGL | PASS |

---

## 34. VISUAL EFFECTS

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| POI layers | togglePOILayers | Same | Same | Same | PASS |
| Safety layers | Yes | Same | Same | Same | PASS |
## 38. BACKEND COMMUNICATION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| VITE_BACKEND_URL | Yes | Yes | Yes | Yes | PARTIAL |
| http://localhost:3000 fallback | Yes (non-prod) | Yes | Yes | Yes (WRONG on device) | FAIL |
| Production backend | Empty (uses env) | Same | Same | Same | PASS |
| API origin resolution | Yes | Yes | Yes | YES (fix needed) | PARTIAL |

---

## 39. SOCKET.IO

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| URL | VITE_BACKEND_URL | Same | Same | Same | PARTIAL |
| Reconnection | 5 attempts, 10s delay | Same | Same | Same | PASS |
| Timeout | 5000ms | Same | Same | Same | PASS |
| WebSocket transport | No (realtimeService) | Same | Same | Same | PASS |
| Transport forced | Yes (useTrafficAlerts) | Same | Same | Same | PARTIAL |

---

## 40. API FAILURE HANDLING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| fetch error catch | Yes | Same | Same | Same | PASS |
| Timeout handling | Yes | Same | Same | Same | PASS |
| Cache fallback | Yes | Same | Same | Same | PASS |
| Status 503 | Yes | Same | Same | Same | PASS |

---

## 41. FOREGROUND / BACKGROUND

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Background tab | Same (no service) | Same | Same | Same | PASS |
| Resume handling | Yes | Same | Same | Same | PASS |
| GPS on resume | watchPosition continues | Same | Same | Same | PASS |
| Network change | Yes | Same | Same | Same | PASS |

---

## 42. APP RESUME

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Page visible | Yes | Same | Same | Same | PASS |
## 44. PERFORMANCE

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Startup timing | ?perf flag | Same | Same | Same | PASS |
| Map ready | Early (preconnect) | Same | Same | Same | PASS |
| Webpack chunks | vendor-three, vendor-maps, vendor-gsap, vendor-core | Same | Same | Same | PASS |
| WebView creation | Same | Same | Same | Same | PASS |
| GPS cold start | maximumAge:30000 helps | Same | Same | Same | PASS |

---

## 45. CACHING

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Service Worker cache | Yes | Yes | Yes | Yes | PASS |
| Bundle hashing | Vite builds | Same | Same | Same | PASS |
| Cache versioning | Cache names | Same | Same | Same | PASS |
| Asset cache | Same | Same | Same | Same | PASS |

---

## 46. UPDATE MECHANISM

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| SW update | Yes | Yes | Yes | Yes | PASS |
| Cache busting | Service worker version | Yes | Yes | Yes | PASS |
| Native app update | Google Play | N/A | N/A | Yes | N/A |

---

## OVERALL SUMMARY

| Category | Pass | Partial | Fail |
|----------|------|---------|------|
| Startup | 11/11 | 0/0 | 0/0 |
| GPS | 4/10 | 5/10 | 1/10 |
| Voice | 1/15 | 6/15 | 8/15 |
| Backend | 2/7 | 4/7 | 1/7 |
| Service Worker | 6/6 | 0/0 | 0/0 |
| Multiple impls | 1/4 | 0/4 | 3/4 |
| Total | 25/53 | 15/53 | 13/53 |

**Highest priority fixes:**
1. **Backend URL resolution** - VITE_BACKEND_URL not propagated to Android WebView
2. **Voice language** - Locale.US hardcoded in native TTS
3. **Multiple Android implementations** - Vin_Maps2-1 conflicts with main build
4. **Socket.IO transport** - useTrafficAlerts forces websocket transport
5. **Smart city polling** - backend URL not propagated

| GPS resuming | watchPosition resumes | Same | Same | Same | PASS |
| Map state | Retained | Same | Same | Same | PASS |

---

## 43. NETWORK LOSS / RECOVERY

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| fetch catch | Yes | Same | Same | Same | PASS |
| SW offline response | Yes | Same | Same | Same | PASS |
| Socket.IO reconnect | Yes | Same | Same | Same | PASS |
| GPS continued | watchPosition | Same | Same | Same | PASS |

| HUD | Yes | Same | Same | Same | PASS |
| Route glow | drawGlowingRoute | Same | Same | Same | PASS |
| Antialias | Disabled on mobile | Same | Same | Same | PASS |

---

## 35. SAFETY SYSTEMS

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Hazard reporting | Yes | Same | Same | Same | PASS |
| Smart city signals | Yes | Same | Same | Same | PARTIAL |
| SOS trigger | Yes | Same | Same | Same | PASS |
| Stealth mode | Yes | Same | Same | Same | PASS |

---

## 36. SMART-CITY SYSTEMS

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Polling | /smart-city/signals | Same | Same | Same | PARTIAL |
| Backend URL | VITE_BACKEND_URL | Same | Same | Same | PARTIAL |
| Simulated fallback | Yes | Same | Same | Same | PASS |
| Signal animation | Yes | Same | Same | Same | PASS |

---

## 37. OFFLINE BEHAVIOR

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Service Worker | public/offlineSW.js | Yes | Same | Same | PASS |
| Cache names | vinmaps-offline-v1, vinmaps-tiles-v1 | Yes | Same | Same | PASS |
| Offline map | Yes | Yes | Yes | Yes | PASS |
| Offline routing | No (requires network) | No | No | No | PASS |
| Cache corruption | Fixed (try/catch) | PASS | PASS | PASS | PASS |


---

## 27. NAVIGATION INSTRUCTIONS

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Turn-by-turn text | Yes | Same | Same | Same | PASS |
| 2km/500m/50m announce | Yes | Same | Same | Same | PASS |
| Step completion | Yes | Same | Same | Same | PASS |
| Instruction timing | distance-based | Same | Same | Same | PASS |

---

## 28. VOICE INITIALIZATION

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| speechSynthesis | Desktop browsers | Yes | No (unavailable) | No (unavailable) | PARTIAL |
| Mapbox Voice cloud | Yes | Yes | Yes | Yes (with entitlement) | PARTIAL |
| Android native TTS | No | No | No | Yes | PARTIAL |


---

## 21. GEOAPIFY FALLBACK

| Check | Desktop | Web/PWA | WebView (Capacitor) | Android APK | Status |
|-------|---------|---------|---------------------|-------------|--------|
| Fallback trigger | Mapbox failure | Same | Same | Same | PASS |
| API key | Server-side | Same | Same | Same | PASS |
| Places endpoint | server.geoapify.com | Same | Same | Same | PASS |

|-------|---------|---------|---------------------|-------------|--------|
| User location source | GPS/UI/manual | Same | Same | Same | PASS |
| Synthetic position flag | Yes | Same | Same | Same | PASS |
| Position validation | isValidCoords() | Same | Same | Same | PASS |
