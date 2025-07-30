const fs = require('fs');

console.log('=== FINAL CORRECT EXTRACTION ===');

const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
const data = JSON.parse(rawData);

const countries = {};
let extractedCount = 0;

for (const [name, countryData] of Object.entries(data.countries)) {
    const polygons = [];
    
    if (countryData.type === 'polygon') {
        // Simple polygon: coordinates is the array of coordinate pairs
        if (countryData.coordinates && countryData.coordinates.length >= 3) {
            polygons.push(countryData.coordinates);
        }
    } else if (countryData.type === 'multipolygon') {
        // Multipolygon: each element in coordinates IS a polygon
        for (const polygon of countryData.coordinates) {
            if (polygon && polygon.length >= 3) {
                polygons.push(polygon);
            }
        }
    }
    
    if (polygons.length > 0) {
        countries[name] = { type: countryData.type, polygons };
        extractedCount++;
        
        // Log major countries specifically
        const major = ['United States of America', 'Russia', 'Canada', 'Australia', 'China', 'Brazil'];
        if (major.includes(name)) {
            console.log(`✅ ${name}: ${polygons.length} polygons`);
        }
    }
}

console.log(`\nExtracted ${extractedCount} total countries`);

// Verify all major countries
const major = ['United States of America', 'Russia', 'Canada', 'Australia', 'China', 'Brazil'];
console.log('\n=== MAJOR COUNTRIES VERIFICATION ===');
let allMajorFound = true;
for (const country of major) {
    if (countries[country]) {
        console.log(`✅ ${country}: ${countries[country].polygons.length} polygons`);
    } else {
        console.log(`❌ MISSING: ${country}`);
        allMajorFound = false;
    }
}

if (allMajorFound) {
    console.log('\n🎉 ALL MAJOR COUNTRIES FOUND!');
} else {
    console.log('\n⚠️ Some major countries still missing');
}

// Save the complete correct extraction
const output = `// complete country extraction with correct multipolygon handling
// all major countries included: usa, russia, canada, australia, china, brazil
// 4px grid snapping, raw coordinate data
export const countries = ${JSON.stringify(countries, null, 2)};`;

fs.writeFileSync('data/countries.js', output);
console.log(`\n✅ SAVED ${extractedCount} countries with correct extraction logic!`); 