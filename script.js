// circuit board flight map - main application logic
import { countries } from './data/countries.js';
import { airports } from './data/airports.js';

// svg dimensions and projection settings
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const GRID_SIZE = 4; // 4px grid for circuit paths

// zoom and pan state
let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

// active flights storage with localStorage persistence
let activeFlights = [];

function saveFlightsToStorage() {
    try {
        localStorage.setItem('circuitFlights', JSON.stringify(activeFlights));
    } catch (error) {
        console.warn('failed to save flights to localStorage:', error);
    }
}

function loadFlightsFromStorage() {
    try {
        const stored = localStorage.getItem('circuitFlights');
        if (stored) {
            activeFlights = JSON.parse(stored);
            console.log(`loaded ${activeFlights.length} flights from storage`);
        }
    } catch (error) {
        console.warn('failed to load flights from localStorage:', error);
        activeFlights = [];
    }
}

// great circle calculation functions for accurate flight paths
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function calculateGreatCirclePoints(lat1, lon1, lat2, lon2, numPoints = 20) {
    // convert to radians
    const φ1 = toRadians(lat1);
    const λ1 = toRadians(lon1);
    const φ2 = toRadians(lat2);
    const λ2 = toRadians(lon2);
    
    // calculate angular distance
    const Δφ = φ2 - φ1;
    const Δλ = λ2 - λ1;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + 
              Math.cos(φ1) * Math.cos(φ2) * 
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    const points = [];
    
    // generate intermediate points along the great circle
    for (let i = 0; i <= numPoints; i++) {
        const f = i / numPoints;
        
        if (f === 0) {
            points.push([lon1, lat1]);
        } else if (f === 1) {
            points.push([lon2, lat2]);
        } else {
            // intermediate point calculation
            const A = Math.sin((1-f)*c) / Math.sin(c);
            const B = Math.sin(f*c) / Math.sin(c);
            
            const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
            const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
            const z = A * Math.sin(φ1) + B * Math.sin(φ2);
            
            const φ = Math.atan2(z, Math.sqrt(x*x + y*y));
            const λ = Math.atan2(y, x);
            
            points.push([toDegrees(λ), toDegrees(φ)]);
        }
    }
    
    return points;
}

// coordinate validation with floating point tolerance
function validateCoordinate(lat, lon, context = '') {
    const EPSILON = 1e-10; // tolerance for floating point precision
    
    // clamp values that are very close to boundaries
    if (lat < -90 - EPSILON || lat > 90 + EPSILON || 
        lon < -180 - EPSILON || lon > 180 + EPSILON) {
        throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
}

// equirectangular projection with validation and clamping
function project(lat, lon) {
    validateCoordinate(lat, lon, 'in projection');
    
    // clamp to valid ranges to handle floating point precision
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    
    const x = (clampedLon + 180) * (MAP_WIDTH / 360);
    const y = (90 - clampedLat) * (MAP_HEIGHT / 180);
    
    return { x: x, y: y };
}

// snap coordinates to grid
function snap(value, gridSize = GRID_SIZE) {
    return Math.round(value / gridSize) * gridSize;
}

// project and snap coordinates
function projectAndSnap(lat, lon) {
    const projected = project(lat, lon);
    return {
        x: snap(projected.x),
        y: snap(projected.y)
    };
}

// create svg path string with 0/45/90 degree circuit board routing
function createPath(coordinates, closed = true) {
    if (!coordinates || coordinates.length < 2) return '';
    
    let pathData = '';
    
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
            
            // circuit board routing with 0/45/90 degree angles
            if (dx === 0 || dy === 0) {
                // direct horizontal or vertical line
                pathData += ` L ${x} ${y}`;
            } else if (Math.abs(dx) === Math.abs(dy)) {
                // perfect 45-degree diagonal
                pathData += ` L ${x} ${y}`;
            } else if (Math.abs(dx - dy) <= GRID_SIZE) {
                // close to 45-degree - use diagonal
                pathData += ` L ${x} ${y}`;
            } else {
                // use circuit board routing with 45-degree segments when beneficial
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                const minDist = Math.min(absDx, absDy);
                
                if (minDist >= GRID_SIZE * 2) {
                    // use 45-degree diagonal + orthogonal routing
                    const diagLen = Math.floor(minDist * 0.6 / GRID_SIZE) * GRID_SIZE;
                    const diagX = prev.x + (dx > 0 ? diagLen : -diagLen);
                    const diagY = prev.y + (dy > 0 ? diagLen : -diagLen);
                    
                    // diagonal segment first
                    pathData += ` L ${diagX} ${diagY}`;
                    
                    // then orthogonal to destination
                    if (absDx > absDy) {
                        pathData += ` L ${x} ${diagY} L ${x} ${y}`;
                    } else {
                        pathData += ` L ${diagX} ${y} L ${x} ${y}`;
                    }
                } else {
                    // traditional orthogonal routing for small segments
                    if (absDx > absDy) {
                        pathData += ` L ${x} ${prev.y} L ${x} ${y}`;
                    } else {
                        pathData += ` L ${prev.x} ${y} L ${x} ${y}`;
                    }
                }
            }
        }
    }
    
    if (closed && coordinates.length > 2) {
        pathData += ' Z';
    }
    
    return pathData;
}

