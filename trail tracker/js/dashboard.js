import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCsVey6bpWHqvz2_M2xzqJcbSpeOm2z0ww",
  authDomain: "trail-tracker-e6867.firebaseapp.com",
  projectId: "trail-tracker-e6867",
  storageBucket: "trail-tracker-e6867.appspot.com",
  messagingSenderId: "755828210439",
  appId: "1:755828210439:web:ecc01f46283ba046b423a2",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const greetingText = document.getElementById("greetingText");
const modal = document.getElementById("tripModal");
const openBtn = document.getElementById("addTripBtn");
const closeBtn = document.getElementById("closeModal");
const tripForm = document.getElementById("tripForm");
const tripList = document.getElementById("tripList");

let currentUserUID = null;
let map = null; // Leaflet map
let markersGroup = null; // Layer group to hold trip markers

// Initialize Leaflet map
function initMap() {
  map = L.map("map").setView([20, 0], 2); // World view

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);
}

// Helper: Convert location name to coordinates using Nominatim API
async function getCoordinates(locationName) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
  }
  return null; // fallback if no coords found
}

// Firebase Auth State Changed
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const fullName = user.displayName || "Traveler";
    const firstName = fullName.split(" ")[0];
    greetingText.textContent = `Hello, ${firstName}!`;
    currentUserUID = user.uid;

    initMap(); // Initialize map after user is confirmed
    await loadTrips();
  } else {
    window.location.href = "login.html";
  }
});

// Modal Events
openBtn.onclick = () => (modal.style.display = "block");
closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target == modal) modal.style.display = "none";
};

// Submit Trip
tripForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("tripTitle").value;
  const date = document.getElementById("tripDate").value;
  const location = document.getElementById("tripLocation").value;

  if (!currentUserUID) {
    alert("User not authenticated.");
    return;
  }

  try {
    await addDoc(collection(db, "trips", currentUserUID, "userTrips"), {
      title,
      date,
      location,
      createdAt: new Date(),
    });

    alert("Trip added!");
    modal.style.display = "none";
    tripForm.reset();
    await loadTrips(); // Refresh list and map markers
  } catch (error) {
    console.error("Error adding trip:", error);
    alert("Failed to add trip.");
  }
});

// Load User Trips from Firestore and display cards + update map markers
async function loadTrips() {
  if (!currentUserUID) return;
  tripList.innerHTML = "";

  if (markersGroup) {
    markersGroup.clearLayers(); // Clear old markers before adding new ones
  }

  const snapshot = await getDocs(collection(db, "trips", currentUserUID, "userTrips"));

  for (const doc of snapshot.docs) {
    const trip = doc.data();

    // Create trip card
    const card = document.createElement("div");
    card.className = "trip-card";
    card.innerHTML = `
      <h4>${trip.title}</h4>
      <p><strong>Date:</strong> ${trip.date}</p>
      <p><strong>Location:</strong> ${trip.location}</p>
    `;
    tripList.appendChild(card);

    // Add marker for trip location on map
    const coords = await getCoordinates(trip.location);
    if (coords && markersGroup) {
      const marker = L.marker(coords).addTo(markersGroup);
      marker.bindPopup(`<b>${trip.title}</b><br>${trip.date}<br>${trip.location}`);
    }
  }

  // Optionally, adjust map view to fit all markers
  if (markersGroup && markersGroup.getLayers().length > 0) {
    map.fitBounds(markersGroup.getBounds().pad(0.5));
  }
}
