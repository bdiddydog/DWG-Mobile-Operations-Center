const { webpush, configureWebPush } = require("./_push-common");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    configureWebPush();
    const subscription = JSON.parse(event.body || "{}");
    await webpush.sendNotification(subscription, JSON.stringify({
      title: "DWG test alert",
      body: "Phone notifications are working. Data Over Drama.",
      tag: "dwg-test",
      url: "/"
    }));
    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};