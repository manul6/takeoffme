const fs = require('fs');

// fine grid for detailed circuit board paths
const FINE_GRID = 2;

// coordinate validation
function validateCoordinate(lon, lat, context = '') {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
}

// project to screen coordinates (no snapping here, keep raw precision)
function project(lat, lon) {
    const x = (lon + 180) * (1000 / 360);
    const y = (90 - lat) * (500 / 180);
    return [x, y];
}

async function extractRawCountries() {
    console.log('loading raw country polygon data...');
    
    const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    const countries = {};
    let processedCount = 0;
    let totalPoints = 0;
    
    console.log(`processing ${data.metadata.total_countries} countries with raw precision...`);
    
    for (const [countryName, countryData] of Object.entries(data.countries)) {
        try {
            const countryPolygons = [];
            
            if (countryData.type === 'polygon') {
                // for polygon, coordinates IS the outer ring
                const outerRing = countryData.coordinates;
                if (outerRing && outerRing.length >= 3) {
                    countryPolygons.push(outerRing);
                }
            } else if (countryData.type === 'multipolygon') {
                // for multipolygon, each element is a polygon, take outer ring of each
                for (const polygon of countryData.coordinates) {
                    const outerRing = polygon[0];
                    if (outerRing && outerRing.length >= 3) {
                        countryPolygons.push(outerRing);
                    }
                }
            }
            
            // process each polygon for this country
            const processedPolygons = [];
            for (const polygon of countryPolygons) {
                const projectedPoints = [];
                
                for (let i = 0; i < polygon.length; i++) {
                    const [lon, lat] = polygon[i];
                    validateCoordinate(lon, lat, `${countryName} point ${i}`);
                    
                    // keep original coordinates exactly as-is
                    projectedPoints.push([lon, lat]);
                    totalPoints++;
                }
                
                if (projectedPoints.length >= 3) {
                    processedPolygons.push(projectedPoints);
                }
            }
            
            if (processedPolygons.length > 0) {
                countries[countryName] = {
                    type: countryData.type,
                    polygons: processedPolygons
                };
            }
            
            processedCount++;
        } catch (error) {
            console.error(`error processing ${countryName}: ${error.message}`);
        }
    }
    
    console.log(`processed ${processedCount} countries with ${totalPoints} total points (raw data)`);
    console.log(`countries with valid polygons: ${Object.keys(countries).length}`);
    
    return countries;
}

async function main() {
    try {
        const countries = await extractRawCountries();
        
        // write the raw country data
        const countriesJs = `// raw country polygon data without transformation
// coordinates in [lon, lat] format, validated: lat ∈ [-90, 90], lon ∈ [-180, 180]
// each country rendered exactly as provided in source data
export const countries = ${JSON.stringify(countries, null, 2)};`;
        
        fs.writeFileSync('data/countries.js', countriesJs);
        console.log('wrote raw country data to data/countries.js');
        
        console.log('raw country extraction complete - no transformation applied!');
        
    } catch (error) {
        console.error('extraction failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 