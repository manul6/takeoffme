const fs = require('fs');

function main() {
    console.log('debugging country data structure...');
    
    const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    // look at the first few countries to understand the structure
    const countries = Object.entries(data.countries).slice(0, 3);
    
    for (const [name, countryData] of countries) {
        console.log(`\n=== ${name} ===`);
        console.log('type:', countryData.type);
        console.log('coordinates length:', countryData.coordinates.length);
        
        if (countryData.type === 'polygon') {
            const outerRing = countryData.coordinates;
            console.log('outer ring length:', outerRing.length);
            console.log('first few points:', outerRing.slice(0, 3));
        } else if (countryData.type === 'multipolygon') {
            console.log('number of polygons:', countryData.coordinates.length);
            const firstPolygon = countryData.coordinates[0];
            console.log('first polygon outer ring length:', firstPolygon.length);
            console.log('first few points of first polygon:', firstPolygon.slice(0, 3));
        }
    }
}

main(); 