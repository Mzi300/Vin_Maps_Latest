// Quick test of the search logic by simulating the scoring
const haversineKilometres = (p1, p2) => {
  const R = 6371;
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(p2[1] - p1[1]);
  const dLng = toRad(p2[0] - p1[0]);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(p1[1])) * Math.cos(toRad(p2[1])) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Test POIs (subset)
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
  
  const scoredResults = [];
  for (const poi of pois) {
    let score = 0;
    const distance = haversineKilometres(baseLocation, poi.coordinates);
    const nameLower = poi.name.toLowerCase();
    const literalMatch = nameLower.includes(lowerQuery);
    const translatedMatch = translated !== lowerQuery && nameLower.includes(translated);
    
    if (literalMatch || translatedMatch) {
      score += 100;
      if (nameLower.startsWith(lowerQuery)) score += 50;
      else if (translatedMatch && nameLower.startsWith(translated)) score += 50;
      if (nameLower === lowerQuery) score += 100;
      const escaped = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryMatch = new RegExp('\\b' + escaped + '\\b').test(nameLower);
      if (wordBoundaryMatch) score += 40;
    }
    
    if (poi.category.toLowerCase().includes(translated) || poi.subCategory.toLowerCase().includes(translated)) {
      score += 80;
    }
    
    score *= poi.popularity;
    score -= Math.min(15, distance * 0.25);
    
    if (score > 10) {
      scoredResults.push({ poi, score, distance });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score || a.distance - b.distance);
  
  console.log(`\nResults for "${query}" near [${baseLocation[0].toFixed(4)}, ${baseLocation[1].toFixed(4)}]:`);
  scoredResults.forEach(r => console.log(`  ${r.poi.name}: score=${r.score.toFixed(1)}, dist=${r.distance.toFixed(2)}km`));
  return scoredResults;
}

// Test 1: Exact name match for Eyethu Shopping Mall
testSearch('eyethu shopping mall', [27.8703, -26.4711]);

// Test 2: Partial name "eyethu" 
testSearch('eyethu', [27.8703, -26.4711]);

// Test 3: "mall" near Sandton
testSearch('mall', [28.0522, -26.1095]);

// Test 4: "sandton" 
testSearch('sandton', [28.0522, -26.1095]);

// Test 5: "rosebank" 
testSearch('rosebank', [28.0423, -26.1460]);

// Test 6: "spaza" 
testSearch('spaza', [27.8720, -26.2580]);

// Test 7: "mall" near Rosebank (should rank Rosebank Mall first)
testSearch('mall', [28.0423, -26.1460]);

// Test 8: Category search "shopping mall"
testSearch('shopping mall', [28.0522, -26.1095]);