const webpush = require("web-push");

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:weather@example.com";
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured.");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}
function subscriptionId(subscription) {
  return Buffer.from(subscription.endpoint).toString("base64url");
}
module.exports = { webpush, configureWebPush, subscriptionId };
