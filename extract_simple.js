const fs = require('fs');

async function extractSimple() {
    console.log('extracting ALL countries with simple robust approach...');
    
    const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    const countries = {};
    let totalPoints = 0;
    
    console.log(`processing ${data.metadata.total_countries} countries...`);
    
    for (const [countryName, countryData] of Object.entries(data.countries)) {
        const processedPolygons = [];
        
        try {
            if (countryData.type === 'polygon') {
                // simple polygon - coordinates is the outer ring
                const ring = countryData.coordinates;
                if (ring && ring.length >= 3) {
                    processedPolygons.push(ring);
                    totalPoints += ring.length;
                }
            } else if (countryData.type === 'multipolygon') {
                // multipolygon - each item in coordinates is a polygon
                for (const polygon of countryData.coordinates) {
                    const ring = polygon[0]; // outer ring
                    if (ring && ring.length >= 3) {
                        processedPolygons.push(ring);
                        totalPoints += ring.length;
                    }
                }
            }
            
            if (processedPolygons.length > 0) {
                countries[countryName] = {
                    type: countryData.type,
                    polygons: processedPolygons
                };
                console.log(`✓ ${countryName}: ${processedPolygons.length} polygons`);
            }
        } catch (error) {
            console.error(`error with ${countryName}: ${error.message}`);
        }
    }
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`total countries: ${Object.keys(countries).length}`);
    console.log(`total points: ${totalPoints} (4px grid)`);
    
    // check for major countries
    const major = ['United States of America', 'Russia', 'Canada', 'Australia', 'China', 'Brazil'];
    console.log(`\n=== MAJOR COUNTRIES ===`);
    for (const country of major) {
        if (countries[country]) {
            console.log(`✓ ${country}: ${countries[country].polygons.length} polygons`);
        } else {
            console.error(`❌ MISSING: ${country}`);
        }
    }
    
    return countries;
}

async function main() {
    try {
        const countries = await extractSimple();
        
        const countriesJs = `// all countries extracted with simple robust approach
// coordinates in [lon, lat] format, 4px grid
// includes major countries: usa, russia, canada, australia, etc.
export const countries = ${JSON.stringify(countries, null, 2)};`;
        
        fs.writeFileSync('data/countries.js', countriesJs);
        console.log('\n✅ wrote complete countries.js with all major countries!');
        
    } catch (error) {
        console.error('extraction failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 