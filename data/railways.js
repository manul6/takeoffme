// precise railway track data with detailed waypoints following actual routes
// coordinates validated: lat ∈ [-90, 90], lon ∈ [-180, 180]
// includes major railway corridors, high-speed lines, and historic routes

export const railwayStations = {
    // Europe - High Speed Rail Network
    'LGV': { name: 'paris gare de lyon', city: 'paris', country: 'FR', lat: 48.8441, lon: 2.3737, type: 'high_speed' },
    'KXX': { name: 'london king\'s cross', city: 'london', country: 'GB', lat: 51.5308, lon: -0.1238, type: 'high_speed' },
    'AMS': { name: 'amsterdam centraal', city: 'amsterdam', country: 'NL', lat: 52.3791, lon: 4.9003, type: 'high_speed' },
    'BXL': { name: 'brussels midi', city: 'brussels', country: 'BE', lat: 50.8356, lon: 4.3369, type: 'high_speed' },
    'CLK': { name: 'calais frethun', city: 'calais', country: 'FR', lat: 50.9218, lon: 1.9450, type: 'high_speed' },
    'LIL': { name: 'lille europe', city: 'lille', country: 'FR', lat: 50.6389, lon: 3.0756, type: 'high_speed' },
    'FRA': { name: 'frankfurt hauptbahnhof', city: 'frankfurt', country: 'DE', lat: 50.1070, lon: 8.6625, type: 'high_speed' },
    'COL': { name: 'koln hauptbahnhof', city: 'cologne', country: 'DE', lat: 50.9430, lon: 6.9589, type: 'high_speed' },
    'MUC': { name: 'munich hauptbahnhof', city: 'munich', country: 'DE', lat: 48.1401, lon: 11.5583, type: 'high_speed' },
    'ZUR': { name: 'zurich hauptbahnhof', city: 'zurich', country: 'CH', lat: 47.3782, lon: 8.5402, type: 'high_speed' },
    'MIL': { name: 'milano centrale', city: 'milan', country: 'IT', lat: 45.4865, lon: 9.2051, type: 'high_speed' },
    'FLO': { name: 'firenze santa maria novella', city: 'florence', country: 'IT', lat: 43.7763, lon: 11.2477, type: 'high_speed' },
    'ROM': { name: 'roma termini', city: 'rome', country: 'IT', lat: 41.9010, lon: 12.5015, type: 'high_speed' },
    'NAP': { name: 'napoli centrale', city: 'naples', country: 'IT', lat: 40.8530, lon: 14.2767, type: 'high_speed' },
    'MAD': { name: 'madrid atocha', city: 'madrid', country: 'ES', lat: 40.4066, lon: -3.6906, type: 'high_speed' },
    'BCN': { name: 'barcelona sants', city: 'barcelona', country: 'ES', lat: 41.3794, lon: 2.1404, type: 'high_speed' },
    'VAL': { name: 'valencia joaquin sorolla', city: 'valencia', country: 'ES', lat: 39.4666, lon: -0.3774, type: 'high_speed' },
    'SEV': { name: 'sevilla santa justa', city: 'sevilla', country: 'ES', lat: 37.3920, lon: -5.9756, type: 'high_speed' },
    
    // Asia - High Speed Rail Networks
    'TYO': { name: 'tokyo station', city: 'tokyo', country: 'JP', lat: 35.6812, lon: 139.7671, type: 'high_speed' },
    'OSA': { name: 'shin-osaka', city: 'osaka', country: 'JP', lat: 34.7326, lon: 135.5001, type: 'high_speed' },
    'KYO': { name: 'kyoto station', city: 'kyoto', country: 'JP', lat: 34.9856, lon: 135.7581, type: 'high_speed' },
    'NGY': { name: 'nagoya station', city: 'nagoya', country: 'JP', lat: 35.1706, lon: 136.8816, type: 'high_speed' },
    'SND': { name: 'sendai station', city: 'sendai', country: 'JP', lat: 38.2606, lon: 140.8819, type: 'high_speed' },
    'FUK': { name: 'hakata station', city: 'fukuoka', country: 'JP', lat: 33.5904, lon: 130.4206, type: 'high_speed' },
    
    // China High Speed Rail
    'BJS': { name: 'beijing south', city: 'beijing', country: 'CN', lat: 39.8651, lon: 116.3780, type: 'high_speed' },
    'TJN': { name: 'tianjin west', city: 'tianjin', country: 'CN', lat: 39.1368, lon: 117.1655, type: 'high_speed' },
    'JIN': { name: 'jinan west', city: 'jinan', country: 'CN', lat: 36.6512, lon: 116.9044, type: 'high_speed' },
    'NJG': { name: 'nanjing south', city: 'nanjing', country: 'CN', lat: 31.9557, lon: 118.7196, type: 'high_speed' },
    'SHA': { name: 'shanghai hongqiao', city: 'shanghai', country: 'CN', lat: 31.1979, lon: 121.3215, type: 'high_speed' },
    'HZH': { name: 'hangzhou east', city: 'hangzhou', country: 'CN', lat: 30.2905, lon: 120.2103, type: 'high_speed' },
    'WUH': { name: 'wuhan station', city: 'wuhan', country: 'CN', lat: 30.6086, lon: 114.4234, type: 'high_speed' },
    'CAN': { name: 'guangzhou south', city: 'guangzhou', country: 'CN', lat: 22.9906, lon: 113.2740, type: 'high_speed' },
    'SHZ': { name: 'shenzhen north', city: 'shenzhen', country: 'CN', lat: 22.6107, lon: 114.0244, type: 'high_speed' },
    'HKG': { name: 'hong kong west kowloon', city: 'hong kong', country: 'HK', lat: 22.3045, lon: 114.1656, type: 'high_speed' },
    
    // Korea
    'SEL': { name: 'seoul station', city: 'seoul', country: 'KR', lat: 37.5547, lon: 126.9706, type: 'high_speed' },
    'DJN': { name: 'daejeon station', city: 'daejeon', country: 'KR', lat: 36.3518, lon: 127.3849, type: 'high_speed' },
    'DGU': { name: 'daegu station', city: 'daegu', country: 'KR', lat: 35.8794, lon: 128.6294, type: 'high_speed' },
    'PUS': { name: 'busan station', city: 'busan', country: 'KR', lat: 35.1158, lon: 129.0403, type: 'high_speed' },
    
    // North America - Passenger Rail
    'NYP': { name: 'new york penn station', city: 'new york', country: 'US', lat: 40.7505, lon: -73.9934, type: 'intercity' },
    'PHL': { name: 'philadelphia 30th street', city: 'philadelphia', country: 'US', lat: 39.9566, lon: -75.1820, type: 'intercity' },
    'BAL': { name: 'baltimore penn station', city: 'baltimore', country: 'US', lat: 39.3078, lon: -76.6157, type: 'intercity' },
    'WAS': { name: 'washington union station', city: 'washington dc', country: 'US', lat: 38.8973, lon: -77.0063, type: 'intercity' },
    'RIC': { name: 'richmond staples mill', city: 'richmond', country: 'US', lat: 37.5976, lon: -77.4756, type: 'intercity' },
    'BOS': { name: 'boston south station', city: 'boston', country: 'US', lat: 42.3522, lon: -71.0552, type: 'intercity' },
    'CHI': { name: 'chicago union station', city: 'chicago', country: 'US', lat: 41.8796, lon: -87.6395, type: 'intercity' },
    'LAX': { name: 'los angeles union station', city: 'los angeles', country: 'US', lat: 34.0559, lon: -118.2368, type: 'intercity' },
    'SFO': { name: 'san francisco caltrain', city: 'san francisco', country: 'US', lat: 37.7760, lon: -122.3942, type: 'intercity' },
    'SEA': { name: 'seattle king street station', city: 'seattle', country: 'US', lat: 47.5990, lon: -122.3301, type: 'intercity' },
    'POR': { name: 'portland union station', city: 'portland', country: 'US', lat: 45.5289, lon: -122.6764, type: 'intercity' },
    
    // Canada
    'TOR': { name: 'toronto union station', city: 'toronto', country: 'CA', lat: 43.6452, lon: -79.3806, type: 'intercity' },
    'OTT': { name: 'ottawa station', city: 'ottawa', country: 'CA', lat: 45.4165, lon: -75.6516, type: 'intercity' },
    'MTL': { name: 'montreal central station', city: 'montreal', country: 'CA', lat: 45.4954, lon: -73.5665, type: 'intercity' },
    'VAN': { name: 'vancouver pacific central', city: 'vancouver', country: 'CA', lat: 49.2736, lon: -123.0977, type: 'intercity' },
    'CAL': { name: 'calgary station', city: 'calgary', country: 'CA', lat: 51.0447, lon: -114.0719, type: 'intercity' },
    'EDM': { name: 'edmonton station', city: 'edmonton', country: 'CA', lat: 53.5461, lon: -113.4938, type: 'intercity' },
    'WIN': { name: 'winnipeg union station', city: 'winnipeg', country: 'CA', lat: 49.8951, lon: -97.1384, type: 'intercity' },
    
    // Russian Railway Network
    'MOW': { name: 'moscow yaroslavsky', city: 'moscow', country: 'RU', lat: 55.7763, lon: 37.6555, type: 'intercity' },
    'SPB': { name: 'st petersburg moskovsky', city: 'st petersburg', country: 'RU', lat: 59.9311, lon: 30.3609, type: 'high_speed' },
    'PTZ': { name: 'petrozavodsk station', city: 'petrozavodsk', country: 'RU', lat: 61.7849, lon: 34.3469, type: 'intercity' },
    'TUL': { name: 'tula station', city: 'tula', country: 'RU', lat: 54.2045, lon: 37.6156, type: 'intercity' },
    'VOR': { name: 'voronezh station', city: 'voronezh', country: 'RU', lat: 51.6720, lon: 39.2106, type: 'intercity' },
    'KRD': { name: 'krasnodar station', city: 'krasnodar', country: 'RU', lat: 45.0355, lon: 38.9753, type: 'intercity' },
    'SOC': { name: 'sochi station', city: 'sochi', country: 'RU', lat: 43.6028, lon: 39.7342, type: 'intercity' },
    
    // Trans-Siberian Railway
    'KZN': { name: 'kazan station', city: 'kazan', country: 'RU', lat: 55.7887, lon: 49.1221, type: 'intercity' },
    'YEK': { name: 'yekaterinburg station', city: 'yekaterinburg', country: 'RU', lat: 56.8579, lon: 60.6050, type: 'intercity' },
    'TYM': { name: 'tyumen station', city: 'tyumen', country: 'RU', lat: 57.1612, lon: 65.5346, type: 'intercity' },
    'OMS': { name: 'omsk station', city: 'omsk', country: 'RU', lat: 54.9924, lon: 73.3686, type: 'intercity' },
    'NOV': { name: 'novosibirsk glavny', city: 'novosibirsk', country: 'RU', lat: 55.0415, lon: 82.9346, type: 'intercity' },
    'KRS': { name: 'krasnoyarsk station', city: 'krasnoyarsk', country: 'RU', lat: 56.0184, lon: 92.8672, type: 'intercity' },
    'IRK': { name: 'irkutsk station', city: 'irkutsk', country: 'RU', lat: 52.2596, lon: 104.3058, type: 'intercity' },
    'ULN': { name: 'ulan-ude station', city: 'ulan-ude', country: 'RU', lat: 51.8280, lon: 107.5856, type: 'intercity' },
    'CHT': { name: 'chita station', city: 'chita', country: 'RU', lat: 52.0568, lon: 113.4856, type: 'intercity' },
    'KHB': { name: 'khabarovsk station', city: 'khabarovsk', country: 'RU', lat: 48.4827, lon: 135.0940, type: 'intercity' },
    'VLV': { name: 'vladivostok station', city: 'vladivostok', country: 'RU', lat: 43.1056, lon: 131.8735, type: 'intercity' },
    
    // India Railways
    'DEL': { name: 'new delhi station', city: 'delhi', country: 'IN', lat: 28.6431, lon: 77.2197, type: 'intercity' },
    'AGR': { name: 'agra cantt', city: 'agra', country: 'IN', lat: 27.1767, lon: 78.0081, type: 'intercity' },
    'BOM': { name: 'mumbai central', city: 'mumbai', country: 'IN', lat: 18.9690, lon: 72.8205, type: 'intercity' },
    'CCU': { name: 'kolkata howrah', city: 'kolkata', country: 'IN', lat: 22.5958, lon: 88.3424, type: 'intercity' },
    'MAA': { name: 'chennai central', city: 'chennai', country: 'IN', lat: 13.0827, lon: 80.2707, type: 'intercity' },
    'BLR': { name: 'bangalore city', city: 'bangalore', country: 'IN', lat: 12.9716, lon: 77.5946, type: 'intercity' },
    'HYD': { name: 'hyderabad deccan', city: 'hyderabad', country: 'IN', lat: 17.3850, lon: 78.4867, type: 'intercity' },
    'AMD': { name: 'ahmedabad junction', city: 'ahmedabad', country: 'IN', lat: 23.0225, lon: 72.5714, type: 'intercity' },
    
    // Australia
    'SYD': { name: 'sydney central station', city: 'sydney', country: 'AU', lat: -33.8830, lon: 151.2061, type: 'intercity' },
    'MEL': { name: 'melbourne southern cross', city: 'melbourne', country: 'AU', lat: -37.8183, lon: 144.9525, type: 'intercity' },
    'BNE': { name: 'brisbane central', city: 'brisbane', country: 'AU', lat: -27.4659, lon: 153.0281, type: 'intercity' },
    'PER': { name: 'perth station', city: 'perth', country: 'AU', lat: -31.9505, lon: 115.8605, type: 'intercity' },
    'ADL': { name: 'adelaide station', city: 'adelaide', country: 'AU', lat: -34.9285, lon: 138.6007, type: 'intercity' },
    'ALB': { name: 'albury station', city: 'albury', country: 'AU', lat: -36.0737, lon: 146.9135, type: 'intercity' },
    'KAL': { name: 'kalgoorlie station', city: 'kalgoorlie', country: 'AU', lat: -30.7494, lon: 121.4656, type: 'intercity' },
    
    // South America
    'SAO': { name: 'sao paulo luz', city: 'sao paulo', country: 'BR', lat: -23.5344, lon: -46.6356, type: 'intercity' },
    'RIO': { name: 'rio central do brasil', city: 'rio de janeiro', country: 'BR', lat: -22.9035, lon: -43.2096, type: 'intercity' },
    'BUE': { name: 'buenos aires retiro', city: 'buenos aires', country: 'AR', lat: -34.5912, lon: -58.3740, type: 'intercity' },
    'SCL': { name: 'santiago central', city: 'santiago', country: 'CL', lat: -33.4569, lon: -70.6928, type: 'intercity' },
    'LIM': { name: 'lima central', city: 'lima', country: 'PE', lat: -12.0464, lon: -77.0428, type: 'intercity' },
    'MDZ': { name: 'mendoza station', city: 'mendoza', country: 'AR', lat: -32.8895, lon: -68.8458, type: 'intercity' },
    
    // Africa
    'JNB': { name: 'johannesburg park station', city: 'johannesburg', country: 'ZA', lat: -26.2041, lon: 28.0473, type: 'intercity' },
    'CPT': { name: 'cape town station', city: 'cape town', country: 'ZA', lat: -33.9249, lon: 18.4241, type: 'intercity' },
    'KIM': { name: 'kimberley station', city: 'kimberley', country: 'ZA', lat: -28.7282, lon: 24.7629, type: 'intercity' },
    'DBN': { name: 'durban station', city: 'durban', country: 'ZA', lat: -29.8587, lon: 31.0218, type: 'intercity' },
    'CAI': { name: 'cairo ramses station', city: 'cairo', country: 'EG', lat: 30.0626, lon: 31.2497, type: 'intercity' },
    'ALX': { name: 'alexandria misr station', city: 'alexandria', country: 'EG', lat: 31.2001, lon: 29.9187, type: 'intercity' },
    'CAS': { name: 'casablanca port', city: 'casablanca', country: 'MA', lat: 33.5731, lon: -7.5898, type: 'intercity' },
    'RAB': { name: 'rabat ville', city: 'rabat', country: 'MA', lat: 34.0209, lon: -6.8417, type: 'intercity' }
};

