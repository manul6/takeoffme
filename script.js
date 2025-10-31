import { countries } from './data/countries.js';
import { airports } from './data/airports.js';
import { railwayStations, railwayRoutes } from './data/railways.js';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const BASE_GRID_SIZE = 4;
const BASE_STROKE_WIDTH = 2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.1;
const MIN_GRID_POWER = -3;  // 2^-3 = 0.125, but we'll use 0.5 as minimum
const MAX_GRID_POWER = 5;   // 2^5 = 32

let manualGridPower = 2;  // 2^2 = 4 (default grid size)
let currentGridSize = BASE_GRID_SIZE;
let currentStrokeWidth = BASE_STROKE_WIDTH;
let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let svgElement = null;
let mapContainer = null;
let activeFlights = [];
let activeRailways = [];
let currentTransportMode = 'flights';

const storage = {
    saveFlights: () => {
        try {
            localStorage.setItem('circuitFlights', JSON.stringify(activeFlights));
        } catch (error) {}
    },
    
    loadFlights: () => {
        try {
            const stored = localStorage.getItem('circuitFlights');
            if (stored) activeFlights = JSON.parse(stored);
        } catch (error) {
            activeFlights = [];
        }
    },
    
    saveRailways: () => {
        try {
            localStorage.setItem('circuitRailways', JSON.stringify(activeRailways));
        } catch (error) {}
    },
    
    loadRailways: () => {
        try {
            const stored = localStorage.getItem('circuitRailways');
            if (stored) activeRailways = JSON.parse(stored);
        } catch (error) {
            activeRailways = [];
        }
    }
};

const mathUtils = {
    toRadians: degrees => degrees * Math.PI / 180,
    toDegrees: radians => radians * 180 / Math.PI,
    normalizeLongitude: lon => {
        while (lon > 180) lon -= 360;
        while (lon < -180) lon += 360;
        return lon;
    }
};

// Helper functions to call storage methods
const saveFlightsToStorage = () => storage.saveFlights();
const loadFlightsFromStorage = () => storage.loadFlights();
const saveRailwaysToStorage = () => storage.saveRailways();
const loadRailwaysFromStorage = () => storage.loadRailways();
const validateCoordinate = (lat, lon, context) => projection.validate(lat, lon, context);
const projectAndSnap = (lat, lon) => projection.projectAndSnap(lat, lon);
const calculateGreatCirclePoints = (lat1, lon1, lat2, lon2, numPoints) => 
    geodesy.calculateGreatCirclePoints(lat1, lon1, lat2, lon2, numPoints);
const updateGridOverlay = () => viewManager.updateGridOverlay();

const geodesy = {
    calculateGreatCirclePoints: (lat1, lon1, lat2, lon2, numPoints = 20) => {
        lon1 = ((lon1 + 180) % 360) - 180;
        lon2 = ((lon2 + 180) % 360) - 180;
        
        const lonDiff = lon2 - lon1;
        if (Math.abs(lonDiff) > 180) {
            lon2 += lonDiff > 0 ? -360 : 360;
        }
        
        const φ1 = mathUtils.toRadians(lat1);
        const λ1 = mathUtils.toRadians(lon1);
        const φ2 = mathUtils.toRadians(lat2);
        const λ2 = mathUtils.toRadians(lon2);
        
        const Δφ = φ2 - φ1;
        const Δλ = λ2 - λ1;
        const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return Array.from({length: numPoints + 1}, (_, i) => {
            const f = i / numPoints;
            
            if (f === 0) return [mathUtils.normalizeLongitude(lon1), lat1];
            if (f === 1) return [mathUtils.normalizeLongitude(lon2), lat2];
            
            const A = Math.sin((1-f)*c) / Math.sin(c);
            const B = Math.sin(f*c) / Math.sin(c);
            
            const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
            const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
            const z = A * Math.sin(φ1) + B * Math.sin(φ2);
            
            const φ = Math.atan2(z, Math.sqrt(x*x + y*y));
            const λ = Math.atan2(y, x);
            
            return [mathUtils.normalizeLongitude(mathUtils.toDegrees(λ)), mathUtils.toDegrees(φ)];
        });
    }
};

