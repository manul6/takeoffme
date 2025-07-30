const fs = require('fs');

// much finer grid for detailed circuit board paths
const FINE_GRID = 2; // 2px grid instead of 8px

// coordinate validation
function validateCoordinate(lon, lat, context = '') {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
}

// project and snap to fine grid
function projectAndSnapFine(lat, lon) {
    // equirectangular projection
    const x = (lon + 180) * (1000 / 360);
    const y = (90 - lat) * (500 / 180);
    
    // snap to fine grid
    return [
        Math.round(x / FINE_GRID) * FINE_GRID,
        Math.round(y / FINE_GRID) * FINE_GRID
    ];
}

// continent mapping with corrected country names from the data
const continentMapping = {
    // north america
    'United States of America': 'north_america',
    'Canada': 'north_america',
    'Mexico': 'north_america',
    'Guatemala': 'north_america',
    'Honduras': 'north_america',
    'Belize': 'north_america',
    'Nicaragua': 'north_america',
    'Costa Rica': 'north_america',
    'Panama': 'north_america',
    'Cuba': 'north_america',
    'Haiti': 'north_america',
    'Dominican Rep.': 'north_america',
    'Jamaica': 'north_america',
    'Bahamas': 'north_america',
    'El Salvador': 'north_america',
    'Puerto Rico': 'north_america',
    'Trinidad and Tobago': 'north_america',
    'Greenland': 'north_america',
    
    // south america
    'Brazil': 'south_america',
    'Argentina': 'south_america',
    'Peru': 'south_america',
    'Colombia': 'south_america',
    'Chile': 'south_america',
    'Venezuela': 'south_america',
    'Ecuador': 'south_america',
    'Bolivia': 'south_america',
    'Paraguay': 'south_america',
    'Uruguay': 'south_america',
    'Guyana': 'south_america',
    'Suriname': 'south_america',
    
    // europe
    'Russia': 'europe_asia', // spans both
    'Germany': 'europe',
    'France': 'europe',
    'United Kingdom': 'europe',
    'Italy': 'europe',
    'Spain': 'europe',
    'Poland': 'europe',
    'Romania': 'europe',
    'Netherlands': 'europe',
    'Belgium': 'europe',
    'Greece': 'europe',
    'Czechia': 'europe',
    'Portugal': 'europe',
    'Hungary': 'europe',
    'Sweden': 'europe',
    'Austria': 'europe',
    'Belarus': 'europe',
    'Switzerland': 'europe',
    'Bulgaria': 'europe',
    'Serbia': 'europe',
    'Denmark': 'europe',
    'Finland': 'europe',
    'Slovakia': 'europe',
    'Norway': 'europe',
    'Ireland': 'europe',
    'Croatia': 'europe',
    'Bosnia and Herz.': 'europe',
    'Albania': 'europe',
    'Lithuania': 'europe',
    'Slovenia': 'europe',
    'Latvia': 'europe',
    'Estonia': 'europe',
    'North Macedonia': 'europe',
    'Moldova': 'europe',
    'Luxembourg': 'europe',
    'Malta': 'europe',
    'Iceland': 'europe',
    'Ukraine': 'europe',
    'Montenegro': 'europe',
    'Kosovo': 'europe',
    'Cyprus': 'europe',
    'N. Cyprus': 'europe',
    
    // asia
    'China': 'asia',
    'India': 'asia',
    'Indonesia': 'asia',
    'Pakistan': 'asia',
    'Bangladesh': 'asia',
    'Japan': 'asia',
    'Philippines': 'asia',
    'Vietnam': 'asia',
    'Turkey': 'asia',
    'Iran': 'asia',
    'Thailand': 'asia',
    'Myanmar': 'asia',
    'South Korea': 'asia',
    'Iraq': 'asia',
    'Afghanistan': 'asia',
    'Saudi Arabia': 'asia',
    'Uzbekistan': 'asia',
    'Malaysia': 'asia',
    'Nepal': 'asia',
    'Yemen': 'asia',
    'North Korea': 'asia',
    'Kazakhstan': 'asia',
    'Syria': 'asia',
    'Cambodia': 'asia',
    'Jordan': 'asia',
    'Azerbaijan': 'asia',
    'United Arab Emirates': 'asia',
    'Tajikistan': 'asia',
    'Israel': 'asia',
    'Laos': 'asia',
    'Singapore': 'asia',
    'Oman': 'asia',
    'Kuwait': 'asia',
    'Georgia': 'asia',
    'Mongolia': 'asia',
    'Armenia': 'asia',
    'Qatar': 'asia',
    'Bahrain': 'asia',
    'Timor-Leste': 'asia',
    'Sri Lanka': 'asia',
    'Bhutan': 'asia',
    'Brunei': 'asia',
    'Maldives': 'asia',
    'Taiwan': 'asia',
    'Lebanon': 'asia',
    'Palestine': 'asia',
    'Kyrgyzstan': 'asia',
    'Turkmenistan': 'asia',
    
    // africa
    'Nigeria': 'africa',
    'Ethiopia': 'africa',
    'Egypt': 'africa',
    'Dem. Rep. Congo': 'africa',
    'Tanzania': 'africa',
    'South Africa': 'africa',
    'Kenya': 'africa',
    'Uganda': 'africa',
    'Algeria': 'africa',
    'Sudan': 'africa',
    'Morocco': 'africa',
    'Angola': 'africa',
    'Ghana': 'africa',
    'Mozambique': 'africa',
    'Madagascar': 'africa',
    'Cameroon': 'africa',
    'Côte d\'Ivoire': 'africa',
    'Niger': 'africa',
    'Burkina Faso': 'africa',
    'Mali': 'africa',
    'Malawi': 'africa',
    'Zambia': 'africa',
    'Senegal': 'africa',
    'Somalia': 'africa',
    'Chad': 'africa',
    'Zimbabwe': 'africa',
    'Guinea': 'africa',
    'Rwanda': 'africa',
    'Benin': 'africa',
    'Tunisia': 'africa',
    'Burundi': 'africa',
    'South Sudan': 'africa',
    'Togo': 'africa',
    'Sierra Leone': 'africa',
    'Libya': 'africa',
    'Liberia': 'africa',
    'Central African Rep.': 'africa',
    'Mauritania': 'africa',
    'Eritrea': 'africa',
    'Gambia': 'africa',
    'Botswana': 'africa',
    'Namibia': 'africa',
    'Gabon': 'africa',
    'Lesotho': 'africa',
    'Guinea-Bissau': 'africa',
    'Eq. Guinea': 'africa',
    'Mauritius': 'africa',
    'eSwatini': 'africa',
    'Djibouti': 'africa',
    'Comoros': 'africa',
    'Cape Verde': 'africa',
    'São Tomé and Príncipe': 'africa',
    'Seychelles': 'africa',
    'W. Sahara': 'africa',
    'Somaliland': 'africa',
    
    // oceania
    'Australia': 'oceania',
    'Papua New Guinea': 'oceania',
    'New Zealand': 'oceania',
    'Fiji': 'oceania',
    'Solomon Is.': 'oceania',
    'Vanuatu': 'oceania',
    'Samoa': 'oceania',
    'Micronesia': 'oceania',
    'Tonga': 'oceania',
    'Kiribati': 'oceania',
    'Palau': 'oceania',
    'Marshall Islands': 'oceania',
    'Tuvalu': 'oceania',
    'Nauru': 'oceania',
    'New Caledonia': 'oceania'
};