// create geometrically accurate flight path using great circle arc with circuit board routing
function createFlightPath(fromAirport, toAirport) {
    // calculate great circle arc points
    const arcPoints = calculateGreatCirclePoints(
        fromAirport.lat, fromAirport.lon,
        toAirport.lat, toAirport.lon,
        15 // number of intermediate points for smooth arc
    );
    
    // convert arc points to screen coordinates and apply circuit board routing
    const waypoints = [];
    
    for (let i = 0; i < arcPoints.length; i++) {
        const [lon, lat] = arcPoints[i];
        const screenPoint = projectAndSnap(lat, lon);
        
        if (i === 0) {
            waypoints.push(screenPoint);
        } else {
            // route from previous waypoint to current arc point using circuit board rules
            let current = waypoints[waypoints.length - 1];
            const targetX = screenPoint.x;
            const targetY = screenPoint.y;
            
            const dx = targetX - current.x;
            const dy = targetY - current.y;
            
            // apply circuit board routing between consecutive arc points
            if (dx === 0 || dy === 0) {
                // direct horizontal or vertical
                waypoints.push({ x: targetX, y: targetY });
            } else if (Math.abs(dx) === Math.abs(dy)) {
                // perfect 45-degree diagonal
                waypoints.push({ x: targetX, y: targetY });
            } else {
                // use circuit board routing with small segments
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                const minDist = Math.min(absDx, absDy);
                
                if (minDist >= GRID_SIZE) {
                    // create 45-degree diagonal segment first
                    const diagLen = Math.min(minDist, GRID_SIZE * 3);
                    const diagX = current.x + (dx > 0 ? diagLen : -diagLen);
                    const diagY = current.y + (dy > 0 ? diagLen : -diagLen);
                    
                    waypoints.push({ x: diagX, y: diagY });
                    
                    // then complete the path orthogonally
                    if (diagX !== targetX && diagY !== targetY) {
                        if (absDx > absDy) {
                            waypoints.push({ x: targetX, y: diagY });
                            if (targetY !== diagY) {
                                waypoints.push({ x: targetX, y: targetY });
                            }
                        } else {
                            waypoints.push({ x: diagX, y: targetY });
                            if (targetX !== diagX) {
                                waypoints.push({ x: targetX, y: targetY });
                            }
                        }
                    } else {
                        waypoints.push({ x: targetX, y: targetY });
                    }
                } else {
                    // small segment - use orthogonal routing
                    if (absDx > absDy) {
                        waypoints.push({ x: targetX, y: current.y });
                        if (targetY !== current.y) {
                            waypoints.push({ x: targetX, y: targetY });
                        }
                    } else {
                        waypoints.push({ x: current.x, y: targetY });
                        if (targetX !== current.x) {
                            waypoints.push({ x: targetX, y: targetY });
                        }
                    }
                }
            }
        }
    }
    
    // convert waypoints to path data
    let pathData = `M ${waypoints[0].x} ${waypoints[0].y}`;
    for (let i = 1; i < waypoints.length; i++) {
        pathData += ` L ${waypoints[i].x} ${waypoints[i].y}`;
    }
    
    return pathData;
}

// render raw country outlines
function renderCountries() {
    const svg = document.getElementById('map');
    const countriesGroup = document.getElementById('countries-group') || 
                          document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    countriesGroup.id = 'countries-group';
    countriesGroup.innerHTML = ''; // clear existing
    
    let totalPaths = 0;
    
    for (const [countryName, countryData] of Object.entries(countries)) {
        if (!countryData.polygons || countryData.polygons.length === 0) continue;
        
        // render each polygon for this country
        for (let i = 0; i < countryData.polygons.length; i++) {
            const polygon = countryData.polygons[i];
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createPath(polygon));
            path.setAttribute('class', 'country');
            path.setAttribute('data-country', countryName);
            path.setAttribute('data-polygon', i);
            
            countriesGroup.appendChild(path);
            totalPaths++;
        }
    }
    
    svg.appendChild(countriesGroup);
    console.log(`rendered ${totalPaths} country polygons from ${Object.keys(countries).length} countries`);
}

// render flights
function renderFlights() {
    const svg = document.getElementById('map');
    let flightsGroup = document.getElementById('flights-group');
    
    if (!flightsGroup) {
        flightsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        flightsGroup.id = 'flights-group';
        svg.appendChild(flightsGroup);
    }
    
    flightsGroup.innerHTML = ''; // clear existing
    
    activeFlights.forEach((flight, index) => {
        const fromAirport = airports[flight.from];
        const toAirport = airports[flight.to];
        
        if (!fromAirport || !toAirport) {
            console.error(`invalid flight: ${flight.from} -> ${flight.to}`);
            return;
        }
        
        // create geometrically accurate flight path using great circle arc
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', createFlightPath(fromAirport, toAirport));
        path.setAttribute('class', 'flight-line');
        path.setAttribute('data-flight-index', index);
        
        flightsGroup.appendChild(path);
        
        // create airport dots at projected coordinates
        const from = projectAndSnap(fromAirport.lat, fromAirport.lon);
        const to = projectAndSnap(toAirport.lat, toAirport.lon);
        
        // create airport dots
        [from, to].forEach(point => {
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', point.x);
            dot.setAttribute('cy', point.y);
            dot.setAttribute('r', 3);
            dot.setAttribute('class', 'airport-dot');
            
            flightsGroup.appendChild(dot);
        });
    });
    
    console.log(`rendered ${activeFlights.length} flights`);
}

