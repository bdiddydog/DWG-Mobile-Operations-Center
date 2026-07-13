const LOCATIONS = [
  { name: "Wilmington", zone: "Northern Delaware", latitude: 39.7391, longitude: -75.5398 },
  { name: "Dover", zone: "Central Delaware", latitude: 39.1582, longitude: -75.5244 },
  { name: "Georgetown", zone: "Inland Sussex", latitude: 38.6901, longitude: -75.3855 },
  { name: "Rehoboth Beach", zone: "Delaware Beaches", latitude: 38.7209, longitude: -75.0760 }
];

const cToF = value => value == null ? null : Math.round((Number(value) * 9 / 5 + 32) * 10) / 10;
const msToMph = value => value == null ? null : Math.round(Number(value) * 2.236936 * 10) / 10;

function compass(degrees) {
  if (degrees == null) return "";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round((((Number(degrees) % 360) + 360) % 360) / 22.5) % 16];
}

function pretty(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, c => c.toUpperCase());
}

async function getForecast(location) {
  const key = process.env.RAINBOW_API_KEY;
  if (!key) throw new Error("RAINBOW_API_KEY is not configured in Netlify.");

  const url = `https://api.rainbow.ai/weather/v1/forecast/${location.longitude}/${location.latitude}?forecast_hours=48&forecast_days=7&day_start_hour=6`;
  const response = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Accept": "application/json"
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Rainbow API ${response.status}: ${text}`);
  return JSON.parse(text);
}

async function getDelawareAlerts() {
  const response = await fetch("https://api.weather.gov/alerts/active?area=DE", {
    headers: {
      "User-Agent": "DelawareWeatherGuy/2.0",
      "Accept": "application/geo+json"
    }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.features || []).map(item => ({
    id: item.id,
    event: item.properties?.event || "Weather Alert",
    areaDesc: item.properties?.areaDesc || "",
    severity: item.properties?.severity || "",
    urgency: item.properties?.urgency || ""
  }));
}

async function buildSnapshot() {
  const locations = [];
  for (const location of LOCATIONS) {
    const data = await getForecast(location);
    const hour = Array.isArray(data?.timelines?.hourly) ? data.timelines.hourly[0] || {} : {};
    locations.push({
      name: location.name,
      zone: location.zone,
      forecastTime: hour.startTimeIso || null,
      condition: pretty(hour.condition),
      temperatureF: cToF(hour.temperature),
      feelsLikeF: cToF(hour.feelsLikeTemperature),
      precipChance: Number(hour.precipitationChance ?? 0),
      windGustMph: msToMph(hour.windGust),
      wind: `${compass(hour.windDirection)} ${msToMph(hour.windSpeed) ?? "—"} mph`.trim()
    });
  }
  return {
    generatedAt: new Date().toISOString(),
    locations,
    alerts: await getDelawareAlerts()
  };
}

module.exports = { buildSnapshot };
