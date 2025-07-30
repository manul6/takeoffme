// circuit board flight map - main application logic
import { countries } from './data/countries.js';
import { airports } from './data/airports.js';

// svg dimensions and projection settings
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const GRID_SIZE = 4; // 4px grid for circuit paths

// active flights storage
let activeFlights = [];

// coordinate validation
function validateCoordinate(lat, lon, context = '') {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
}

// equirectangular projection with validation
function project(lat, lon) {
    validateCoordinate(lat, lon, 'in projection');
    
    const x = (lon + 180) * (MAP_WIDTH / 360);
    const y = (90 - lat) * (MAP_HEIGHT / 180);
    
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

// create svg path string from coordinate array
function createPath(coordinates, closed = true) {
    if (!coordinates || coordinates.length < 2) return '';
    
    let pathData = '';
    
    for (let i = 0; i < coordinates.length; i++) {
        const [lon, lat] = coordinates[i];
        const { x, y } = projectAndSnap(lat, lon);
        
        if (i === 0) {
            pathData += `M ${x} ${y}`;
        } else {
            // create orthogonal/45-degree segments
            const prevCoord = coordinates[i - 1];
            const [prevLon, prevLat] = prevCoord;
            const prev = projectAndSnap(prevLat, prevLon);
            
            const dx = x - prev.x;
            const dy = y - prev.y;
            
            // create stepped path for circuit board aesthetic
            if (Math.abs(dx) > Math.abs(dy)) {
                // horizontal first
                pathData += ` L ${x} ${prev.y} L ${x} ${y}`;
            } else {
                // vertical first
                pathData += ` L ${prev.x} ${y} L ${x} ${y}`;
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
        
        const from = projectAndSnap(fromAirport.lat, fromAirport.lon);
        const to = projectAndSnap(toAirport.lat, toAirport.lon);
        
        // create flight path
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.setAttribute('class', 'flight-line');
        line.setAttribute('data-flight-index', index);
        
        flightsGroup.appendChild(line);
        
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
    renderFlights();
    updateFlightList();
    
    console.log(`added flight: ${fromCode} -> ${toCode}`);
    return true;
}

// remove flight
function removeFlight(index) {
    if (index >= 0 && index < activeFlights.length) {
        const flight = activeFlights.splice(index, 1)[0];
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
    
    console.log('flight map initialized successfully');
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