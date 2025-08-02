import { countries } from './data/countries.js';
import { airports } from './data/airports.js';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const GRID_SIZE = 4;

let mapContainerElement = null;
let activeFlights = [];

// pan and zoom state
let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let svgElement = null;
let mapContainer = null;

// zoom constraints
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.2;

function saveFlightsToStorage() {
    try {
        localStorage.setItem('circuitFlights', JSON.stringify(activeFlights));
    } catch (error) {
        // localStorage not available
    }
}

function loadFlightsFromStorage() {
    try {
        const stored = localStorage.getItem('circuitFlights');
        if (stored) {
            activeFlights = JSON.parse(stored);
        }
    } catch (error) {
        activeFlights = [];
    }
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// normalize longitude to [-180, 180] range
function normalizeLongitude(lon) {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
}

function calculateGreatCirclePoints(lat1, lon1, lat2, lon2, numPoints = 20) {
    // normalize longitudes to [-180, 180]
    lon1 = ((lon1 + 180) % 360) - 180;
    lon2 = ((lon2 + 180) % 360) - 180;
    
    // check if we cross the date line and should take the shorter path
    const lonDiff = lon2 - lon1;
    if (Math.abs(lonDiff) > 180) {
        // crossing date line - adjust lon2 to take shorter path
        if (lonDiff > 0) {
            lon2 -= 360; // go westward instead
        } else {
            lon2 += 360; // go eastward instead
        }
    }
    
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
            points.push([normalizeLongitude(lon1), lat1]);
        } else if (f === 1) {
            points.push([normalizeLongitude(lon2), lat2]);
        } else {
            // intermediate point calculation
            const A = Math.sin((1-f)*c) / Math.sin(c);
            const B = Math.sin(f*c) / Math.sin(c);
            
            const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
            const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
            const z = A * Math.sin(φ1) + B * Math.sin(φ2);
            
            const φ = Math.atan2(z, Math.sqrt(x*x + y*y));
            const λ = Math.atan2(y, x);
            
            const lon = normalizeLongitude(toDegrees(λ));
            points.push([lon, toDegrees(φ)]);
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

// pan and zoom functionality
function updateViewBox() {
    if (!svgElement) return;
    
    const scaledWidth = MAP_WIDTH / currentZoom;
    const scaledHeight = MAP_HEIGHT / currentZoom;
    
    // clamp pan to prevent showing empty space
    const maxPanX = Math.max(0, (MAP_WIDTH - scaledWidth) / 2);
    const maxPanY = Math.max(0, (MAP_HEIGHT - scaledHeight) / 2);
    
    currentPanX = Math.max(-maxPanX, Math.min(maxPanX, currentPanX));
    currentPanY = Math.max(-maxPanY, Math.min(maxPanY, currentPanY));
    
    const viewBoxX = (MAP_WIDTH - scaledWidth) / 2 - currentPanX;
    const viewBoxY = (MAP_HEIGHT - scaledHeight) / 2 - currentPanY;
    
    svgElement.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${scaledWidth} ${scaledHeight}`);
    
    // update zoom info display
    const zoomInfo = document.getElementById('zoom-info');
    if (zoomInfo) {
        const zoomPercent = Math.round(currentZoom * 100);
        zoomInfo.textContent = `zoom: ${zoomPercent}% | pan: drag to move`;
    }
}

function zoomToPoint(zoomDelta, clientX, clientY) {
    if (!svgElement || !mapContainer) return;
    
    const rect = mapContainer.getBoundingClientRect();
    const svgX = (clientX - rect.left) / rect.width * MAP_WIDTH;
    const svgY = (clientY - rect.top) / rect.height * MAP_HEIGHT;
    
    const oldZoom = currentZoom;
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomDelta));
    
    if (currentZoom !== oldZoom) {
        // adjust pan to zoom towards the mouse cursor
        const zoomRatio = currentZoom / oldZoom;
        const centerX = MAP_WIDTH / 2;
        const centerY = MAP_HEIGHT / 2;
        
        // calculate offset from center to zoom point
        const offsetX = svgX - centerX;
        const offsetY = svgY - centerY;
        
        // adjust pan to keep zoom point stationary
        currentPanX += offsetX * (1 - 1/zoomRatio) / currentZoom;
        currentPanY += offsetY * (1 - 1/zoomRatio) / currentZoom;
        
        updateViewBox();
    }
}

function resetView() {
    currentZoom = 1;
    currentPanX = 0;
    currentPanY = 0;
    updateViewBox();
}

function initializePanZoom() {
    svgElement = document.getElementById('map');
    mapContainer = document.getElementById('map-container');
    
    if (!svgElement || !mapContainer) return;
    
    // mouse wheel zoom
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        zoomToPoint(zoomDelta, e.clientX, e.clientY);
    });
    
    // mouse pan
    mapContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // left click only
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
            
            // convert screen coordinates to svg coordinates
            const rect = mapContainer.getBoundingClientRect();
            const panFactorX = (MAP_WIDTH / currentZoom) / rect.width;
            const panFactorY = (MAP_HEIGHT / currentZoom) / rect.height;
            
            currentPanX += deltaX * panFactorX;
            currentPanY += deltaY * panFactorY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            updateViewBox();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            mapContainer.classList.remove('panning');
        }
    });
    
    // zoom button controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        const rect = mapContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        zoomToPoint(ZOOM_STEP, centerX, centerY);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        const rect = mapContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        zoomToPoint(-ZOOM_STEP, centerX, centerY);
    });
    
    document.getElementById('zoom-reset').addEventListener('click', resetView);
    
    // touch support for mobile
    let lastTouchDistance = 0;
    let touchCenterX = 0;
    let touchCenterY = 0;
    
    mapContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // single touch - start panning
            isPanning = true;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
            mapContainer.classList.add('panning');
        } else if (e.touches.length === 2) {
            // two finger pinch zoom
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
    });
    
    mapContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isPanning) {
            // single touch panning
            const deltaX = e.touches[0].clientX - lastMouseX;
            const deltaY = e.touches[0].clientY - lastMouseY;
            
            const rect = mapContainer.getBoundingClientRect();
            const panFactorX = (MAP_WIDTH / currentZoom) / rect.width;
            const panFactorY = (MAP_HEIGHT / currentZoom) / rect.height;
            
            currentPanX += deltaX * panFactorX;
            currentPanY += deltaY * panFactorY;
            
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
            
            updateViewBox();
        } else if (e.touches.length === 2) {
            // pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const currentDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            if (lastTouchDistance > 0) {
                const zoomDelta = (currentDistance - lastTouchDistance) * 0.01;
                zoomToPoint(zoomDelta, touchCenterX, touchCenterY);
            }
            
            lastTouchDistance = currentDistance;
            touchCenterX = (touch1.clientX + touch2.clientX) / 2;
            touchCenterY = (touch1.clientY + touch2.clientY) / 2;
        }
        e.preventDefault();
    });
    
    mapContainer.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            isPanning = false;
            lastTouchDistance = 0;
            mapContainer.classList.remove('panning');
        } else if (e.touches.length === 1) {
            // continue panning with remaining finger
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }
        e.preventDefault();
    });
    
    // initialize view
    updateViewBox();
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





// render raw country outlines 
function renderCountries() {
    const svg = document.getElementById('map');
    const countriesGroup = document.getElementById('countries-group') || 
                          document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    countriesGroup.id = 'countries-group';
    countriesGroup.innerHTML = ''; // clear existing
    
    let totalPaths = 0;
    
    // render countries in original position and wrapped positions
    for (const offset of [0]) {
        for (const [countryName, countryData] of Object.entries(countries)) {
            if (!countryData.polygons || countryData.polygons.length === 0) continue;
            
            // render each polygon for this country
            for (let i = 0; i < countryData.polygons.length; i++) {
                const polygon = countryData.polygons[i];
                
                // create wrapped polygon coordinates
                const wrappedPolygon = polygon.map(([lon, lat]) => [lon, lat]);
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', createPathWithOffset(wrappedPolygon, offset));
                path.setAttribute('class', 'country');
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

// create svg path string with horizontal offset for wrapping
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
            
            // circuit board routing with 0/45/90 degree angles
            if (dx === 0 || dy === 0) {
                // direct horizontal or vertical line
                pathData += ` L ${offsetX} ${y}`;
            } else if (Math.abs(dx) === Math.abs(dy)) {
                // perfect 45-degree diagonal
                pathData += ` L ${offsetX} ${y}`;
            } else if (Math.abs(dx - dy) <= GRID_SIZE) {
                // close to 45-degree - use diagonal
                pathData += ` L ${offsetX} ${y}`;
            } else {
                // use circuit board routing with 45-degree segments when beneficial
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                const minDist = Math.min(absDx, absDy);
                
                if (minDist >= GRID_SIZE * 2) {
                    // use 45-degree diagonal + orthogonal routing
                    const diagLen = Math.floor(minDist * 0.6 / GRID_SIZE) * GRID_SIZE;
                    const diagX = prevOffsetX + (dx > 0 ? diagLen : -diagLen);
                    const diagY = prev.y + (dy > 0 ? diagLen : -diagLen);
                    
                    // diagonal segment first
                    pathData += ` L ${diagX} ${diagY}`;
                    
                    // then orthogonal to destination
                    if (absDx > absDy) {
                        pathData += ` L ${offsetX} ${diagY} L ${offsetX} ${y}`;
                    } else {
                        pathData += ` L ${diagX} ${y} L ${offsetX} ${y}`;
                    }
                } else {
                    // traditional orthogonal routing for small segments
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
    
    // render flights in original position and wrapped positions
    for (const offset of [0]) {
        activeFlights.forEach((flight, index) => {
            const fromAirport = airports[flight.from];
            const toAirport = airports[flight.to];
            
            if (!fromAirport || !toAirport) {
                console.error(`invalid flight: ${flight.from} -> ${flight.to}`);
                return;
            }
            
            // create geometrically accurate flight path using great circle arc
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createFlightPathWithOffset(fromAirport, toAirport, offset));
            path.setAttribute('class', 'flight-line');
            path.setAttribute('data-flight-index', index);
            path.setAttribute('data-offset', offset);
            
            flightsGroup.appendChild(path);
            
            // create airport dots at projected coordinates with offset
            const from = projectAndSnap(fromAirport.lat, fromAirport.lon);
            const to = projectAndSnap(toAirport.lat, toAirport.lon);
            
            // create airport dots with offset
            [from, to].forEach(point => {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', point.x + offset);
                dot.setAttribute('cy', point.y);
                dot.setAttribute('r', 3);
                dot.setAttribute('class', 'airport-dot');
                dot.setAttribute('data-offset', offset);
                
                flightsGroup.appendChild(dot);
            });
        });
    }
}

// create flight path with horizontal offset for wrapping
function createFlightPathWithOffset(fromAirport, toAirport, xOffset) {
    // calculate great circle arc points
    const arcPoints = calculateGreatCirclePoints(
        fromAirport.lat, fromAirport.lon,
        toAirport.lat, toAirport.lon,
        15 // number of intermediate points for smooth arc
    );
    
    // convert arc points to screen coordinates and detect edge crossings
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
            
            // detect date line crossing using actual longitude coordinates
            const lonDiff = currLon - prevLon;
            
            if (Math.abs(lonDiff) > 180) {
                // we're crossing the date line - end current segment and start new one
                if (currentSegment.length > 1) {
                    pathSegments.push([...currentSegment]);
                }
                currentSegment = [point]; // start new segment from current point
            } else {
                // normal segment - apply circuit board routing
                const prevPoint = currentSegment[currentSegment.length - 1];
                const targetX = point.x;
                const targetY = point.y;
                const dx = targetX - prevPoint.x;
                const dy = targetY - prevPoint.y;
                
                // apply circuit board routing between consecutive arc points
                if (dx === 0 || dy === 0) {
                    // direct horizontal or vertical
                    currentSegment.push({ x: targetX, y: targetY });
                } else if (Math.abs(dx) === Math.abs(dy)) {
                    // perfect 45-degree diagonal
                    currentSegment.push({ x: targetX, y: targetY });
                } else {
                    // use circuit board routing with small segments
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    const minDist = Math.min(absDx, absDy);
                    
                    if (minDist >= GRID_SIZE) {
                        // create 45-degree diagonal segment first
                        const diagLen = Math.min(minDist, GRID_SIZE * 3);
                        const diagX = prevPoint.x + (dx > 0 ? diagLen : -diagLen);
                        const diagY = prevPoint.y + (dy > 0 ? diagLen : -diagLen);
                        
                        currentSegment.push({ x: diagX, y: diagY });
                        
                        // then complete the path orthogonally
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
                        // small segment - use orthogonal routing
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
    
    // add the final segment
    if (currentSegment.length > 0) {
        pathSegments.push(currentSegment);
    }
    
    // convert all segments to path data
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
    
    return true;
}

// remove flight
function removeFlight(index) {
    if (index >= 0 && index < activeFlights.length) {
        const flight = activeFlights.splice(index, 1)[0];
        saveFlightsToStorage();
        renderFlights();
        updateFlightList();
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
    loadFlightsFromStorage();
    
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
    updateFlightList();
    
    // initialize pan and zoom functionality
    initializePanZoom();
    
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
}



window.addFlight = addFlight;
window.removeFlight = removeFlight;
window.initializeMap = initializeMap;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
} else {
    initializeMap();
} 