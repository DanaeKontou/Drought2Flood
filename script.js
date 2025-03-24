// Create the map
var map = L.map('map').setView([0, 0], 2); // Centered on the world

// Add a minimal base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 18
}).addTo(map);

// Add a marker just for fun (optional)
L.marker([0, 0]).addTo(map).bindPopup('Start exploring!').openPopup();
