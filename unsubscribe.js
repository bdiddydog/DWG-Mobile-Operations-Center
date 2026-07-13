const { getStore } = require("@netlify/blobs");
const { subscriptionId } = require("./_push-common");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const subscription = JSON.parse(event.body || "{}");
    const store = getStore("dwg-push-subscriptions");
    await store.delete(subscriptionId(subscription));
    return { statusCode: 200, body: JSON.stringify({ removed: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