const projection = {
    EPSILON: 1e-10,
    
    validate: (lat, lon, context = '') => {
        if (lat < -90 - projection.EPSILON || lat > 90 + projection.EPSILON || 
            lon < -180 - projection.EPSILON || lon > 180 + projection.EPSILON) {
            throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
        }
    },
    
    project: (lat, lon) => {
        projection.validate(lat, lon, 'in projection');
        
        const clampedLat = Math.max(-90, Math.min(90, lat));
        const clampedLon = Math.max(-180, Math.min(180, lon));
        
        return {
            x: (clampedLon + 180) * (MAP_WIDTH / 360),
            y: (90 - clampedLat) * (MAP_HEIGHT / 180)
        };
    },
    
    snap: (value, gridSize = currentGridSize) => 
        Math.round(value / gridSize) * gridSize,
    
    projectAndSnap: (lat, lon) => {
        const projected = projection.project(lat, lon);
        return {
            x: projection.snap(projected.x),
            y: projection.snap(projected.y)
        };
    }
};

const viewManager = {
    updateViewBox: () => {
        if (!svgElement) return;
        
        const scaledWidth = MAP_WIDTH / currentZoom;
        const scaledHeight = MAP_HEIGHT / currentZoom;
        const maxPanX = Math.max(0, (MAP_WIDTH - scaledWidth) / 2);
        const maxPanY = Math.max(0, (MAP_HEIGHT - scaledHeight) / 2);
        
        currentPanX = Math.max(-maxPanX, Math.min(maxPanX, currentPanX));
        currentPanY = Math.max(-maxPanY, Math.min(maxPanY, currentPanY));
        
        const viewBoxX = (MAP_WIDTH - scaledWidth) / 2 - currentPanX;
        const viewBoxY = (MAP_HEIGHT - scaledHeight) / 2 - currentPanY;
        
        svgElement.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${scaledWidth} ${scaledHeight}`);
        
        const zoomInfo = document.getElementById('zoom-info');
        if (zoomInfo) {
            const zoomPercent = Math.round(currentZoom * 100);
            const gridSizePx = Math.max(1, Math.round(currentGridSize));
            const strokeWidthPx = Math.round(currentStrokeWidth * 10) / 10;
            zoomInfo.textContent = `zoom: ${zoomPercent}% | grid: ${gridSizePx}px | stroke: ${strokeWidthPx}px | pan: drag to move`;
        }
    },
    
    updateGridOverlay: () => {
        const gridOverlay = document.querySelector('.grid-overlay');
        if (gridOverlay) {
            const gridSizePx = Math.max(1, Math.round(currentGridSize));
            gridOverlay.style.backgroundSize = `${gridSizePx}px ${gridSizePx}px`;
        }
    },
    
    reset: () => {
        currentZoom = 1;
        currentPanX = 0;
        currentPanY = 0;
        manualGridPower = 2;  // Reset to 2^2 = 4px
        currentGridSize = Math.pow(2, manualGridPower);
        currentStrokeWidth = BASE_STROKE_WIDTH;
        
        // Update slider UI
        const slider = document.getElementById('grid-size-slider');
        if (slider) {
            slider.value = manualGridPower;
            updateGridSizeDisplay();
        }
        
        viewManager.updateViewBox();
        viewManager.updateGridOverlay();
        renderCountries();
        renderFlights();
        renderRailways();
    }
};

const zoomManager = {
    zoomToPoint: (zoomDelta, clientX, clientY) => {
        if (!svgElement || !mapContainer) return;
        
        const rect = mapContainer.getBoundingClientRect();
        const svgX = (clientX - rect.left) / rect.width * MAP_WIDTH;
        const svgY = (clientY - rect.top) / rect.height * MAP_HEIGHT;
        
        const oldZoom = currentZoom;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomDelta));
        
        if (newZoom !== oldZoom) {
            currentZoom = newZoom;
            
            // Grid size is now controlled by the manual slider, not zoom
            // Only update stroke width based on zoom
            const zoomFactor = Math.pow(2, Math.log2(currentZoom) * 0.7);
            currentStrokeWidth = Math.max(0.5, BASE_STROKE_WIDTH / zoomFactor);
            
            const zoomRatio = currentZoom / oldZoom;
            const centerX = MAP_WIDTH / 2;
            const centerY = MAP_HEIGHT / 2;
            
            const offsetX = svgX - centerX;
            const offsetY = svgY - centerY;
            
            currentPanX += offsetX * (1 - 1/zoomRatio) / currentZoom;
            currentPanY += offsetY * (1 - 1/zoomRatio) / currentZoom;
            
            viewManager.updateViewBox();
            
            // Always re-render on zoom since we removed the grid change check
            renderCountries();
            renderFlights();
            renderRailways();
        }
    },
    reset: viewManager.reset
};

function initializePanZoom() {
    svgElement = document.getElementById('map');
    mapContainer = document.getElementById('map-container');
    if (!svgElement || !mapContainer) return;
    
    let lastTouchDistance = 0;
    let touchCenterX = 0;
    let touchCenterY = 0;
    
    // Mouse wheel zoom
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        zoomManager.zoomToPoint(zoomDelta, e.clientX, e.clientY);
    }, { passive: false });
    
    // Mouse panning
    mapContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isPanning = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            mapContainer.classList.add('panning');
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            const rect = mapContainer.getBoundingClientRect();
            const panFactorX = (MAP_WIDTH / currentZoom) / rect.width;
            const panFactorY = (MAP_HEIGHT / currentZoom) / rect.height;
            
            currentPanX += deltaX * panFactorX;
            currentPanY += deltaY * panFactorY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            viewManager.updateViewBox();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            mapContainer.classList.remove('panning');
        }
    });
    
    // Zoom buttons
    document.getElementById('zoom-in').addEventListener('click', () => {
        const rect = mapContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        zoomManager.zoomToPoint(ZOOM_STEP, centerX, centerY);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        const rect = mapContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        zoomManager.zoomToPoint(-ZOOM_STEP, centerX, centerY);
    });
    
    document.getElementById('zoom-reset').addEventListener('click', zoomManager.reset);
    
    // Touch events for mobile
    mapContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isPanning = true;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
            mapContainer.classList.add('panning');
        } else if (e.touches.length === 2) {
            isPanning = false;
            mapContainer.classList.remove('panning');
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            lastTouchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            touchCenterX = (touch1.clientX + touch2.clientX) / 2;
            touchCenterY = (touch1.clientY + touch2.clientY) / 2;
        }
        e.preventDefault();
    }, { passive: false });
    
    mapContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isPanning) {
            const deltaX = e.touches[0].clientX - lastMouseX;
            const deltaY = e.touches[0].clientY - lastMouseY;
            
            const rect = mapContainer.getBoundingClientRect();
            const panFactorX = (MAP_WIDTH / currentZoom) / rect.width;
            const panFactorY = (MAP_HEIGHT / currentZoom) / rect.height;
            
            currentPanX += deltaX * panFactorX;
            currentPanY += deltaY * panFactorY;
            
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
            
            viewManager.updateViewBox();
        } else if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const currentDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            if (lastTouchDistance > 0) {
                const zoomDelta = (currentDistance - lastTouchDistance) * 0.01;
                zoomManager.zoomToPoint(zoomDelta, touchCenterX, touchCenterY);
            }
            
            lastTouchDistance = currentDistance;
            touchCenterX = (touch1.clientX + touch2.clientX) / 2;
            touchCenterY = (touch1.clientY + touch2.clientY) / 2;
        }
        e.preventDefault();
    }, { passive: false });
    
    mapContainer.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            isPanning = false;
            lastTouchDistance = 0;
            mapContainer.classList.remove('panning');
        } else if (e.touches.length === 1) {
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }
        e.preventDefault();
    }, { passive: false });
    
    viewManager.updateViewBox();
}

function createPath(coordinates, closed = true) {
    if (!coordinates || coordinates.length < 2) return '';
    
    let pathData = '';
    const snapThreshold = currentGridSize * 0.7; // Slightly more forgiving threshold for snapping
    
    for (let i = 0; i < coordinates.length; i++) {
        const [lon, lat] = coordinates[i];
        const { x, y } = projectAndSnap(lat, lon);
        
        if (i === 0) {
            pathData += `M ${x} ${y}`;
        } else {
            const prevCoord = coordinates[i - 1];
            const [prevLon, prevLat] = prevCoord;
            const prev = projectAndSnap(prevLat, prevLon);
            
            const dx = x - prev.x;
            const dy = y - prev.y;
            
            // More forgiving snapping for small movements
            if (Math.abs(dx) < snapThreshold && Math.abs(dy) < snapThreshold) {
                pathData += ` L ${x} ${y}`;
            } else if (dx === 0 || dy === 0) {
                pathData += ` L ${x} ${y}`;
            } else if (Math.abs(Math.abs(dx) - Math.abs(dy)) < snapThreshold) {
                // If the line is approximately 45 degrees, keep it straight
                pathData += ` L ${x} ${y}`;
            } else {
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                const minDist = Math.min(absDx, absDy);
                
                // Only create right angles if the distance is significant
                if (minDist >= currentGridSize * 1.5) {
                    const diagLen = Math.round(minDist * 0.7 / currentGridSize) * currentGridSize;
                    const diagX = prev.x + (dx > 0 ? diagLen : -diagLen);
                    const diagY = prev.y + (dy > 0 ? diagLen : -diagLen);
                    
                    pathData += ` L ${diagX} ${diagY}`;
                    
                    if (absDx > absDy) {
                        pathData += ` L ${x} ${diagY} L ${x} ${y}`;
                    } else {
                        pathData += ` L ${diagX} ${y} L ${x} ${y}`;
                    }
                } else {
                    // For small distances, just draw a straight line
                    pathData += ` L ${x} ${y}`;
                }
            }
        }
    }
    
    if (closed && coordinates.length > 2) {
        pathData += ' Z';
    }
    
    return pathData;
}





function renderCountries() {
    const svg = document.getElementById('map');
    const countriesGroup = document.getElementById('countries-group') || 
                          document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    countriesGroup.id = 'countries-group';
    countriesGroup.innerHTML = '';
    
    let totalPaths = 0;
    
    for (const offset of [0]) {
        for (const [countryName, countryData] of Object.entries(countries)) {
            if (!countryData.polygons || countryData.polygons.length === 0) continue;
            
            for (let i = 0; i < countryData.polygons.length; i++) {
                const polygon = countryData.polygons[i];
                
                const wrappedPolygon = polygon.map(([lon, lat]) => [lon, lat]);
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', createPathWithOffset(wrappedPolygon, offset));
                path.setAttribute('class', 'country');
                path.setAttribute('stroke-width', currentStrokeWidth);
                path.setAttribute('data-country', countryName);
                path.setAttribute('data-polygon', i);
                path.setAttribute('data-offset', offset);
                
                countriesGroup.appendChild(path);
                totalPaths++;
            }
        }
    }
    
    svg.appendChild(countriesGroup);
}

function createPathWithOffset(coordinates, xOffset) {
    if (!coordinates || coordinates.length < 2) return '';
    
    let pathData = '';
    
    for (let i = 0; i < coordinates.length; i++) {
        const [lon, lat] = coordinates[i];
        const { x, y } = projectAndSnap(lat, lon);
        const offsetX = x + xOffset;
        
        if (i === 0) {
            pathData += `M ${offsetX} ${y}`;
        } else {
            const prevCoord = coordinates[i - 1];
            const [prevLon, prevLat] = prevCoord;
            const prev = projectAndSnap(prevLat, prevLon);
            const prevOffsetX = prev.x + xOffset;
            
            const dx = offsetX - prevOffsetX;
            const dy = y - prev.y;
            
            if (dx === 0 || dy === 0) {
                pathData += ` L ${offsetX} ${y}`;
            } else if (Math.abs(dx) === Math.abs(dy)) {
                pathData += ` L ${offsetX} ${y}`;
            } else if (Math.abs(dx - dy) <= currentGridSize) {
                pathData += ` L ${offsetX} ${y}`;
            } else {
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                const minDist = Math.min(absDx, absDy);
                
                if (minDist >= currentGridSize * 2) {
                    const diagLen = Math.floor(minDist * 0.6 / currentGridSize) * currentGridSize;
                    const diagX = prevOffsetX + (dx > 0 ? diagLen : -diagLen);
                    const diagY = prev.y + (dy > 0 ? diagLen : -diagLen);
                    
                    pathData += ` L ${diagX} ${diagY}`;
                    
                    if (absDx > absDy) {
                        pathData += ` L ${offsetX} ${diagY} L ${offsetX} ${y}`;
                    } else {
                        pathData += ` L ${diagX} ${y} L ${offsetX} ${y}`;
                    }
                } else {
                    if (absDx > absDy) {
                        pathData += ` L ${offsetX} ${prev.y} L ${offsetX} ${y}`;
                    } else {
                        pathData += ` L ${prevOffsetX} ${y} L ${offsetX} ${y}`;
                    }
                }
            }
        }
    }
    
    if (coordinates.length > 2) {
        pathData += ' Z';
    }
    
    return pathData;
}

function renderFlights() {
    const svg = document.getElementById('map');
    let flightsGroup = document.getElementById('flights-group');
    
    if (!flightsGroup) {
        flightsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        flightsGroup.id = 'flights-group';
        svg.appendChild(flightsGroup);
    }
    
    flightsGroup.innerHTML = '';
    
    for (const offset of [0]) {
        activeFlights.forEach((flight, index) => {
            const fromAirport = airports[flight.from];
            const toAirport = airports[flight.to];
            
            if (!fromAirport || !toAirport) {
                console.error(`invalid flight: ${flight.from} -> ${flight.to}`);
                return;
            }
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createFlightPathWithOffset(fromAirport, toAirport, offset));
            path.setAttribute('class', 'flight-line');
            path.setAttribute('stroke-width', currentStrokeWidth);
            path.setAttribute('data-flight-index', index);
            path.setAttribute('data-offset', offset);
            
            flightsGroup.appendChild(path);
            
            const from = projectAndSnap(fromAirport.lat, fromAirport.lon);
            const to = projectAndSnap(toAirport.lat, toAirport.lon);
            
            [from, to].forEach(point => {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', point.x + offset);
                dot.setAttribute('cy', point.y);
                dot.setAttribute('r', Math.max(1, 3 / currentZoom));
                dot.setAttribute('class', 'airport-dot');
                dot.setAttribute('data-offset', offset);
                
                flightsGroup.appendChild(dot);
            });
        });
    }
}

function renderRailways() {
    const svg = document.getElementById('map');
    let railwaysGroup = document.getElementById('railways-group');
    
    if (!railwaysGroup) {
        railwaysGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        railwaysGroup.id = 'railways-group';
        svg.appendChild(railwaysGroup);
    }
    
    railwaysGroup.innerHTML = '';
    
    for (const offset of [0]) {
        activeRailways.forEach((railway, index) => {
            const fromStation = railwayStations[railway.from];
            const toStation = railwayStations[railway.to];
            
            if (!fromStation || !toStation) {
                console.error(`invalid railway: ${railway.from} -> ${railway.to}`);
                return;
            }
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createRailwayPathWithOffset(fromStation, toStation, offset));
            
            const railwayType = fromStation.type === 'high_speed' && toStation.type === 'high_speed' ? 'high-speed' : 'intercity';
            path.setAttribute('class', `railway-line ${railwayType}`);
            path.setAttribute('stroke-width', currentStrokeWidth);
            path.setAttribute('data-railway-index', index);
            path.setAttribute('data-offset', offset);
            
            railwaysGroup.appendChild(path);
            
            const from = projectAndSnap(fromStation.lat, fromStation.lon);
            const to = projectAndSnap(toStation.lat, toStation.lon);
            
            [from, to].forEach((point, pointIndex) => {
                const station = pointIndex === 0 ? fromStation : toStation;
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                dot.setAttribute('x', point.x + offset - 2);
                dot.setAttribute('y', point.y - 2);
                dot.setAttribute('width', 4);
                dot.setAttribute('height', 4);
                dot.setAttribute('class', `railway-station ${station.type === 'high_speed' ? 'high-speed' : ''}`);
                dot.setAttribute('data-offset', offset);
                
                railwaysGroup.appendChild(dot);
            });
        });
    }
}

function createRailwayPathWithOffset(fromStation, toStation, xOffset) {
    // Get station codes from the railway lookup
    const fromCode = Object.keys(railwayStations).find(code => railwayStations[code] === fromStation);
    const toCode = Object.keys(railwayStations).find(code => railwayStations[code] === toStation);
    
    // Check if there's a predefined route with waypoints
    const route = railwayRoutes.find(r => 
        (r.from === fromCode && r.to === toCode) ||
        (r.from === toCode && r.to === fromCode)
    );
    
    if (route && route.waypoints) {
        // Use predefined waypoints for accurate routing
        let pathData = '';
        const waypoints = route.waypoints;
        
        for (let i = 0; i < waypoints.length; i++) {
            const waypoint = waypoints[i];
            const point = projectAndSnap(waypoint.lat, waypoint.lon);
            const x = point.x + xOffset;
            const y = point.y;
            
            if (i === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                const prevWaypoint = waypoints[i - 1];
                const prevPoint = projectAndSnap(prevWaypoint.lat, prevWaypoint.lon);
                const prevX = prevPoint.x + xOffset;
                const prevY = prevPoint.y;
                
                // Create circuit-board style routing between waypoints
                const dx = x - prevX;
                const dy = y - prevY;
                
                if (Math.abs(dx) < currentGridSize && Math.abs(dy) < currentGridSize) {
                    // Very close points, direct line
                    pathData += ` L ${x} ${y}`;
                } else if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal then vertical
                    const midX = prevX + dx * 0.8;
                    pathData += ` L ${midX} ${prevY} L ${midX} ${y} L ${x} ${y}`;
                } else {
                    // Vertical then horizontal
                    const midY = prevY + dy * 0.8;
                    pathData += ` L ${prevX} ${midY} L ${x} ${midY} L ${x} ${y}`;
                }
            }
        }
        
        return pathData;
    } else {
        // Fallback to simple direct routing if no predefined route
        const fromPoint = projectAndSnap(fromStation.lat, fromStation.lon);
        const toPoint = projectAndSnap(toStation.lat, toStation.lon);
        
        const startX = fromPoint.x + xOffset;
        const startY = fromPoint.y;
        const endX = toPoint.x + xOffset;
        const endY = toPoint.y;
        
        const dx = endX - startX;
        const dy = endY - startY;
        
        let pathData = `M ${startX} ${startY}`;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            const midX = startX + dx * 0.7;
            pathData += ` L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
        } else {
            const midY = startY + dy * 0.7;
            pathData += ` L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
        }
        
        return pathData;
    }
}

function createFlightPathWithOffset(fromAirport, toAirport, xOffset) {
    const arcPoints = calculateGreatCirclePoints(
        fromAirport.lat, fromAirport.lon,
        toAirport.lat, toAirport.lon,
        15
    );
    
    const pathSegments = [];
    let currentSegment = [];
    
    for (let i = 0; i < arcPoints.length; i++) {
        const [lon, lat] = arcPoints[i];
        const screenPoint = projectAndSnap(lat, lon);
        const point = { x: screenPoint.x + xOffset, y: screenPoint.y };
        
        if (i === 0) {
            currentSegment.push(point);
        } else {
            const [prevLon, prevLat] = arcPoints[i - 1];
            const [currLon, currLat] = arcPoints[i];
            
            const lonDiff = currLon - prevLon;
            
            if (Math.abs(lonDiff) > 180) {
                if (currentSegment.length > 1) {
                    pathSegments.push([...currentSegment]);
                }
                currentSegment = [point];
            } else {
                const prevPoint = currentSegment[currentSegment.length - 1];
                const targetX = point.x;
                const targetY = point.y;
                const dx = targetX - prevPoint.x;
                const dy = targetY - prevPoint.y;
                
                if (dx === 0 || dy === 0) {
                    currentSegment.push({ x: targetX, y: targetY });
                } else if (Math.abs(dx) === Math.abs(dy)) {
                    currentSegment.push({ x: targetX, y: targetY });
                } else {
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    const minDist = Math.min(absDx, absDy);
                    
                    if (minDist >= currentGridSize) {
                        const diagLen = Math.min(minDist, currentGridSize * 3);
                        const diagX = prevPoint.x + (dx > 0 ? diagLen : -diagLen);
                        const diagY = prevPoint.y + (dy > 0 ? diagLen : -diagLen);
                        
                        currentSegment.push({ x: diagX, y: diagY });
                        
                        if (diagX !== targetX && diagY !== targetY) {
                            if (absDx > absDy) {
                                currentSegment.push({ x: targetX, y: diagY });
                                if (targetY !== diagY) {
                                    currentSegment.push({ x: targetX, y: targetY });
                                }
                            } else {
                                currentSegment.push({ x: diagX, y: targetY });
                                if (targetX !== diagX) {
                                    currentSegment.push({ x: targetX, y: targetY });
                                }
                            }
                        } else {
                            currentSegment.push({ x: targetX, y: targetY });
                        }
                    } else {
                        if (absDx > absDy) {
                            currentSegment.push({ x: targetX, y: prevPoint.y });
                            if (targetY !== prevPoint.y) {
                                currentSegment.push({ x: targetX, y: targetY });
                            }
                        } else {
                            currentSegment.push({ x: prevPoint.x, y: targetY });
                            if (targetX !== prevPoint.x) {
                                currentSegment.push({ x: targetX, y: targetY });
                            }
                        }
                    }
                }
            }
        }
    }
    
    if (currentSegment.length > 0) {
        pathSegments.push(currentSegment);
    }
    
    let pathData = '';
    for (const segment of pathSegments) {
        if (segment.length > 1) {
            pathData += `M ${segment[0].x} ${segment[0].y}`;
            for (let i = 1; i < segment.length; i++) {
                pathData += ` L ${segment[i].x} ${segment[i].y}`;
            }
        }
    }
    
    return pathData;
}

function addFlight(fromCode, toCode) {
    if (!airports[fromCode]) {
        alert(`unknown airport code: ${fromCode}`);
        return false;
    }
    
    if (!airports[toCode]) {
        alert(`unknown airport code: ${toCode}`);
        return false;
    }
    
    const duplicate = activeFlights.some(flight => 
        (flight.from === fromCode && flight.to === toCode) ||
        (flight.from === toCode && flight.to === fromCode)
    );
    
    if (duplicate) {
        alert(`flight ${fromCode} ↔ ${toCode} already exists`);
        return false;
    }
    
    activeFlights.push({ from: fromCode, to: toCode });
    saveFlightsToStorage();
    renderFlights();
    updateFlightList();
    
    return true;
}

function addRailway(fromCode, toCode) {
    if (!railwayStations[fromCode]) {
        alert(`unknown railway station code: ${fromCode}`);
        return false;
    }
    
    if (!railwayStations[toCode]) {
        alert(`unknown railway station code: ${toCode}`);
        return false;
    }
    
    const duplicate = activeRailways.some(railway => 
        (railway.from === fromCode && railway.to === toCode) ||
        (railway.from === toCode && railway.to === fromCode)
    );
    
    if (duplicate) {
        alert(`railway ${fromCode} ↔ ${toCode} already exists`);
        return false;
    }
    
    activeRailways.push({ from: fromCode, to: toCode });
    saveRailwaysToStorage();
    renderRailways();
    updateRailwayList();
    
    return true;
}

function removeFlight(index) {
    if (index >= 0 && index < activeFlights.length) {
        const flight = activeFlights.splice(index, 1)[0];
        saveFlightsToStorage();
        renderFlights();
        updateFlightList();
    }
}

function removeRailway(index) {
    if (index >= 0 && index < activeRailways.length) {
        const railway = activeRailways.splice(index, 1)[0];
        saveRailwaysToStorage();
        renderRailways();
        updateRailwayList();
    }
}

function updateFlightList() {
    const flightList = document.getElementById('flight-list');
    flightList.innerHTML = '';
    
    activeFlights.forEach((flight, index) => {
        const fromAirport = airports[flight.from];
        const toAirport = airports[flight.to];
        
        const listItem = document.createElement('div');
        listItem.className = 'flight-item';
        listItem.innerHTML = `
            <span class="flight-route">
                ${flight.from} (${fromAirport.name}) → ${flight.to} (${toAirport.name})
            </span>
            <button class="remove-btn" onclick="removeFlight(${index})">×</button>
        `;
        
        flightList.appendChild(listItem);
    });
}

function updateRailwayList() {
    const railwayList = document.getElementById('railway-list');
    railwayList.innerHTML = '';
    
    activeRailways.forEach((railway, index) => {
        const fromStation = railwayStations[railway.from];
        const toStation = railwayStations[railway.to];
        
        const listItem = document.createElement('div');
        listItem.className = 'transport-item railway-item';
        listItem.innerHTML = `
            <span class="transport-route">
                ${railway.from} (${fromStation.name}) → ${railway.to} (${toStation.name})
            </span>
            <button class="remove-btn" onclick="removeRailway(${index})">×</button>
        `;
        
        railwayList.appendChild(listItem);
    });
}

function updateGridSizeDisplay() {
    const gridSizeValue = document.getElementById('grid-size-value');
    if (gridSizeValue) {
        const displayValue = currentGridSize < 1 
            ? currentGridSize.toFixed(2) 
            : Math.round(currentGridSize);
        gridSizeValue.textContent = `${displayValue}px`;
    }
}

function setGridSize(power) {
    manualGridPower = power;
    // Use exponential scale: 2^power
    // Special case for minimum value to get 0.5
    if (power === MIN_GRID_POWER) {
        currentGridSize = 0.5;
    } else {
        currentGridSize = Math.pow(2, power);
    }
    
    updateGridSizeDisplay();
    viewManager.updateGridOverlay();
    
    // Re-render everything with the new grid size
    renderCountries();
    renderFlights();
    renderRailways();
    
    // Update zoom info
    viewManager.updateViewBox();
}

function initializeGridSizeControl() {
    const slider = document.getElementById('grid-size-slider');
    if (!slider) return;
    
    // Set initial value
    updateGridSizeDisplay();
    
    // Add event listener
    slider.addEventListener('input', (e) => {
        const power = parseInt(e.target.value);
        setGridSize(power);
    });
}

function initializeMap() {
    loadFlightsFromStorage();
    loadRailwaysFromStorage();
    
    let validAirports = 0;
    for (const [code, airport] of Object.entries(airports)) {
        try {
            validateCoordinate(airport.lat, airport.lon, `airport ${code}`);
            validAirports++;
        } catch (error) {
            console.error(`invalid airport ${code}: ${error.message}`);
        }
    }
    
    renderCountries();
    renderFlights();
    renderRailways();
    updateFlightList();
    updateRailwayList();
    
    initializePanZoom();
    initializeGridSizeControl();
    
    updateGridOverlay();
    
    // Initialize transport mode switching
    function switchTransportMode(mode) {
        currentTransportMode = mode;
        
        // Update tab appearance
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.transport === mode) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide appropriate form
        document.querySelectorAll('.transport-form').forEach(form => {
            form.classList.remove('active');
            if (form.dataset.transport === mode) {
                form.classList.add('active');
            }
        });
        
        // Show/hide appropriate list
        document.querySelectorAll('.transport-list-container').forEach(container => {
            container.classList.remove('active');
            if (container.dataset.transport === mode) {
                container.classList.add('active');
            }
        });
    }
    
    // Add tab event listeners
    document.getElementById('flights-tab').addEventListener('click', () => switchTransportMode('flights'));
    document.getElementById('railways-tab').addEventListener('click', () => switchTransportMode('railways'));
    
    // Flight form handler
    const flightForm = document.getElementById('flight-form');
    flightForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fromInput = document.getElementById('from-airport');
        const toInput = document.getElementById('to-airport');
        
        const fromCode = fromInput.value.trim().toUpperCase();
        const toCode = toInput.value.trim().toUpperCase();
        
        if (fromCode && toCode && fromCode !== toCode) {
            if (addFlight(fromCode, toCode)) {
                fromInput.value = '';
                toInput.value = '';
            }
        } else {
            alert('please enter valid, different airport codes');
        }
    });
    
    // Railway form handler
    const railwayForm = document.getElementById('railway-form');
    railwayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fromInput = document.getElementById('from-station');
        const toInput = document.getElementById('to-station');
        
        const fromCode = fromInput.value.trim().toUpperCase();
        const toCode = toInput.value.trim().toUpperCase();
        
        if (fromCode && toCode && fromCode !== toCode) {
            if (addRailway(fromCode, toCode)) {
                fromInput.value = '';
                toInput.value = '';
            }
        } else {
            alert('please enter valid, different railway station codes');
        }
    });
}



window.addFlight = addFlight;
window.removeFlight = removeFlight;
window.addRailway = addRailway;
window.removeRailway = removeRailway;
window.initializeMap = initializeMap;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
} else {
    initializeMap();
} 