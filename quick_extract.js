const fs = require('fs');

console.log('final extraction of ALL countries...');

const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
const data = JSON.parse(rawData);

const countries = {};
let count = 0;

for (const [name, countryData] of Object.entries(data.countries)) {
    const polygons = [];
    
    if (countryData.type === 'polygon') {
        if (countryData.coordinates && countryData.coordinates.length >= 3) {
            polygons.push(countryData.coordinates);
        }
    } else if (countryData.type === 'multipolygon') {
        for (const poly of countryData.coordinates) {
            if (poly[0] && poly[0].length >= 3) {
                polygons.push(poly[0]);
            }
        }
    }
    
    if (polygons.length > 0) {
        countries[name] = { type: countryData.type, polygons };
        count++;
        console.log(`${count}. ${name}: ${polygons.length} polygons`);
    }
}

// verify major countries
const major = ['United States of America', 'Russia', 'Canada', 'Australia', 'China', 'Brazil'];
console.log('\n=== VERIFICATION ===');
for (const country of major) {
    console.log(`${country}: ${countries[country] ? '✅ ' + countries[country].polygons.length + ' polygons' : '❌ MISSING'}`);
}

const output = `// all countries with raw polygon data - 4px grid
// includes all major countries: usa, russia, canada, australia, etc.
export const countries = ${JSON.stringify(countries, null, 2)};`;

fs.writeFileSync('data/countries.js', output);
console.log(`\n✅ SAVED ${count} countries to data/countries.js`);

console.log('extraction complete!'); 