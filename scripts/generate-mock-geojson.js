const fs = require('fs');

const kapanewons = [
  "Wonosari", "Nglipar", "Playen", "Patuk", "Paliyan", "Panggang", "Tepus", 
  "Semanu", "Ponjong", "Karangmojo", "Semin", "Ngawen", "Gedangsari", 
  "Saptosari", "Girisubo", "Tanjungsari", "Purwosari", "Rongkop"
];

// Approximate center of Gunungkidul
const baseX = 110.6;
const baseY = -7.96;
const step = 0.05; // ~5km step

const features = kapanewons.map((name, index) => {
  const row = Math.floor(index / 6);
  const col = index % 6;
  
  const minX = baseX + (col * step);
  const maxX = minX + step - 0.005;
  const minY = baseY - (row * step);
  const maxY = minY - step + 0.005;

  return {
    type: "Feature",
    properties: {
      KECAMATAN: name
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY]
      ]]
    }
  };
});

const geojson = {
  type: "FeatureCollection",
  features: features
};

fs.writeFileSync('public/mock-gunungkidul.geojson', JSON.stringify(geojson, null, 2));
console.log('Mock GeoJSON created at public/mock-gunungkidul.geojson');
