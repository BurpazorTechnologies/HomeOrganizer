add to /technology/projects/homeorganizer 
---
# Guest Chatbox Flow and Anti-Abuse Controls

## 1. Standard Guest Flow

### Load Page
- Server creates a guest session (`guest_id`, `session_id`), sets `HttpOnly` cookie.
- Frontend renders Turnstile/hCaptcha; holds the token.

### Request Chat Token
- `POST /api/guest/chat-token` with captcha token + CSRF.
- Server validates captcha, applies throttles, then issues a **short-lived JWT** (`ability: chat`, exp: 10–15m).

### WebSocket Connect
- Echo/Reverb connects using the short-lived token in headers/query.
- Use **private/presence channels** (no public broadcast).

### Send First Message
- Backend pipeline: **auth → throttles → content checks → persistence → broadcast**.

### Session Hardening
- Rotate JWT periodically; refresh via `/api/guest/refresh-chat-token`.
- After N messages or T minutes, step-up: require captcha again or **email/OTP** to continue.

---

## 2. Anti-Abuse Controls (Layered)

### Edge / Infra
- Put the app behind **Cloudflare/WAF** (bot fight mode, JS challenge on spikes, rate-limit rules per path `/api/guest/*` and `/reverb`).
- Separate **WS subdomain** (e.g., `ws.example.com`) with strict TLS, low idle timeouts, max frame size, and per-IP connection limits.

### App (Laravel)

#### Captcha
- Cloudflare Turnstile or hCaptcha on token issue and on the first message.
- Re-challenge after N messages.

#### Rate Limits (Redis)
- **Token endpoint**: 5/min per IP + 3/min per session.
- **Messages**: token bucket, e.g., 10/min burst 5 per `(IP|session|guest_id)`.
- **Channel subscribe**: 20/min per IP to block channel-surf.

#### Proof-of-Work (Optional)
- For bursty loads: send a small hash puzzle when score looks spammy; verify before accepting the next message.

#### Content Rules
- Max length (e.g., 800 chars), max URLs (e.g., 2), strip zero-width chars.
- Deduplicate: drop messages >80% similar in last 60s.
- Simple spam heuristics score: too many repeats, keyboard mash regex, link-only, emoji-only, etc.
    - If score ≥ threshold → captcha or tarpit.

#### Honeypots
- Hidden field; if present → silent drop + score bump.

#### Greylist / Tarpit
- Slow responses by 1–3s for low-reputation IPs.

#### Abuse Lists
- IP/CIDR deny, UA denies.
- Temporary bans (e.g., 30m) after repeated violations.

#### Step-Up Auth
- After ~20 messages or 10 minutes, require captcha.
- After ~50 messages/day, force **email OTP**.

#### Audit
- Store hashed(IP), UA, and risk score with each message for forensics.

### WebSocket
- **Auth guard**: verify JWT, check not expired, check ability `chat`.
- **Backpressure**: server-side queue with per-connection message rate; drop frames over size limit.
- **Disconnect policies**: idle timeout (e.g., 60s no pings), auto-disconnect on repeated 429s.  
