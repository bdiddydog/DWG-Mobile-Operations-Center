exports.handler = async function () {
  const missing = [];
  if (!process.env.RAINBOW_API_KEY) missing.push("RAINBOW_API_KEY");
  if (!process.env.VAPID_PUBLIC_KEY) missing.push("VAPID_PUBLIC_KEY");
  if (!process.env.VAPID_PRIVATE_KEY) missing.push("VAPID_PRIVATE_KEY");
  if (!process.env.VAPID_SUBJECT) missing.push("VAPID_SUBJECT");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
      missing
    })
  };
};