let VAPID_PUBLIC_KEY = "";

const locationsEl = document.getElementById("locationGrid");
const alertsEl = document.getElementById("alertsList");
const updatedEl = document.getElementById("updatedAt");
const statusEl = document.getElementById("notificationStatus");
const loadStateEl = document.getElementById("loadState");
const alertCountEl = document.getElementById("alertCount");
const setupPanel = document.getElementById("setupPanel");
const setupMessage = document.getElementById("setupMessage");

document.getElementById("refreshBtn").addEventListener("click", loadWeather);
document.getElementById("enableNotifications").addEventListener("click", enableNotifications);
document.getElementById("testNotification").addEventListener("click", testNotification);

window.addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }
  await loadConfiguration();
  updateNotificationStatus();
  await loadWeather();
});

async function loadConfiguration() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    const data = await response.json();
    VAPID_PUBLIC_KEY = data.vapidPublicKey || "";
    const missing = data.missing || [];
    if (missing.length) {
      setupPanel.classList.remove("hidden");
      setupMessage.textContent = "Missing Netlify settings: " + missing.join(", ");
    }
  } catch (error) {
    setupPanel.classList.remove("hidden");
    setupMessage.textContent = "The Netlify backend is not available. Open setup instructions.";
  }
}

async function loadWeather() {
  loadStateEl.textContent = "Updating...";
  try {
    const response = await fetch("/api/weather", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Weather request failed");
    renderLocations(data.locations || []);
    renderAlerts(data.alerts || []);
    updatedEl.textContent = new Date(data.generatedAt).toLocaleString();
    loadStateEl.textContent = "Current";
  } catch (error) {
    locationsEl.innerHTML = `<article class="card"><h3>Weather unavailable</h3><p class="quiet">${escapeHtml(error.message)}</p></article>`;
    loadStateEl.textContent = "Error";
  }
}

function renderLocations(locations) {
  locationsEl.innerHTML = locations.map(item => `
    <article class="card">
      <div class="zone">${escapeHtml(item.zone)}</div>
      <h3>${escapeHtml(item.name)}</h3>
      <div class="current">
        <div class="temp">${format(item.temperatureF, 0)}°</div>
        <div class="condition">${escapeHtml(item.condition || "Unavailable")}</div>
      </div>
      <div class="metrics">
        <div class="metric"><span>Feels like</span><strong>${format(item.feelsLikeF, 0)}°F</strong></div>
        <div class="metric"><span>Rain chance</span><strong>${format(item.precipChance, 0)}%</strong></div>
        <div class="metric"><span>Wind</span><strong>${escapeHtml(item.wind || "—")}</strong></div>
        <div class="metric"><span>Gust</span><strong>${format(item.windGustMph, 0)} mph</strong></div>
      </div>
    </article>
  `).join("");
}

function renderAlerts(alerts) {
  alertCountEl.textContent = String(alerts.length);
  if (!alerts.length) {
    alertsEl.innerHTML = '<p class="quiet">No active Delaware NWS alerts.</p>';
    return;
  }
  alertsEl.innerHTML = alerts.map(alert => `
    <article class="alert">
      <h3>${escapeHtml(alert.event)}</h3>
      <p>${escapeHtml(alert.areaDesc || "")}</p>
    </article>
  `).join("");
}

async function enableNotifications() {
  if (!VAPID_PUBLIC_KEY) {
    alert("The VAPID public key is not configured in Netlify.");
    return;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("This browser does not support Web Push notifications.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    updateNotificationStatus();
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  const response = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not save notification subscription");

  updateNotificationStatus();
  alert("DWG phone alerts are enabled.");
}

async function testNotification() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    alert("Enable phone alerts first.");
    return;
  }

  const response = await fetch("/api/test-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Test alert failed");
}

function updateNotificationStatus() {
  if (!("Notification" in window)) {
    statusEl.textContent = "Unsupported";
  } else {
    statusEl.textContent = Notification.permission === "granted" ? "Enabled" : "Not enabled";
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function format(value, decimals) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : "—";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}
