const fs = require('fs');

// coordinate validation
function validateCoordinate(lon, lat, context = '') {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`invalid coordinate ${context}: lat=${lat}, lon=${lon}`);
    }
}

// simplified continent shapes based on key geographic features
function createRealisticContinents() {
    const continents = {
        north_america: [
            // alaska and northern canada
            [-168, 65], [-156, 71], [-140, 69], [-120, 69], [-110, 60],
            // western coast down to mexico
            [-125, 50], [-124, 45], [-120, 35], [-117, 32], [-115, 29], [-110, 25],
            // gulf of mexico and florida
            [-97, 25], [-94, 29], [-90, 30], [-85, 25], [-80, 25], [-80, 27],
            // eastern seaboard
            [-75, 35], [-70, 41], [-67, 45], [-66, 47], [-70, 47],
            // great lakes and eastern canada
            [-79, 43], [-82, 46], [-85, 47], [-90, 48], [-95, 49],
            // northern border back to alaska
            [-100, 49], [-110, 60], [-125, 60], [-140, 65], [-168, 65]
        ],
        
        south_america: [
            // northern coast (venezuela, guyana, brazil)
            [-70, 12], [-60, 8], [-55, 5], [-50, 0], [-48, -5],
            // eastern brazil coast
            [-45, -15], [-40, -20], [-35, -25], [-38, -35],
            // southern tip and western coast
            [-48, -45], [-58, -55], [-68, -55], [-75, -50],
            // chile coast up to peru
            [-70, -45], [-70, -35], [-75, -25], [-80, -15], [-81, -5],
            // colombia and back to start
            [-78, 0], [-75, 8], [-70, 12]
        ],
        
        europe: [
            // scandinavia
            [-5, 60], [5, 71], [15, 71], [25, 70], [30, 69],
            // russia/eastern europe
            [40, 60], [50, 55], [45, 50], [40, 45],
            // southern europe
            [35, 40], [25, 35], [15, 37], [5, 40], [0, 43], [-5, 43],
            // iberian peninsula
            [-9, 42], [-9, 37], [-5, 36], [0, 37], [5, 40],
            // back to scandinavia
            [-5, 45], [-5, 60]
        ],
        
        asia: [
            // eastern siberia
            [40, 70], [60, 75], [80, 77], [120, 75], [140, 72], [170, 70],
            // far east coast
            [180, 65], [175, 60], [160, 50], [140, 45], [130, 35],
            // southeast asia
            [120, 25], [110, 10], [105, 0], [100, -5], [95, -10],
            // india
            [68, 8], [70, 25], [75, 30], [80, 25], [85, 20],
            // central asia and siberia
            [90, 35], [100, 50], [80, 55], [60, 60], [40, 65], [40, 70]
        ],
        
        africa: [
            // mediterranean coast
            [-17, 35], [-5, 36], [10, 37], [25, 32], [35, 32],
            // red sea and horn of africa
            [43, 15], [48, 10], [45, 0], [42, -5],
            // east coast down to cape
            [40, -15], [35, -25], [30, -30], [25, -34], [18, -35],
            // cape and western coast
            [15, -32], [10, -25], [8, -15], [5, -5], [0, 10],
            // west coast up to morocco
            [-5, 20], [-10, 25], [-15, 30], [-17, 35]
        ],
        
        oceania: [
            // australia
            [113, -35], [130, -35], [140, -37], [150, -35], [154, -28],
            [153, -25], [145, -20], [140, -15], [130, -12], [120, -15],
            [113, -20], [110, -25], [113, -35],
            // new zealand (simplified)
            [165, -35], [170, -40], [175, -45], [170, -47], [165, -45], [165, -35]
        ]
    };
    
    return continents;
}

// douglas-peucker simplification for smoother circuit board paths
function douglasPeucker(points, tolerance = 2.0) {
    if (points.length <= 2) return points;
    
    function perpDistanceToLine(point, lineStart, lineEnd) {
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
            const dist = perpDistanceToLine(points[i], points[start], points[end]);
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

function main() {
    console.log('creating realistic continent outlines...');
    
    const continents = createRealisticContinents();
    
    // validate and process each continent
    for (const [name, coords] of Object.entries(continents)) {
        console.log(`processing ${name}...`);
        
        // validate coordinates
        for (let i = 0; i < coords.length; i++) {
            const [lon, lat] = coords[i];
            validateCoordinate(lon, lat, `${name} point ${i}`);
        }
        
        // simplify if needed (keep under 100 points)
        if (coords.length > 100) {
            continents[name] = douglasPeucker(coords, 1.5).slice(0, 100);
        }
        
        console.log(`${name}: ${continents[name].length} points`);
    }
    
    // write the improved continent data
    const continentsJs = `// realistic continent outlines with coordinate validation
// coordinates in [lon, lat] format, validated: lat ∈ [-90, 90], lon ∈ [-180, 180]
// simplified but recognizable geographic shapes for circuit board aesthetic
export const continents = ${JSON.stringify(continents, null, 4)};`;
    
    fs.writeFileSync('data/continents.js', continentsJs);
    console.log('wrote improved continent data to data/continents.js');
    console.log('continents should now be much more recognizable!');
}

if (require.main === module) {
    main();
} 