const haversineKilometres = (p1, p2) => {
  const R = 6371;
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(p2[1] - p1[1]);
  const dLng = toRad(p2[0] - p1[0]);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(p1[1])) * Math.cos(toRad(p2[1])) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const pois = [
  {name: 'Eyethu Shopping Mall', category: 'Commercial', subCategory: 'Shopping Mall', coordinates: [27.8703, -26.4711], popularity: 1.6, safetyScore: 90},
  {name: 'Sandton City Mall', category: 'Commercial', subCategory: 'Shopping Mall', coordinates: [28.0522, -26.1095], popularity: 2.0, safetyScore: 96},
  {name: 'Mall of Africa', category: 'Commercial', subCategory: 'Shopping Mall', coordinates: [28.1065, -26.0152], popularity: 1.9, safetyScore: 94},
  {name: 'Rosebank Mall', category: 'Commercial', subCategory: 'Shopping Mall', coordinates: [28.0423, -26.1460], popularity: 1.8, safetyScore: 92},
  {name: 'Soweto Spaza Hub', category: 'Commercial', subCategory: 'Spaza Shop', coordinates: [27.8720, -26.2580], popularity: 1.2, safetyScore: 75},
];

function testSearch(query, baseLocation) {
  const lowerQuery = query.toLowerCase().trim();
  const translated = lowerQuery;
  
  const GENERIC_CATEGORY_TERMS = new Set([
    'mall', 'shop', 'store', 'market', 'supermarket', 'restaurant', 'cafe', 'hospital',
    'clinic', 'pharmacy', 'school', 'university', 'college', 'bank', 'atm', 'fuel',
    'petrol', 'garage', 'parking', 'hotel', 'park', 'museum', 'police', 'station',
    'airport', 'mall', 'plaza', 'centre', 'center', 'hub', 'rank', 'terminal'
  ]);
  const isGenericQuery = GENERIC_CATEGORY_TERMS.has(lowerQuery) || GENERIC_CATEGORY_TERMS.has(translated);
  
  const scoredResults = [];
  for (const poi of pois) {
    let score = 0;
    const distance = haversineKilometres(baseLocation, poi.coordinates);
    const nameLower = poi.name.toLowerCase();
    const literalMatch = nameLower.includes(lowerQuery);
    const translatedMatch = translated !== lowerQuery && nameLower.includes(translated);
    
    if (literalMatch || translatedMatch) {
      score += 100;
      const prefixBonus = isGenericQuery ? 10 : 50;
      if (nameLower.startsWith(lowerQuery)) score += prefixBonus;
      else if (translatedMatch && nameLower.startsWith(translated)) score += prefixBonus;
      if (nameLower === lowerQuery) score += 100;
      const escaped = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryMatch = new RegExp('\\b' + escaped + '\\b').test(nameLower);
      if (wordBoundaryMatch) score += 40;
    }
    
    if (poi.category.toLowerCase().includes(translated) || poi.subCategory.toLowerCase().includes(translated)) {
      score += 80;
    }
    
    score *= poi.popularity;
    const distancePenalty = isGenericQuery ? Math.min(25, distance * 0.5) : Math.min(15, distance * 0.25);
    score -= distancePenalty;
    
    if (score > 10) {
      scoredResults.push({ poi, score, distance });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score || a.distance - b.distance);
  
  console.log(`Results for "${query}" near [${baseLocation[0].toFixed(4)}, ${baseLocation[1].toFixed(4)}]:`);
  scoredResults.forEach(r => console.log(`  ${r.poi.name}: score=${r.score.toFixed(1)}, dist=${r.distance.toFixed(2)}km`));
  return scoredResults;
}

console.log('=== CURATED POI SEARCH TESTS ===');
testSearch('eyethu shopping mall', [27.8703, -26.4711]);
testSearch('eyethu', [27.8703, -26.4711]);
testSearch('eyethu mall', [27.8703, -26.4711]);
testSearch('mall', [28.0522, -26.1095]);
testSearch('mall', [28.0423, -26.1460]);
testSearch('sandton', [28.0522, -26.1095]);
testSearch('rosebank', [28.0423, -26.1460]);
testSearch('spaza', [27.8720, -26.2580]);
testSearch('shopping mall', [28.0522, -26.1095]);