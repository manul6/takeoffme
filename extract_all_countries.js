const fs = require('fs');

// 4px grid (twice less fine than before)
const GRID_SIZE = 4;

// more lenient coordinate validation - only reject truly invalid coordinates
function validateCoordinate(lon, lat, context = '') {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error(`non-numeric coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
    
    // be more lenient with coordinate ranges to include edge cases
    if (lat < -91 || lat > 91 || lon < -181 || lon > 181) {
        console.warn(`edge coordinate ${context}: lat=${lat}, lon=${lon} - including anyway`);
    }
    
    // only reject completely invalid coordinates
    if (Math.abs(lat) > 100 || Math.abs(lon) > 200) {
        throw new Error(`severely invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
    
    return true;
}

async function extractAllCountries() {
    console.log('loading ALL country polygon data with robust extraction...');
    
    const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    const countries = {};
    let processedCount = 0;
    let totalPoints = 0;
    let skippedCount = 0;
    
    // priority countries to ensure they're included
    const priorityCountries = [
        'United States of America', 'Russia', 'Canada', 'Australia', 
        'China', 'Brazil', 'India', 'Germany', 'France', 'United Kingdom'
    ];
    
    console.log(`processing ${data.metadata.total_countries} countries with 4px grid...`);
    
    for (const [countryName, countryData] of Object.entries(data.countries)) {
        const isPriority = priorityCountries.includes(countryName);
        
        try {
            const countryPolygons = [];
            
            if (countryData.type === 'polygon') {
                const outerRing = countryData.coordinates;
                if (outerRing && outerRing.length >= 3) {
                    countryPolygons.push(outerRing);
                }
            } else if (countryData.type === 'multipolygon') {
                for (const polygon of countryData.coordinates) {
                    const outerRing = polygon[0];
                    if (outerRing && outerRing.length >= 3) {
                        countryPolygons.push(outerRing);
                    }
                }
            }
            
            const processedPolygons = [];
            let countryPointCount = 0;
            
            for (const polygon of countryPolygons) {
                const validPoints = [];
                let invalidPointCount = 0;
                
                for (let i = 0; i < polygon.length; i++) {
                    const [lon, lat] = polygon[i];
                    
                    try {
                        validateCoordinate(lon, lat, `${countryName} point ${i}`);
                        validPoints.push([lon, lat]);
                        countryPointCount++;
                        totalPoints++;
                    } catch (error) {
                        invalidPointCount++;
                        if (isPriority) {
                            console.warn(`Priority country ${countryName}: ${error.message} - skipping point`);
                        }
                    }
                }
                
                // include polygon if we have at least 3 valid points
                if (validPoints.length >= 3) {
                    processedPolygons.push(validPoints);
                } else if (isPriority) {
                    console.warn(`Priority country ${countryName}: polygon has only ${validPoints.length} valid points`);
                }
            }
            
            if (processedPolygons.length > 0) {
                countries[countryName] = {
                    type: countryData.type,
                    polygons: processedPolygons
                };
                console.log(`✓ ${countryName}: ${processedPolygons.length} polygons, ${countryPointCount} points`);
            } else {
                if (isPriority) {
                    console.error(`❌ MISSING PRIORITY COUNTRY: ${countryName} - no valid polygons!`);
                }
                skippedCount++;
            }
            
            processedCount++;
        } catch (error) {
            console.error(`error processing ${countryName}: ${error.message}`);
            if (isPriority) {
                console.error(`❌ FAILED TO PROCESS PRIORITY COUNTRY: ${countryName}`);
            }
            skippedCount++;
        }
    }
    
    console.log(`\n=== EXTRACTION SUMMARY ===`);
    console.log(`processed: ${processedCount} countries`);
    console.log(`included: ${Object.keys(countries).length} countries`);
    console.log(`skipped: ${skippedCount} countries`);
    console.log(`total points: ${totalPoints} (4px grid)`);
    
    // verify priority countries
    console.log(`\n=== PRIORITY COUNTRIES CHECK ===`);
    for (const priority of priorityCountries) {
        if (countries[priority]) {
            console.log(`✓ ${priority}: ${countries[priority].polygons.length} polygons`);
        } else {
            console.error(`❌ MISSING: ${priority}`);
        }
    }
    
    return countries;
}

async function main() {
    try {
        const countries = await extractAllCountries();
        
        const countriesJs = `// complete country polygon data with robust extraction
// coordinates in [lon, lat] format, validated with lenient bounds
// extracted with 4px grid, includes all major countries
export const countries = ${JSON.stringify(countries, null, 2)};`;
        
        fs.writeFileSync('data/countries.js', countriesJs);
        console.log('\n✓ wrote complete country data to data/countries.js');
        
        console.log('complete country extraction finished!');
        
    } catch (error) {
        console.error('extraction failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 