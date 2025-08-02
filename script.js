import { countries } from './data/countries.js';
import { airports } from './data/airports.js';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const BASE_GRID_SIZE = 4;
const BASE_STROKE_WIDTH = 2;
let currentGridSize = BASE_GRID_SIZE;
let currentStrokeWidth = BASE_STROKE_WIDTH;

let mapContainerElement = null;
let activeFlights = [];

let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let svgElement = null;
let mapContainer = null;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.2;

function saveFlightsToStorage() {
    try {
        localStorage.setItem('circuitFlights', JSON.stringify(activeFlights));
    } catch (error) {
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

function normalizeLongitude(lon) {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
}

function calculateGreatCirclePoints(lat1, lon1, lat2, lon2, numPoints = 20) {
    lon1 = ((lon1 + 180) % 360) - 180;
    lon2 = ((lon2 + 180) % 360) - 180;
    
    const lonDiff = lon2 - lon1;
    if (Math.abs(lonDiff) > 180) {
        if (lonDiff > 0) {
            lon2 -= 360;
        } else {
            lon2 += 360;
        }
    }
    
    const φ1 = toRadians(lat1);
    const λ1 = toRadians(lon1);
    const φ2 = toRadians(lat2);
    const λ2 = toRadians(lon2);
    
    const Δφ = φ2 - φ1;
    const Δλ = λ2 - λ1;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + 
              Math.cos(φ1) * Math.cos(φ2) * 
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    const points = [];
    
    for (let i = 0; i <= numPoints; i++) {
        const f = i / numPoints;
        
        if (f === 0) {
            points.push([normalizeLongitude(lon1), lat1]);
        } else if (f === 1) {
            points.push([normalizeLongitude(lon2), lat2]);
        } else {
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

function validateCoordinate(lat, lon, context = '') {
    const EPSILON = 1e-10;
    
    if (lat < -90 - EPSILON || lat > 90 + EPSILON || 
        lon < -180 - EPSILON || lon > 180 + EPSILON) {
        throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
}

function project(lat, lon) {
    validateCoordinate(lat, lon, 'in projection');
    
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    
    const x = (clampedLon + 180) * (MAP_WIDTH / 360);
    const y = (90 - clampedLat) * (MAP_HEIGHT / 180);
    
    return { x: x, y: y };
}

function snap(value, gridSize = currentGridSize) {
    return Math.round(value / gridSize) * gridSize;
}

function projectAndSnap(lat, lon) {
    const projected = project(lat, lon);
    return {
        x: snap(projected.x),
        y: snap(projected.y)
    };
}

function updateViewBox() {
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
}

function updateGridOverlay() {
    const gridOverlay = document.querySelector('.grid-overlay');
    if (gridOverlay) {
        const gridSizePx = Math.max(1, Math.round(currentGridSize));
        gridOverlay.style.backgroundSize = `${gridSizePx}px ${gridSizePx}px`;
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
        const zoomRatio = currentZoom / oldZoom;
        const centerX = MAP_WIDTH / 2;
        const centerY = MAP_HEIGHT / 2;
        
        const offsetX = svgX - centerX;
        const offsetY = svgY - centerY;
        
        currentPanX += offsetX * (1 - 1/zoomRatio) / currentZoom;
        currentPanY += offsetY * (1 - 1/zoomRatio) / currentZoom;
        
        currentGridSize = BASE_GRID_SIZE / currentZoom;
        currentStrokeWidth = Math.max(0.5, BASE_STROKE_WIDTH / currentZoom);
        
        updateViewBox();
        updateGridOverlay();
        
        renderCountries();
        renderFlights();
    }
}

function resetView() {
    currentZoom = 1;
    currentPanX = 0;
    currentPanY = 0;
    currentGridSize = BASE_GRID_SIZE;
    currentStrokeWidth = BASE_STROKE_WIDTH;
    updateViewBox();
    updateGridOverlay();
    
    renderCountries();
    renderFlights();
}

function initializePanZoom() {
    svgElement = document.getElementById('map');
    mapContainer = document.getElementById('map-container');
    
    if (!svgElement || !mapContainer) return;
    
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        zoomToPoint(zoomDelta, e.clientX, e.clientY);
    });
    
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
            
            updateViewBox();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            mapContainer.classList.remove('panning');
        }
    });
    
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
    
    let lastTouchDistance = 0;
    let touchCenterX = 0;
    let touchCenterY = 0;
    
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
    });
    
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
            
            updateViewBox();
        } else if (e.touches.length === 2) {
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
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }
        e.preventDefault();
    });
    
    updateViewBox();
}

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
            
            if (dx === 0 || dy === 0) {
                pathData += ` L ${x} ${y}`;
            } else if (Math.abs(dx) === Math.abs(dy)) {
                pathData += ` L ${x} ${y}`;
            } else if (Math.abs(dx - dy) <= currentGridSize) {
                pathData += ` L ${x} ${y}`;
            } else {
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                const minDist = Math.min(absDx, absDy);
                
                if (minDist >= currentGridSize * 2) {
                    const diagLen = Math.floor(minDist * 0.6 / currentGridSize) * currentGridSize;
                    const diagX = prev.x + (dx > 0 ? diagLen : -diagLen);
                    const diagY = prev.y + (dy > 0 ? diagLen : -diagLen);
                    
                    pathData += ` L ${diagX} ${diagY}`;
                    
                    if (absDx > absDy) {
                        pathData += ` L ${x} ${diagY} L ${x} ${y}`;
                    } else {
                        pathData += ` L ${diagX} ${y} L ${x} ${y}`;
                    }
                } else {
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

function removeFlight(index) {
    if (index >= 0 && index < activeFlights.length) {
        const flight = activeFlights.splice(index, 1)[0];
        saveFlightsToStorage();
        renderFlights();
        updateFlightList();
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
    
    initializePanZoom();
    
    updateGridOverlay();
    
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