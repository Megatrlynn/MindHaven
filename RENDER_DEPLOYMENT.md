# Deploying to Render

This guide covers deploying the Node.js signaling server to Render, which provides excellent support for Socket.io and persistent connections.

## Why Render?

- ✅ **Persistent connections**: Full Node.js support, ideal for Socket.io
- ✅ **WebSocket support**: Native WebSocket/Socket.io compatibility
- ✅ **Free tier available**: With auto-wakeup mechanism included
- ✅ **Simple Git deployment**: Connect your GitHub repo and auto-deploy on push
- ❌ Netlify is serverless-only and cannot handle persistent Socket.io connections

## Server Changes for Production

The server now includes a **wakeup call mechanism** that prevents idle shutdown on Render's free tier (which has 15-minute timeout):

- Calls its own `/health` endpoint every 10 minutes
- Logs wakeup status to console
- Graceful shutdown handling with `SIGTERM`
- Uses `PORT` environment variable (default 5000)

## Pre-Deployment Checklist

1. **GitHub Access**: Ensure your MindHaven repo is on GitHub
2. **Environment Variables**: Prepare secret keys
3. **Updated .env.example**: Document all required variables
4. **CORS Origins**: Know your production frontend URL

## Step 1: Prepare Environment Variables

Create a `.env.production` file (locally, for reference):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Production server URL (used for wakeup calls)
SERVER_URL=https://your-server.onrender.com

# Optional
VITE_SOCKET_SERVER_URL=https://your-server.onrender.com
```

**Important**: Do NOT commit `.env.production` to Git. Use Render's dashboard to set these.

## Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign up/log in
2. Click **New** → **Web Service**
3. **Connect a Git repository**:
   - Select **GitHub**
   - Authorize and select your `MindHaven` repo
   - Choose Branch: `main` (or your default branch)
4. **Configure the service**:
   - **Name**: `mindhaven-server` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `Oregon` for US)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Instance Type**: Free (for testing) or Starter+ ($7/mo) for production
6. **Auto-Deploy**: Enable (auto-redeploy on Git push)

## Step 3: Add Environment Variables in Render

In Render dashboard, go to your service:

1. Click **Environment**
2. Add the following environment variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key (keep this secret!)
   - `SERVER_URL` = your Render service URL (e.g., `https://mindhaven-server.onrender.com`)
   - `PORT` = `5000` (optional, Render will assign this)

3. Click **Save Changes** → service will restart automatically

## Step 4: Update Frontend CORS and Socket URL

Once your Render server is deployed, update your frontend `.env` to point to it:

```env
VITE_SOCKET_SERVER_URL=https://mindhaven-server.onrender.com
```

Then rebuild and redeploy the frontend.

## Step 5: Update Server CORS for Production

In **server.js**, update the `allowedOrigins` set to include your production frontend domain:

```javascript
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://your-production-frontend.com",  // Add your production URL
]);
```

Commit and push—Render will auto-redeploy.

## How the Wakeup Call Works

The server calls its own `/health` endpoint every 10 minutes:

```javascript
// Every 10 minutes
fetch(`${SERVER_URL}/health`)
  .then(res => console.log("Wakeup call successful"))
  .catch(err => console.error("Wakeup call failed:", err))
```

This ensures the service stays active and doesn't get spun down by Render's free tier idle timeout (15 minutes).

**What happens without wakeup calls:**
1. If no WebSocket connections exist for 15 minutes, Render spins down the service
2. Next request takes 30 seconds to spin back up (cold start)
3. Real-time connectivity is broken

**With wakeup calls:**
- Server stays always-on
- No cold start delays
- Patients/therapists get instant Socket.io messages

## Monitoring & Logs

In Render dashboard:

1. Click your service
2. Go to **Logs** tab
3. Look for:
   - `"Server wakeup call successful"` entries (every 10 min) → healthy
   - `"Wakeup call failed"` → potential issue
   - `"User connected"` / `"User disconnected"` → real-time activity
   - Socket.io events (`"call-user"`, `"answer-call"`, etc.)

Example healthy log pattern:

```
User 123abc registered as doctor
call-user event received: Doctor 123abc → Patient 456def
Server wakeup call successful at 2026-04-10T14:32:10.123Z
Answer relayed to socket_xyz
Server wakeup call successful at 2026-04-10T14:42:10.456Z
```

## Troubleshooting

### Service keeps spinning down

**Problem**: Logs show no wakeup calls, service is offline frequently

**Solution**:
- Verify `SERVER_URL` environment variable is set correctly
- Check logs for failed health endpoint calls
- Ensure `SUPABASE_*` variables are correct (health check depends on them indirectly)
- Consider upgrading to Starter+ instance (free tier has more aggressive idle policies)

### Clients can't connect via Socket.io

**Problem**: "WebSocket handshake failed" in browser console

**Solution**:
- Verify frontend `VITE_SOCKET_SERVER_URL` points to your Render URL
- Check CORS settings—confirm production frontend domain is in `allowedOrigins`
- Ensure Render service is running (green status badge)
- Check firewall/proxy rules if on restricted network

### Admin endpoints return 500 errors

**Problem**: Create/delete therapist failing on server

**Solution**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (check Render environment)
- Confirm Supabase connection—run test from server logs
- Check Supabase auth token validity
- Look for specific error message in Render logs

## Scaling Beyond Free Tier

When you're ready for production stability:

1. Upgrade to **Render Starter+ ($7/month)** or higher
2. Configure auto-scaling if needed
3. Set up a custom domain (e.g., `api.mindhaven.com`)
4. Enable backups and monitoring
5. Consider a dedicated database instance for Supabase if throughput grows

## Deployment Checklist

- [ ] GitHub repo contains latest code
- [ ] `.gitignore` excludes `.env` files
- [ ] `SUPABASE_*` keys are stored in Render (not in code)
- [ ] `SERVER_URL` env var is set in Render
- [ ] Frontend `VITE_SOCKET_SERVER_URL` points to Render
- [ ] `allowedOrigins` in server.js includes production frontend URL
- [ ] Render service shows green status and is running
- [ ] Logs show "Server wakeup call successful" at regular intervals
- [ ] Manual test: Connect a patient and therapist, attempt a call
- [ ] Verify call signaling works (offer/answer/ICE candidates exchanged)

## Next Steps

1. Deploy to Render now using steps above
2. Test locally against the Render server (update `VITE_SOCKET_SERVER_URL`)
3. Once stable, deploy frontend to Netlify or Vercel
4. Monitor logs regularly in production
5. Set up alerts if desired (Render offers integrations)

