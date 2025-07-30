const fs = require('fs');

// validation function for coordinates
function validateCoordinate(lon, lat, countryName, pointIndex) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`bad coordinate in ${countryName} point ${pointIndex}: lat=${lat}, lon=${lon}`);
    }
    // detect potential swapped coordinates (common error)
    if (Math.abs(lon) <= 90 && Math.abs(lat) <= 180 && Math.abs(lat) > Math.abs(lon)) {
        console.warn(`potential swapped coordinates in ${countryName}: lat=${lat}, lon=${lon}`);
    }
}

// simplified douglas-peucker algorithm for polygon simplification
function simplifyPolygon(points, tolerance = 2.0) {
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
    
    function douglasPeucker(points, start, end, tolerance) {
        let maxDist = 0;
        let index = 0;
        
        for (let i = start + 1; i < end; i++) {
            const dist = perpDistance(points[i], points[start], points[end]);
            if (dist > maxDist) {
                index = i;
                maxDist = dist;
            }
        }
        
        let result = [];
        if (maxDist > tolerance) {
            const leftResult = douglasPeucker(points, start, index, tolerance);
            const rightResult = douglasPeucker(points, index, end, tolerance);
            
            result = leftResult.slice(0, -1).concat(rightResult);
        } else {
            result = [points[start], points[end]];
        }
        
        return result;
    }
    
    return douglasPeucker(points, 0, points.length - 1, tolerance);
}

// continent grouping based on geographic regions (fixed names from data)
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

async function processCountryData() {
    console.log('loading country borders data...');
    
    const rawData = fs.readFileSync('country_borders_data.json.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    const continents = {
        north_america: [],
        south_america: [],
        europe: [],
        asia: [],
        europe_asia: [], // russia
        africa: [],
        oceania: []
    };
    
    let processedCount = 0;
    let totalPoints = 0;
    
    console.log(`processing ${data.metadata.total_countries} countries...`);
    
    for (const [countryName, countryData] of Object.entries(data.countries)) {
        const continent = continentMapping[countryName];
        if (!continent) {
            console.log(`unmapped country: ${countryName}`);
            continue;
        }
        
        try {
            let countryPolygons = [];
            
            if (countryData.type === 'polygon') {
                countryPolygons = [countryData.coordinates];
            } else if (countryData.type === 'multipolygon') {
                countryPolygons = countryData.coordinates;
            }
            
            for (const polygon of countryPolygons) {
                // take the outer ring (first element)
                const outerRing = polygon[0];
                if (!outerRing || outerRing.length < 3) continue;
                
                // validate and convert coordinates
                const validatedPoints = [];
                for (let i = 0; i < outerRing.length; i++) {
                    const [lon, lat] = outerRing[i];
                    validateCoordinate(lon, lat, countryName, i);
                    validatedPoints.push([lon, lat]);
                    totalPoints++;
                }
                
                // simplify the polygon
                const simplified = simplifyPolygon(validatedPoints, 1.5);
                
                if (simplified.length >= 3) {
                    continents[continent].push(...simplified);
                }
            }
            
            processedCount++;
        } catch (error) {
            console.error(`error processing ${countryName}: ${error.message}`);
        }
    }
    
    console.log(`processed ${processedCount} countries with ${totalPoints} total points`);
    
    // remove duplicate points and simplify continent outlines
    for (const [continent, points] of Object.entries(continents)) {
        if (points.length === 0) continue;
        
        // remove near-duplicate points
        const unique = [];
        for (const point of points) {
            const isDuplicate = unique.some(existing => 
                Math.abs(existing[0] - point[0]) < 0.1 && 
                Math.abs(existing[1] - point[1]) < 0.1
            );
            if (!isDuplicate) {
                unique.push(point);
            }
        }
        
        // limit to max 100 points per continent
        if (unique.length > 100) {
            const step = Math.floor(unique.length / 100);
            continents[continent] = unique.filter((_, i) => i % step === 0).slice(0, 100);
        } else {
            continents[continent] = unique;
        }
        
        console.log(`${continent}: ${continents[continent].length} points`);
    }
    
    return continents;
}

async function main() {
    try {
        const continents = await processCountryData();
        
        // write continents data
        const continentsJs = `// generated continent outlines with coordinate validation
export const continents = ${JSON.stringify(continents, null, 2)};`;
        
        fs.writeFileSync('data/continents.js', continentsJs);
        console.log('wrote data/continents.js');
        
        console.log('data processing complete!');
        
    } catch (error) {
        console.error('processing failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 