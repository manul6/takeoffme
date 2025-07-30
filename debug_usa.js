const fs = require('fs');

console.log('DEBUG: Why is USA missing?\n');

const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
const data = JSON.parse(rawData);

// Check if USA exists in source data
const usa = data.countries['United States of America'];
if (!usa) {
    console.log('❌ USA not found in source data at all!');
    
    // Search for alternative names
    const allCountries = Object.keys(data.countries);
    const usaVariants = allCountries.filter(name => 
        name.toLowerCase().includes('united') || 
        name.toLowerCase().includes('america') ||
        name.toLowerCase().includes('usa')
    );
    console.log('Possible USA variants:', usaVariants);
} else {
    console.log('✅ USA found in source data');
    console.log('Type:', usa.type);
    console.log('Coordinates array length:', usa.coordinates.length);
    
    if (usa.type === 'multipolygon') {
        console.log('Processing multipolygon...');
        let validPolygons = 0;
        for (let i = 0; i < usa.coordinates.length; i++) {
            const polygon = usa.coordinates[i];
            const outerRing = polygon[0];
            console.log(`Polygon ${i}: outer ring has ${outerRing ? outerRing.length : 'NULL'} points`);
            if (outerRing && outerRing.length >= 3) {
                validPolygons++;
            }
        }
        console.log(`Valid polygons: ${validPolygons}`);
    }
}

// Check Russia too
console.log('\n--- RUSSIA ---');
const russia = data.countries['Russia'];
if (!russia) {
    console.log('❌ Russia not found!');
    const russiaVariants = Object.keys(data.countries).filter(name => 
        name.toLowerCase().includes('russia')
    );
    console.log('Russia variants:', russiaVariants);
} else {
    console.log('✅ Russia found');
    console.log('Type:', russia.type);
    console.log('Coordinates:', russia.coordinates ? 'YES' : 'NO');
}

// Check Canada
console.log('\n--- CANADA ---');
const canada = data.countries['Canada'];
if (!canada) {
    console.log('❌ Canada not found!');
} else {
    console.log('✅ Canada found');
    console.log('Type:', canada.type);
    console.log('Coordinates:', canada.coordinates ? 'YES' : 'NO');
}

// Now try manual extraction of USA
if (usa) {
    console.log('\n=== MANUAL USA EXTRACTION ===');
    const polygons = [];
    
    if (usa.type === 'multipolygon') {
        for (const poly of usa.coordinates) {
            const outerRing = poly[0];
            if (outerRing && outerRing.length >= 3) {
                polygons.push(outerRing);
                console.log(`Added polygon with ${outerRing.length} points`);
            }
        }
    }
    
    if (polygons.length > 0) {
        console.log(`✅ Successfully extracted USA with ${polygons.length} polygons!`);
        
        // Test save just USA
        const testUSA = {
            'United States of America': {
                type: usa.type,
                polygons: polygons
            }
        };
        
        const output = `export const countries = ${JSON.stringify(testUSA, null, 2)};`;
        fs.writeFileSync('test_usa.js', output);
        console.log('Saved test USA file');
    } else {
        console.log('❌ Failed to extract USA polygons');
    }
} 