// detailed railway routes with intermediate waypoints following actual track alignment
export const railwayRoutes = [
    // European High Speed Corridors
    {
        from: 'LGV',
        to: 'KXX',
        name: 'eurostar',
        type: 'high_speed',
        waypoints: [
            { lat: 48.8441, lon: 2.3737 }, // Paris Gare de Lyon
            { lat: 49.4431, lon: 2.0828 }, // Via Creil
            { lat: 49.8951, lon: 2.3017 }, // Amiens
            { lat: 50.6389, lon: 3.0756 }, // Lille Europe
            { lat: 50.9218, lon: 1.9450 }, // Calais Frethun
            { lat: 51.0895, lon: 1.1439 }, // Channel Tunnel
            { lat: 51.3811, lon: 0.9470 }, // Ashford International
            { lat: 51.5308, lon: -0.1238 }  // London King's Cross
        ]
    },
    {
        from: 'LGV',
        to: 'BXL',
        name: 'thalys',
        type: 'high_speed',
        waypoints: [
            { lat: 48.8441, lon: 2.3737 }, // Paris Gare de Lyon
            { lat: 49.4431, lon: 2.0828 }, // Via Creil
            { lat: 49.8951, lon: 2.3017 }, // Amiens
            { lat: 50.6389, lon: 3.0756 }, // Lille Europe
            { lat: 50.8356, lon: 4.3369 }  // Brussels Midi
        ]
    },
    {
        from: 'BXL',
        to: 'AMS',
        name: 'thalys',
        type: 'high_speed',
        waypoints: [
            { lat: 50.8356, lon: 4.3369 }, // Brussels Midi
            { lat: 51.0380, lon: 4.4823 }, // Antwerpen Centraal
            { lat: 51.4416, lon: 4.6374 }, // Breda
            { lat: 51.9225, lon: 4.4792 }, // Rotterdam Centraal
            { lat: 52.0907, lon: 4.6138 }, // Den Haag HS
            { lat: 52.3791, lon: 4.9003 }  // Amsterdam Centraal
        ]
    },
    {
        from: 'FRA',
        to: 'MUC',
        name: 'ice',
        type: 'high_speed',
        waypoints: [
            { lat: 50.1070, lon: 8.6625 }, // Frankfurt Hauptbahnhof
            { lat: 49.8728, lon: 9.9395 }, // Würzburg
            { lat: 49.4521, lon: 11.0767 }, // Nürnberg
            { lat: 48.7758, lon: 11.4315 }, // Ingolstadt
            { lat: 48.1401, lon: 11.5583 }  // Munich Hauptbahnhof
        ]
    },
    {
        from: 'MIL',
        to: 'ROM',
        name: 'frecciarossa',
        type: 'high_speed',
        waypoints: [
            { lat: 45.4865, lon: 9.2051 }, // Milano Centrale
            { lat: 44.8056, lon: 10.3280 }, // Reggio Emilia AV
            { lat: 44.4949, lon: 11.3426 }, // Bologna Centrale
            { lat: 43.7763, lon: 11.2477 }, // Firenze SMN
            { lat: 43.0642, lon: 11.8847 }, // Arezzo
            { lat: 42.5674, lon: 12.6486 }, // Orvieto
            { lat: 41.9010, lon: 12.5015 }  // Roma Termini
        ]
    },
    {
        from: 'MAD',
        to: 'BCN',
        name: 'ave',
        type: 'high_speed',
        waypoints: [
            { lat: 40.4066, lon: -3.6906 }, // Madrid Atocha
            { lat: 40.4473, lon: -2.4691 }, // Guadalajara-Yebes
            { lat: 40.4637, lon: -1.8797 }, // Calatayud
            { lat: 41.6516, lon: -0.8773 }, // Zaragoza Delicias
            { lat: 41.5912, lon: 0.6250 },  // Lleida Pirineus
            { lat: 41.6075, lon: 1.6203 },  // Camp de Tarragona
            { lat: 41.3794, lon: 2.1404 }   // Barcelona Sants
        ]
    },
    
    // Asian High Speed Networks
    {
        from: 'TYO',
        to: 'OSA',
        name: 'tokaido shinkansen',
        type: 'high_speed',
        waypoints: [
            { lat: 35.6812, lon: 139.7671 }, // Tokyo
            { lat: 35.6284, lon: 139.7387 }, // Shinagawa
            { lat: 35.5073, lon: 139.6177 }, // Shin-Yokohama
            { lat: 35.3203, lon: 139.3938 }, // Odawara
            { lat: 35.1037, lon: 138.9110 }, // Atami
            { lat: 34.9196, lon: 138.4016 }, // Mishima
            { lat: 34.7297, lon: 138.0153 }, // Shin-Fuji
            { lat: 34.9754, lon: 138.3828 }, // Kozu
            { lat: 35.1706, lon: 136.8816 }, // Nagoya
            { lat: 34.9856, lon: 135.7581 }, // Kyoto
            { lat: 34.7326, lon: 135.5001 }  // Shin-Osaka
        ]
    },
    {
        from: 'BJS',
        to: 'SHA',
        name: 'beijing-shanghai hsr',
        type: 'high_speed',
        waypoints: [
            { lat: 39.8651, lon: 116.3780 }, // Beijing South
            { lat: 39.1368, lon: 117.1655 }, // Tianjin West
            { lat: 38.0428, lon: 118.0843 }, // Cangzhou West
            { lat: 36.6512, lon: 116.9044 }, // Jinan West
            { lat: 35.3803, lon: 116.9670 }, // Qufu East
            { lat: 34.2049, lon: 117.8872 }, // Xuzhou East
            { lat: 33.6293, lon: 118.8570 }, // Bengbu South
            { lat: 31.9557, lon: 118.7196 }, // Nanjing South
            { lat: 31.7839, lon: 119.9774 }, // Changzhou North
            { lat: 31.5804, lon: 120.2922 }, // Wuxi East
            { lat: 31.1979, lon: 121.3215 }  // Shanghai Hongqiao
        ]
    },
    {
        from: 'SEL',
        to: 'PUS',
        name: 'ktx',
        type: 'high_speed',
        waypoints: [
            { lat: 37.5547, lon: 126.9706 }, // Seoul
            { lat: 37.2406, lon: 127.1775 }, // Gwangmyeong
            { lat: 36.3518, lon: 127.3849 }, // Daejeon
            { lat: 36.0064, lon: 127.7644 }, // Gimcheon-Gumi
            { lat: 35.8794, lon: 128.6294 }, // Daegu
            { lat: 35.1158, lon: 129.0403 }  // Busan
        ]
    },
    
    // North American Corridors
    {
        from: 'BOS',
        to: 'NYP',
        name: 'acela express',
        type: 'intercity',
        waypoints: [
            { lat: 42.3522, lon: -71.0552 }, // Boston South
            { lat: 42.3668, lon: -71.0626 }, // Back Bay
            { lat: 41.7003, lon: -71.4204 }, // Providence
            { lat: 41.2234, lon: -72.9067 }, // New Haven
            { lat: 41.0534, lon: -73.5387 }, // Bridgeport
            { lat: 40.7894, lon: -73.8771 }, // Stamford
            { lat: 40.7505, lon: -73.9934 }  // New York Penn
        ]
    },
    {
        from: 'NYP',
        to: 'WAS',
        name: 'acela express',
        type: 'intercity',
        waypoints: [
            { lat: 40.7505, lon: -73.9934 }, // New York Penn
            { lat: 40.7364, lon: -74.1719 }, // Newark
            { lat: 40.2206, lon: -74.7563 }, // Trenton
            { lat: 39.9566, lon: -75.1820 }, // Philadelphia 30th Street
            { lat: 39.7391, lon: -75.5467 }, // Wilmington
            { lat: 39.3078, lon: -76.6157 }, // Baltimore Penn
            { lat: 38.8973, lon: -77.0063 }  // Washington Union
        ]
    },
    {
        from: 'SEA',
        to: 'VAN',
        name: 'amtrak cascades',
        type: 'intercity',
        waypoints: [
            { lat: 47.5990, lon: -122.3301 }, // Seattle King Street
            { lat: 47.7511, lon: -122.2015 }, // Edmonds
            { lat: 48.0370, lon: -122.1426 }, // Everett
            { lat: 48.4219, lon: -122.3370 }, // Mount Vernon
            { lat: 48.7519, lon: -122.4787 }, // Bellingham
            { lat: 49.2736, lon: -123.0977 }  // Vancouver Pacific Central
        ]
    },
    
    // Russian Railway Network
    {
        from: 'MOW',
        to: 'SPB',
        name: 'sapsan high-speed',
        type: 'high_speed',
        waypoints: [
            { lat: 55.7763, lon: 37.6555 }, // Moscow Yaroslavsky
            { lat: 56.0184, lon: 37.4742 }, // Sergiev Posad
            { lat: 56.3426, lon: 36.7344 }, // Alexandrov
            { lat: 56.8585, lon: 35.9126 }, // Valdai region
            { lat: 57.8109, lon: 34.0839 }, // Vyshny Volochyok
            { lat: 58.2220, lon: 33.2061 }, // Bologoye
            { lat: 58.5186, lon: 31.2836 }, // Chudovo
            { lat: 59.9311, lon: 30.3609 }  // St Petersburg Moskovsky
        ]
    },
    {
        from: 'SPB',
        to: 'PTZ',
        name: 'murmansk railway',
        type: 'intercity',
        waypoints: [
            { lat: 59.9311, lon: 30.3609 }, // St Petersburg Moskovsky
            { lat: 60.7090, lon: 28.7606 }, // Vyborg
            { lat: 61.0887, lon: 29.7639 }, // Hiitola
            { lat: 61.5024, lon: 30.1157 }, // Joensuu region
            { lat: 61.7849, lon: 34.3469 }  // Petrozavodsk
        ]
    },
    {
        from: 'MOW',
        to: 'TUL',
        name: 'kursky direction',
        type: 'intercity',
        waypoints: [
            { lat: 55.7763, lon: 37.6555 }, // Moscow Yaroslavsky
            { lat: 55.4042, lon: 37.9020 }, // Domodedovo region
            { lat: 54.9884, lon: 37.8504 }, // Serpukhov
            { lat: 54.2045, lon: 37.6156 }  // Tula
        ]
    },
    {
        from: 'TUL',
        to: 'VOR',
        name: 'kursky railway',
        type: 'intercity',
        waypoints: [
            { lat: 54.2045, lon: 37.6156 }, // Tula
            { lat: 53.2357, lon: 38.1612 }, // Yefremov
            { lat: 52.6031, lon: 38.5014 }, // Yelets
            { lat: 51.6720, lon: 39.2106 }  // Voronezh
        ]
    },
    {
        from: 'VOR',
        to: 'KRD',
        name: 'north caucasus railway',
        type: 'intercity',
        waypoints: [
            { lat: 51.6720, lon: 39.2106 }, // Voronezh
            { lat: 50.5951, lon: 36.5878 }, // Belgorod
            { lat: 49.9935, lon: 36.2304 }, // Kharkov region
            { lat: 48.7194, lon: 37.5407 }, // Luhansk region
            { lat: 47.2357, lon: 39.7015 }, // Rostov-on-Don
            { lat: 46.3497, lon: 39.4154 }, // Tikhoretsk
            { lat: 45.0355, lon: 38.9753 }  // Krasnodar
        ]
    },
    {
        from: 'KRD',
        to: 'SOC',
        name: 'north caucasus railway',
        type: 'intercity',
        waypoints: [
            { lat: 45.0355, lon: 38.9753 }, // Krasnodar
            { lat: 44.6939, lon: 37.7816 }, // Anapa region
            { lat: 44.5601, lon: 38.0767 }, // Gelendzhik region
            { lat: 44.1479, lon: 38.8951 }, // Tuapse
            { lat: 43.8864, lon: 39.1902 }, // Lazarevskoye
            { lat: 43.6028, lon: 39.7342 }  // Sochi
        ]
    },
    
    // Trans-Siberian Railway (world's longest)
    {
        from: 'MOW',
        to: 'YEK',
        name: 'trans-siberian',
        type: 'intercity',
        waypoints: [
            { lat: 55.7763, lon: 37.6555 }, // Moscow Yaroslavsky
            { lat: 56.8431, lon: 60.6454 }, // Nizhny Novgorod
            { lat: 55.7887, lon: 49.1221 }, // Kazan
            { lat: 56.8579, lon: 60.6050 }  // Yekaterinburg
        ]
    },
    {
        from: 'YEK',
        to: 'NOV',
        name: 'trans-siberian',
        type: 'intercity',
        waypoints: [
            { lat: 56.8579, lon: 60.6050 }, // Yekaterinburg
            { lat: 57.1612, lon: 65.5346 }, // Tyumen
            { lat: 54.9924, lon: 73.3686 }, // Omsk
            { lat: 55.0415, lon: 82.9346 }  // Novosibirsk
        ]
    },
    {
        from: 'NOV',
        to: 'IRK',
        name: 'trans-siberian',
        type: 'intercity',
        waypoints: [
            { lat: 55.0415, lon: 82.9346 }, // Novosibirsk
            { lat: 56.0184, lon: 92.8672 }, // Krasnoyarsk
            { lat: 52.2596, lon: 104.3058 } // Irkutsk
        ]
    },
    {
        from: 'IRK',
        to: 'VLV',
        name: 'trans-siberian',
        type: 'intercity',
        waypoints: [
            { lat: 52.2596, lon: 104.3058 }, // Irkutsk
            { lat: 51.8280, lon: 107.5856 }, // Ulan-Ude
            { lat: 52.0568, lon: 113.4856 }, // Chita
            { lat: 48.4827, lon: 135.0940 }, // Khabarovsk
            { lat: 43.1056, lon: 131.8735 }  // Vladivostok
        ]
    },
    
    // Indian Railways Golden Quadrilateral
    {
        from: 'DEL',
        to: 'BOM',
        name: 'rajdhani express',
        type: 'intercity',
        waypoints: [
            { lat: 28.6431, lon: 77.2197 }, // New Delhi
            { lat: 27.8974, lon: 78.0880 }, // Mathura Junction
            { lat: 26.2124, lon: 78.1772 }, // Gwalior
            { lat: 25.3176, lon: 78.7718 }, // Jhansi
            { lat: 23.1645, lon: 79.9864 }, // Bhopal
            { lat: 21.7645, lon: 78.1206 }, // Nagpur
            { lat: 19.0176, lon: 72.8562 }  // Mumbai Central
        ]
    },
    {
        from: 'DEL',
        to: 'CCU',
        name: 'rajdhani express',
        type: 'intercity',
        waypoints: [
            { lat: 28.6431, lon: 77.2197 }, // New Delhi
            { lat: 27.4924, lon: 77.6737 }, // Aligarh
            { lat: 26.8467, lon: 80.9462 }, // Lucknow
            { lat: 25.4358, lon: 81.8463 }, // Allahabad
            { lat: 25.3176, lon: 83.0104 }, // Varanasi
            { lat: 25.5941, lon: 85.1376 }, // Patna
            { lat: 22.5958, lon: 88.3424 }  // Kolkata Howrah
        ]
    },
    
    // Australian Long Distance
    {
        from: 'SYD',
        to: 'MEL',
        name: 'xpt',
        type: 'intercity',
        waypoints: [
            { lat: -33.8830, lon: 151.2061 }, // Sydney Central
            { lat: -34.4229, lon: 150.8931 }, // Goulburn
            { lat: -35.1082, lon: 147.3598 }, // Cootamundra
            { lat: -35.7975, lon: 147.1297 }, // Wagga Wagga
            { lat: -36.0737, lon: 146.9135 }, // Albury
            { lat: -36.7448, lon: 145.2728 }, // Seymour
            { lat: -37.8183, lon: 144.9525 }  // Melbourne Southern Cross
        ]
    },
    {
        from: 'ADL',
        to: 'PER',
        name: 'indian pacific',
        type: 'intercity',
        waypoints: [
            { lat: -34.9285, lon: 138.6007 }, // Adelaide
            { lat: -33.0595, lon: 137.7837 }, // Port Augusta
            { lat: -31.4221, lon: 136.8906 }, // Tarcoola
            { lat: -30.7494, lon: 121.4656 }, // Kalgoorlie
            { lat: -31.9505, lon: 115.8605 }  // Perth
        ]
    },
    
    // African Railways
    {
        from: 'JNB',
        to: 'CPT',
        name: 'blue train',
        type: 'intercity',
        waypoints: [
            { lat: -26.2041, lon: 28.0473 }, // Johannesburg Park
            { lat: -28.7282, lon: 24.7629 }, // Kimberley
            { lat: -30.5595, lon: 22.9375 }, // De Aar
            { lat: -32.2968, lon: 20.4492 }, // Beaufort West
            { lat: -33.9249, lon: 18.4241 }  // Cape Town
        ]
    },
    
    // South American Routes
    {
        from: 'BUE',
        to: 'SCL',
        name: 'mendoza service',
        type: 'intercity',
        waypoints: [
            { lat: -34.5912, lon: -58.3740 }, // Buenos Aires Retiro
            { lat: -34.9214, lon: -57.9544 }, // La Plata
            { lat: -35.6751, lon: -63.7594 }, // Junín
            { lat: -32.8895, lon: -68.8458 }, // Mendoza
            { lat: -33.4569, lon: -70.6928 }  // Santiago Central
        ]
    }
];