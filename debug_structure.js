const fs = require('fs');

const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
const data = JSON.parse(rawData);

const usa = data.countries['United States of America'];

console.log('=== USA STRUCTURE ANALYSIS ===');
console.log('Type:', usa.type);
console.log('Coordinates array length:', usa.coordinates.length);

// Look at the first polygon in detail
console.log('\n--- FIRST POLYGON ANALYSIS ---');
const firstPolygon = usa.coordinates[0];
console.log('First polygon structure:');
console.log('- Is array?', Array.isArray(firstPolygon));
console.log('- Length:', firstPolygon.length);

if (Array.isArray(firstPolygon)) {
    console.log('- First element is array?', Array.isArray(firstPolygon[0]));
    console.log('- First element length:', firstPolygon[0] ? firstPolygon[0].length : 'NULL');
    
    if (firstPolygon[0] && Array.isArray(firstPolygon[0])) {
        console.log('- First coordinate pair:', firstPolygon[0][0]);
        console.log('- Second coordinate pair:', firstPolygon[0][1]);
        console.log('- Third coordinate pair:', firstPolygon[0][2]);
    }
}

// Check if it's actually the coordinate pairs directly
console.log('\n--- COORDINATE ANALYSIS ---');
console.log('Sample of first few items:');
for (let i = 0; i < Math.min(5, firstPolygon.length); i++) {
    console.log(`Item ${i}:`, firstPolygon[i]);
}

// Test correct extraction
console.log('\n=== CORRECT EXTRACTION TEST ===');
let totalExtracted = 0;

for (let i = 0; i < usa.coordinates.length; i++) {
    const polygon = usa.coordinates[i];
    
    // Try different interpretations of the structure
    console.log(`\nPolygon ${i}:`);
    console.log('Direct length:', polygon.length);
    
    if (polygon.length >= 3) {
        console.log(`✅ Polygon ${i} has ${polygon.length} points directly`);
        totalExtracted++;
    } else if (polygon[0] && Array.isArray(polygon[0]) && polygon[0].length >= 3) {
        console.log(`✅ Polygon ${i} has ${polygon[0].length} points in nested array`);
        totalExtracted++;
    }
}

console.log(`\nTotal extractable polygons: ${totalExtracted}`);

// Try extraction with correct structure
if (totalExtracted > 0) {
    console.log('\n=== SUCCESSFUL EXTRACTION ===');
    const polygons = [];
    
    for (const polygon of usa.coordinates) {
        if (polygon.length >= 3) {
            // Direct coordinate array
            polygons.push(polygon);
        } else if (polygon[0] && Array.isArray(polygon[0]) && polygon[0].length >= 3) {
            // Nested array
            polygons.push(polygon[0]);
        }
    }
    
    console.log(`Extracted ${polygons.length} USA polygons!`);
    
    // Save successful extraction
    const usaCountry = {
        'United States of America': {
            type: 'multipolygon',
            polygons: polygons
        }
    };
    
    const output = `export const countries = ${JSON.stringify(usaCountry, null, 2)};`;
    fs.writeFileSync('test_usa_success.js', output);
    console.log('✅ Saved successful USA extraction!');
} 