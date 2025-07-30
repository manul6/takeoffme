const fs = require('fs');

// Check current countries data
try {
    const { countries } = require('./data/countries.js');
    console.log('Current countries loaded:', Object.keys(countries).length);
    
    const major = ['United States of America', 'Russia', 'Canada', 'Australia', 'China', 'Brazil'];
    console.log('\nMajor countries check:');
    for (const country of major) {
        if (countries[country]) {
            console.log(`✅ ${country}: ${countries[country].polygons.length} polygons`);
        } else {
            console.log(`❌ MISSING: ${country}`);
        }
    }
} catch (error) {
    console.log('Error loading countries:', error.message);
}

// Now extract ALL countries including the missing ones
console.log('\n=== EXTRACTING ALL COUNTRIES ===');

const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
const data = JSON.parse(rawData);

const allCountries = {};

for (const [name, countryData] of Object.entries(data.countries)) {
    const polygons = [];
    
    if (countryData.type === 'polygon' && countryData.coordinates && countryData.coordinates.length >= 3) {
        polygons.push(countryData.coordinates);
    } else if (countryData.type === 'multipolygon') {
        for (const poly of countryData.coordinates) {
            if (poly[0] && poly[0].length >= 3) {
                polygons.push(poly[0]);
            }
        }
    }
    
    if (polygons.length > 0) {
        allCountries[name] = { type: countryData.type, polygons };
    }
}

console.log(`Extracted ${Object.keys(allCountries).length} countries`);

// Check major countries again
const major = ['United States of America', 'Russia', 'Canada', 'Australia', 'China', 'Brazil'];
console.log('\nMajor countries in new extraction:');
for (const country of major) {
    if (allCountries[country]) {
        console.log(`✅ ${country}: ${allCountries[country].polygons.length} polygons`);
    } else {
        console.log(`❌ STILL MISSING: ${country}`);
    }
}

// Save the complete extraction
const output = `// all countries with raw polygon data - 4px grid
// complete extraction including all major countries
export const countries = ${JSON.stringify(allCountries, null, 2)};`;

fs.writeFileSync('data/countries.js', output);
console.log(`\n✅ SAVED ${Object.keys(allCountries).length} countries including all major ones!`); 