// douglas-peucker simplification with fine tolerance
function douglasPeucker(points, tolerance = 0.5) {
    if (points.length <= 2) return points;
    
    function perpDistance(point, lineStart, lineEnd) {
        const [x, y] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;
        
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        const param = dot / lenSq;
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function simplifyRecursive(points, start, end, tolerance) {
        let maxDist = 0;
        let index = 0;
        
        for (let i = start + 1; i < end; i++) {
            const dist = perpDistance(points[i], points[start], points[end]);
            if (dist > maxDist) {
                index = i;
                maxDist = dist;
            }
        }
        
        if (maxDist > tolerance) {
            const leftResult = simplifyRecursive(points, start, index, tolerance);
            const rightResult = simplifyRecursive(points, index, end, tolerance);
            return leftResult.slice(0, -1).concat(rightResult);
        } else {
            return [points[start], points[end]];
        }
    }
    
    return simplifyRecursive(points, 0, points.length - 1, tolerance);
}

async function extractRealContinents() {
    console.log('loading real country border data...');
    
    const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    const continentPolygons = {
        north_america: [],
        south_america: [],
        europe: [],
        asia: [],
        europe_asia: [],
        africa: [],
        oceania: []
    };
    
    let processedCount = 0;
    let totalPoints = 0;
    
    console.log(`processing ${data.metadata.total_countries} countries with fine ${FINE_GRID}px grid...`);
    
    for (const [countryName, countryData] of Object.entries(data.countries)) {
        const continent = continentMapping[countryName];
        if (!continent) {
            console.log(`unmapped country: ${countryName}`);
            continue;
        }
        
        try {
            let outerRings = [];
            
            if (countryData.type === 'polygon') {
                // for polygon, coordinates IS the outer ring
                outerRings = [countryData.coordinates];
            } else if (countryData.type === 'multipolygon') {
                // for multipolygon, each element in coordinates is a polygon
                // and we want the outer ring (first element) of each polygon
                for (const polygon of countryData.coordinates) {
                    outerRings.push(polygon[0]);
                }
            }
            
            for (const outerRing of outerRings) {
                if (!outerRing || outerRing.length < 3) continue;
                
                // validate, project and snap coordinates
                const projectedPoints = [];
                for (let i = 0; i < outerRing.length; i++) {
                    const [lon, lat] = outerRing[i];
                    validateCoordinate(lat, lon, `${countryName} point ${i}`);
                    
                    const [x, y] = projectAndSnapFine(lat, lon);
                    projectedPoints.push([x, y]);
                    totalPoints++;
                }
                
                // add to continent (we'll merge them later)
                if (projectedPoints.length >= 3) {
                    continentPolygons[continent].push(projectedPoints);
                }
            }
            
            processedCount++;
        } catch (error) {
            console.error(`error processing ${countryName}: ${error.message}`);
        }
    }
    
    console.log(`processed ${processedCount} countries with ${totalPoints} total points`);
    
    // now merge country polygons into continent outlines
    const continents = {};
    
    for (const [continent, polygons] of Object.entries(continentPolygons)) {
        if (polygons.length === 0) {
            continents[continent] = [];
            continue;
        }
        
        console.log(`merging ${polygons.length} polygons for ${continent}...`);
        
        // combine all points from all country polygons
        let allPoints = [];
        for (const polygon of polygons) {
            allPoints.push(...polygon);
        }
        
        // remove duplicate points (keep fine detail but remove exact duplicates)
        const uniquePoints = [];
        for (const point of allPoints) {
            const isDuplicate = uniquePoints.some(existing => 
                Math.abs(existing[0] - point[0]) < FINE_GRID && 
                Math.abs(existing[1] - point[1]) < FINE_GRID
            );
            if (!isDuplicate) {
                uniquePoints.push(point);
            }
        }
        
        // sort points to create a rough outline (by angle from centroid)
        if (uniquePoints.length > 0) {
            const centroidX = uniquePoints.reduce((sum, p) => sum + p[0], 0) / uniquePoints.length;
            const centroidY = uniquePoints.reduce((sum, p) => sum + p[1], 0) / uniquePoints.length;
            
            uniquePoints.sort((a, b) => {
                const angleA = Math.atan2(a[1] - centroidY, a[0] - centroidX);
                const angleB = Math.atan2(b[1] - centroidY, b[0] - centroidX);
                return angleA - angleB;
            });
        }
        
        // moderate simplification to keep detail but make it manageable
        let simplified = uniquePoints;
        if (uniquePoints.length > 300) {
            simplified = douglasPeucker(uniquePoints, 1.0);
        }
        if (simplified.length > 500) {
            // more aggressive simplification for very complex continents
            simplified = simplified.filter((_, i) => i % 2 === 0);
        }
        
        // convert back to [lon, lat] format for the continent data
        const lonLatPoints = simplified.map(([x, y]) => {
            const lon = (x / (1000 / 360)) - 180;
            const lat = 90 - (y / (500 / 180));
            return [lon, lat];
        });
        
        continents[continent] = lonLatPoints;
        console.log(`${continent}: ${continents[continent].length} points (fine grid)`);
    }
    
    return continents;
}

async function main() {
    try {
        const continents = await extractRealContinents();
        
        // write the high-detail continent data
        const continentsJs = `// real continent outlines from country polygon data with fine grid
// coordinates in [lon, lat] format, validated: lat ∈ [-90, 90], lon ∈ [-180, 180]
// extracted from actual country boundaries with ${FINE_GRID}px grid snapping
export const continents = ${JSON.stringify(continents, null, 2)};`;
        
        fs.writeFileSync('data/continents.js', continentsJs);
        console.log('wrote high-detail continent data to data/continents.js');
        
        console.log('real polygon extraction complete with fine grid!');
        
    } catch (error) {
        console.error('extraction failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 