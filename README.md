# DWG Mobile Operations Center v2

This rebuilt version requires **no editing of app.js**.

## What changed

- The VAPID public key is read automatically from Netlify.
- A setup warning appears if environment variables are missing.
- A setup page is included.
- Rainbow and private VAPID keys remain server-side.
- The scheduled weather-change check runs every three hours.

## Required Netlify environment variables

Add:

- `RAINBOW_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` using `mailto:your-email@example.com`

## Important deployment note

The dashboard and push notifications use Netlify Functions. A plain static drag-and-drop deployment is not enough for the backend functions.

### Recommended manual deployment from Chromebook Linux

1. Extract this ZIP into Linux files.
2. Open Terminal.
3. Change into the folder.
4. Install Netlify CLI:

```bash
npm install -g netlify-cli
```

5. Log in:

```bash
netlify login
```

6. Install project packages:

```bash
npm install
```

7. Deploy:

```bash
netlify deploy --prod
```

When asked:
- Choose the existing `dwgworkstation` project or create a new project.
- Publish directory: `.`
- Functions directory is already configured in `netlify.toml`.

After deployment, add the four environment variables in Netlify and redeploy.

## Phone setup

1. Open the deployed app on your phone.
2. Add it to your home screen.
3. Open the installed icon.
4. Tap **Enable phone alerts**.
5. Tap **Send test alert**.
