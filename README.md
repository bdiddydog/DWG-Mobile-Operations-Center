# DWG Mobile Operations Center

Installable Delaware Weather Guy mobile forecast dashboard with Rainbow Weather forecasts, NWS Delaware alerts, and Web Push notifications.

## Netlify environment variables

Add these in Netlify under **Project configuration → Environment variables**:

- `RAINBOW_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` using `mailto:your-email@example.com`

The app reads the public VAPID key from Netlify automatically. Do not place the Rainbow API key or the private VAPID key in browser code.

## Netlify connection

Connect this repository to a new Netlify site. The included `netlify.toml` publishes the repository root, deploys the functions in `netlify/functions`, and schedules the notification check every three hours.

## Phone setup

1. Open the deployed site on your phone.
2. Add it to the home screen.
3. Open the installed DWG app.
4. Tap **Enable phone alerts**.
5. Tap **Send test alert**.