// add new flight
function addFlight(fromCode, toCode) {
    // validate airport codes
    if (!airports[fromCode]) {
        alert(`unknown airport code: ${fromCode}`);
        return false;
    }
    
    if (!airports[toCode]) {
        alert(`unknown airport code: ${toCode}`);
        return false;
    }
    
    // check for duplicates
    const duplicate = activeFlights.some(flight => 
        (flight.from === fromCode && flight.to === toCode) ||
        (flight.from === toCode && flight.to === fromCode)
    );
    
    if (duplicate) {
        alert(`flight ${fromCode} ↔ ${toCode} already exists`);
        return false;
    }
    
    // add flight
    activeFlights.push({ from: fromCode, to: toCode });
    saveFlightsToStorage();
    renderFlights();
    updateFlightList();
    
    console.log(`added flight: ${fromCode} -> ${toCode}`);
    return true;
}

// remove flight
function removeFlight(index) {
    if (index >= 0 && index < activeFlights.length) {
        const flight = activeFlights.splice(index, 1)[0];
        saveFlightsToStorage();
        renderFlights();
        updateFlightList();
        console.log(`removed flight: ${flight.from} -> ${flight.to}`);
    }
}

// update flight list in ui
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
                ${flight.from} (${fromAirport.city}) → ${flight.to} (${toAirport.city})
            </span>
            <button class="remove-btn" onclick="removeFlight(${index})">×</button>
        `;
        
        flightList.appendChild(listItem);
    });
}

// initialize map
function initializeMap() {
    console.log('initializing circuit board flight map...');
    
    // load saved flights from localStorage
    loadFlightsFromStorage();
    
    // validate airport data
    let validAirports = 0;
    for (const [code, airport] of Object.entries(airports)) {
        try {
            validateCoordinate(airport.lat, airport.lon, `airport ${code}`);
            validAirports++;
        } catch (error) {
            console.error(`invalid airport ${code}: ${error.message}`);
        }
    }
    
    console.log(`loaded ${validAirports} valid airports`);
    
    // render initial map
    renderCountries();
    renderFlights();
    updateFlightList();
    
    // setup form handler
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
    
    // setup zoom and pan functionality
    setupZoomAndPan();
    
    console.log('flight map initialized successfully');
}

// zoom and pan functionality
function setupZoomAndPan() {
    const svg = document.getElementById('map');
    const mapContainer = document.querySelector('.map-container');
    
    // create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button id="zoom-in" class="zoom-btn">+</button>
        <button id="zoom-out" class="zoom-btn">−</button>
        <button id="zoom-reset" class="zoom-btn">⌂</button>
    `;
    mapContainer.appendChild(zoomControls);
    
    // zoom control handlers
    document.getElementById('zoom-in').addEventListener('click', () => zoomMap(1.5));
    document.getElementById('zoom-out').addEventListener('click', () => zoomMap(1/1.5));
    document.getElementById('zoom-reset').addEventListener('click', () => resetZoom());
    
    // mouse wheel zoom
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        zoomMap(zoomFactor, e.offsetX, e.offsetY);
    });
    
    // mouse pan
    let isPanning = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    svg.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // left click
            isPanning = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            svg.style.cursor = 'grabbing';
        }
    });
    
    svg.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            panMap(deltaX, deltaY);
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });
    
    svg.addEventListener('mouseup', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    svg.addEventListener('mouseleave', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    // initial cursor
    svg.style.cursor = 'grab';
}

function zoomMap(factor, centerX = null, centerY = null) {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * factor));
    
    if (centerX !== null && centerY !== null) {
        // zoom to specific point
        const zoomRatio = newZoom / currentZoom;
        currentPanX = centerX - (centerX - currentPanX) * zoomRatio;
        currentPanY = centerY - (centerY - currentPanY) * zoomRatio;
    }
    
    currentZoom = newZoom;
    updateMapTransform();
}

function panMap(deltaX, deltaY) {
    currentPanX += deltaX;
    currentPanY += deltaY;
    updateMapTransform();
}

function resetZoom() {
    currentZoom = 1;
    currentPanX = 0;
    currentPanY = 0;
    updateMapTransform();
}

function updateMapTransform() {
    const svg = document.getElementById('map');
    const transform = `translate(${currentPanX}, ${currentPanY}) scale(${currentZoom})`;
    svg.style.transform = transform;
}

// make functions globally available
window.addFlight = addFlight;
window.removeFlight = removeFlight;
window.initializeMap = initializeMap;

// initialize when dom loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
} else {
    initializeMap();
} 