const { getStore } = require("@netlify/blobs");
const { buildSnapshot } = require("./_weather-common");
const { webpush, configureWebPush } = require("./_push-common");

function meaningfulChanges(previous, current) {
  const changes = [];
  const oldByName = Object.fromEntries((previous?.locations || []).map(item => [item.name, item]));

  for (const now of current.locations || []) {
    const old = oldByName[now.name];
    if (!old) continue;

    const tempChange = Math.abs(Number(now.temperatureF || 0) - Number(old.temperatureF || 0));
    const rainChange = Math.abs(Number(now.precipChance || 0) - Number(old.precipChance || 0));
    const gustChange = Math.abs(Number(now.windGustMph || 0) - Number(old.windGustMph || 0));

    if (tempChange >= 5) changes.push(`${now.name}: temperature changed ${Math.round(tempChange)}°`);
    if (rainChange >= 20) changes.push(`${now.name}: rain chance changed ${Math.round(rainChange)} points`);
    if (gustChange >= 10) changes.push(`${now.name}: gust forecast changed ${Math.round(gustChange)} mph`);
    if (old.condition && now.condition && old.condition !== now.condition) {
      changes.push(`${now.name}: ${old.condition} → ${now.condition}`);
    }
  }

  const oldAlerts = new Set((previous?.alerts || []).map(alert => alert.id));
  for (const alert of current.alerts || []) {
    if (!oldAlerts.has(alert.id)) changes.unshift(`New ${alert.event}`);
  }
  return changes;
}

exports.handler = async function () {
  try {
    configureWebPush();
    const stateStore = getStore("dwg-weather-state");
    const previous = await stateStore.get("latest", { type: "json" });
    const current = await buildSnapshot();
    await stateStore.setJSON("latest", current);

    if (!previous) return { statusCode: 200, body: JSON.stringify({ initialized: true, sent: 0 }) };

    const changes = meaningfulChanges(previous, current);
    if (!changes.length) return { statusCode: 200, body: JSON.stringify({ changes: 0, sent: 0 }) };

    const subscriptionsStore = getStore("dwg-push-subscriptions");
    const listed = await subscriptionsStore.list({ paginate: false });
    let sent = 0;
    const payload = JSON.stringify({
      title: current.alerts?.length ? "DWG weather alert" : "DWG forecast change",
      body: changes.slice(0, 3).join(" • "),
      tag: "dwg-weather-update",
      url: "/"
    });

    for (const blob of listed.blobs || []) {
      const subscription = await subscriptionsStore.get(blob.key, { type: "json" });
      if (!subscription) continue;
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) await subscriptionsStore.delete(blob.key);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ changes, sent }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};