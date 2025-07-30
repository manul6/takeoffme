// major international airports with iata codes and coordinates
// coordinates validated: lat ∈ [-90, 90], lon ∈ [-180, 180]

function validateAirportCoordinate(code, lat, lon) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`bad airport coordinate for ${code}: lat=${lat}, lon=${lon}`);
    }
}

const airportData = {
    // north america
    'JFK': { name: 'john f kennedy intl', city: 'new york', lat: 40.6413, lon: -73.7781 },
    'LAX': { name: 'los angeles intl', city: 'los angeles', lat: 33.9425, lon: -118.4081 },
    'ORD': { name: 'o\'hare intl', city: 'chicago', lat: 41.9742, lon: -87.9073 },
    'DFW': { name: 'dallas fort worth intl', city: 'dallas', lat: 32.8998, lon: -97.0403 },
    'DEN': { name: 'denver intl', city: 'denver', lat: 39.8561, lon: -104.6737 },
    'SFO': { name: 'san francisco intl', city: 'san francisco', lat: 37.6213, lon: -122.3790 },
    'SEA': { name: 'seattle tacoma intl', city: 'seattle', lat: 47.4502, lon: -122.3088 },
    'YYZ': { name: 'toronto pearson intl', city: 'toronto', lat: 43.6777, lon: -79.6248 },
    'YVR': { name: 'vancouver intl', city: 'vancouver', lat: 49.1939, lon: -123.1844 },
    'MEX': { name: 'mexico city intl', city: 'mexico city', lat: 19.4363, lon: -99.0721 },
    'CUN': { name: 'cancun intl', city: 'cancun', lat: 21.0365, lon: -86.8771 },
    
    // south america
    'GRU': { name: 'guarulhos intl', city: 'sao paulo', lat: -23.4356, lon: -46.4731 },
    'GIG': { name: 'rio de janeiro intl', city: 'rio de janeiro', lat: -22.8099, lon: -43.2431 },
    'EZE': { name: 'ezeiza intl', city: 'buenos aires', lat: -34.8222, lon: -58.5358 },
    'SCL': { name: 'santiago intl', city: 'santiago', lat: -33.3930, lon: -70.7854 },
    'BOG': { name: 'el dorado intl', city: 'bogota', lat: 4.7016, lon: -74.1469 },
    'LIM': { name: 'jorge chavez intl', city: 'lima', lat: -12.0219, lon: -77.1143 },
    'CCS': { name: 'simon bolivar intl', city: 'caracas', lat: 10.6013, lon: -66.9911 },
    
    // europe
    'LHR': { name: 'heathrow', city: 'london', lat: 51.4700, lon: -0.4543 },
    'CDG': { name: 'charles de gaulle', city: 'paris', lat: 49.0097, lon: 2.5479 },
    'FRA': { name: 'frankfurt am main', city: 'frankfurt', lat: 50.0379, lon: 8.5622 },
    'AMS': { name: 'amsterdam schiphol', city: 'amsterdam', lat: 52.3105, lon: 4.7683 },
    'MAD': { name: 'adolfo suarez madrid barajas', city: 'madrid', lat: 40.4839, lon: -3.5680 },
    'FCO': { name: 'leonardo da vinci fiumicino', city: 'rome', lat: 41.8003, lon: 12.2389 },
    'MUC': { name: 'munich', city: 'munich', lat: 48.3537, lon: 11.7750 },
    'ZUR': { name: 'zurich', city: 'zurich', lat: 47.4647, lon: 8.5492 },
    'VIE': { name: 'vienna intl', city: 'vienna', lat: 48.1103, lon: 16.5697 },
    'CPH': { name: 'copenhagen', city: 'copenhagen', lat: 55.6181, lon: 12.6561 },
    'ARN': { name: 'stockholm arlanda', city: 'stockholm', lat: 59.6519, lon: 17.9186 },
    'HEL': { name: 'helsinki vantaa', city: 'helsinki', lat: 60.3172, lon: 24.9633 },
    'IST': { name: 'istanbul', city: 'istanbul', lat: 41.2753, lon: 28.7519 },
    'SVO': { name: 'sheremetyevo intl', city: 'moscow', lat: 55.9726, lon: 37.4146 },
    
    // asia
    'NRT': { name: 'narita intl', city: 'tokyo', lat: 35.7719, lon: 140.3929 },
    'HND': { name: 'haneda', city: 'tokyo', lat: 35.5494, lon: 139.7798 },
    'ICN': { name: 'incheon intl', city: 'seoul', lat: 37.4602, lon: 126.4407 },
    'PEK': { name: 'beijing capital intl', city: 'beijing', lat: 40.0801, lon: 116.5846 },
    'PVG': { name: 'shanghai pudong intl', city: 'shanghai', lat: 31.1443, lon: 121.8083 },
    'HKG': { name: 'hong kong intl', city: 'hong kong', lat: 22.3080, lon: 113.9185 },
    'SIN': { name: 'changi', city: 'singapore', lat: 1.3644, lon: 103.9915 },
    'BKK': { name: 'suvarnabhumi', city: 'bangkok', lat: 13.6900, lon: 100.7501 },
    'KUL': { name: 'kuala lumpur intl', city: 'kuala lumpur', lat: 2.7456, lon: 101.7072 },
    'CGK': { name: 'soekarno hatta intl', city: 'jakarta', lat: -6.1275, lon: 106.6537 },
    'DEL': { name: 'indira gandhi intl', city: 'new delhi', lat: 28.5562, lon: 77.1000 },
    'BOM': { name: 'chhatrapati shivaji maharaj intl', city: 'mumbai', lat: 19.0896, lon: 72.8656 },
    'DXB': { name: 'dubai intl', city: 'dubai', lat: 25.2532, lon: 55.3657 },
    'DOH': { name: 'hamad intl', city: 'doha', lat: 25.2731, lon: 51.6080 },
    'KWI': { name: 'kuwait intl', city: 'kuwait city', lat: 29.2267, lon: 47.9689 },
    'RUH': { name: 'king khalid intl', city: 'riyadh', lat: 24.9576, lon: 46.6988 },
    'TLV': { name: 'ben gurion', city: 'tel aviv', lat: 32.0055, lon: 34.8854 },
    
    // africa
    'CAI': { name: 'cairo intl', city: 'cairo', lat: 30.1219, lon: 31.4056 },
    'JNB': { name: 'o r tambo intl', city: 'johannesburg', lat: -26.1367, lon: 28.2411 },
    'CPT': { name: 'cape town intl', city: 'cape town', lat: -33.9689, lon: 18.6017 },
    'LOS': { name: 'murtala muhammed intl', city: 'lagos', lat: 6.5774, lon: 3.3212 },
    'NBO': { name: 'jomo kenyatta intl', city: 'nairobi', lat: -1.3192, lon: 36.9278 },
    'CMN': { name: 'mohammed v intl', city: 'casablanca', lat: 33.3675, lon: -7.5898 },
    'ADD': { name: 'addis ababa bole intl', city: 'addis ababa', lat: 8.9806, lon: 38.7992 },
    'DAR': { name: 'julius nyerere intl', city: 'dar es salaam', lat: -6.8781, lon: 39.2026 },
    'TNR': { name: 'ivato', city: 'antananarivo', lat: -18.7969, lon: 47.4788 },
    
    // oceania  
    'SYD': { name: 'kingsford smith', city: 'sydney', lat: -33.9399, lon: 151.1753 },
    'MEL': { name: 'melbourne', city: 'melbourne', lat: -37.6690, lon: 144.8410 },
    'BNE': { name: 'brisbane', city: 'brisbane', lat: -27.3942, lon: 153.1218 },
    'PER': { name: 'perth', city: 'perth', lat: -31.9403, lon: 115.9669 },
    'AKL': { name: 'auckland', city: 'auckland', lat: -36.8485, lon: 174.7633 },
    'CHC': { name: 'christchurch', city: 'christchurch', lat: -43.4866, lon: 172.5320 },
    'NAN': { name: 'nadi intl', city: 'nadi', lat: -17.7554, lon: 177.4430 },
    'PPT': { name: 'faa\'a intl', city: 'tahiti', lat: -17.5537, lon: -149.6060 }
};

// validate all airport coordinates
for (const [code, airport] of Object.entries(airportData)) {
    try {
        validateAirportCoordinate(code, airport.lat, airport.lon);
    } catch (error) {
        console.error(`airport validation failed: ${error.message}`);
        delete airportData[code];
    }
}

export const airports = airportData; 