# Emergent Clone

A self-hostable, full-stack clone of [emergent.sh](https://emergent.sh) — an AI-powered
app builder. Users chat with Claude Sonnet 4.5 to generate runnable web apps
(HTML/CSS/JS), preview them in-browser, download them as a `.zip`, and pay for
more credits via Stripe. Includes a built-in admin panel.

---

## Features

- ✨ **AI App Builder** — chat with Claude Sonnet 4.5 (via Emergent LLM key); each generation produces a real `index.html` + supporting files.
- 👀 **Live preview + code view** — sandboxed iframe + per-file code browser, with one-click ZIP download.
- 🔐 **Auth** — email/password signup & login, JWT-based session, role-based authorization.
- 💳 **Stripe billing** — credit packages, Stripe Checkout integration, webhook + polling for paid status, automatic credit grant.
- 🛠 **Admin panel** — configure Stripe keys at runtime, manage credit packages (create / edit / disable), manage users (change role, grant/revoke credits), review transactions.
- 👤 **Admin is also a user** — same account can build apps; you don't need a second login.
- 🏗 **Production stack** — React + Tailwind frontend (CRA), FastAPI + Motor (MongoDB) backend, served by nginx + systemd.

---

## Quick install on a fresh Ubuntu 22.04 / 24.04 VPS

> Need at least 2 GB RAM, 2 GB disk. Run everything as `root` (or with `sudo`).

```bash
# 1. Get the installer
git clone https://github.com/YOUR_USERNAME/emergent-clone.git
cd emergent-clone
chmod +x install.sh

# 2. Run it
sudo bash install.sh
```

The installer asks for, in order:

| Prompt | Example | Notes |
|---|---|---|
| Git repo URL | *(blank)* | Blank = use the directory you ran it from |
| Install directory | `/opt/emergent-clone` | Final location of the app |
| Public URL | `https://app.example.com` | Used as `REACT_APP_BACKEND_URL` and Stripe webhook URL |
| Admin email | `you@example.com` | Will be created as **admin + user** |
| Admin name | `Owner` | Display name |
| Admin password | *(hidden)* | Min 6 chars |
| MongoDB URL | `mongodb://localhost:27017` | If you keep `localhost`, MongoDB 7 is auto-installed |
| MongoDB DB name | `emergent_clone` | Created on first run |
| Stripe secret key | `sk_live_...` | **Optional** — settable later in the Admin panel |
| Stripe publishable key | `pk_live_...` | Same — optional now |
| JWT secret | *(blank)* | Blank = auto-generates 32-byte random hex |
| CORS origins | `https://app.example.com,*` | |

> **Auto-configured (no prompt):** the Emergent LLM key is bundled into the
> installer, and Stripe mode is set to `live`. You can change both later in
> `backend/.env` if needed.

> **Auto TLS:** if your Public URL starts with `https://` and points to a real
> domain (not an IP), the installer will run `certbot --nginx` for you and
> obtain a Let's Encrypt certificate. Make sure your DNS A-record points to
> the VPS *before* running the script.

It will then:

1. Install Node 20, Python 3.11, MongoDB 7 (if local), yarn, nginx.
2. Write `backend/.env` and `frontend/.env`.
3. Install backend deps into a venv + install `emergentintegrations`.
4. `yarn install && yarn build` for the frontend.
5. Create the systemd unit `emergent-backend.service` and start it.
6. Create the nginx vhost (port 80) pointing `/api/*` to FastAPI and the rest to the built React app.
7. Bootstrap the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

When it finishes, open the printed URL in a browser and log in with your admin
credentials. From the sidebar you can:

- **Projects** → see / open your builds.
- **New build** → start a fresh chat with the AI.
- **Billing & credits** → top up using your configured Stripe.
- **Admin** → site name, free-signup credits, Stripe keys, packages, users, free credit grants.

### Enable HTTPS

After your DNS A-record points to the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
```

Then update `frontend/.env` → `REACT_APP_BACKEND_URL=https://app.example.com`, and re-build:

```bash
cd /opt/emergent-clone/frontend && sudo yarn build
sudo systemctl reload nginx
```

---

## Manage the service

```bash
sudo systemctl status   emergent-backend
sudo systemctl restart  emergent-backend
sudo journalctl -fu     emergent-backend     # live logs

# Update the app to a new commit
cd /opt/emergent-clone
sudo git pull
sudo /opt/emergent-clone/backend/venv/bin/pip install -r backend/requirements.txt
( cd frontend && sudo yarn install && sudo yarn build )
sudo systemctl restart emergent-backend
sudo systemctl reload  nginx
```

---

## Configure Stripe from the Admin panel (recommended)

1. Log in as the admin user.
2. Go to **Admin → Settings**.
3. Paste your **Stripe secret key** and **publishable key**.
4. Switch **Stripe mode** to `live` when ready.
5. Click **Save**.
6. In your Stripe dashboard, add a webhook endpoint at:
   `https://app.example.com/api/webhook/stripe`
   listening for: `checkout.session.completed`, `checkout.session.async_payment_succeeded`.

You can also create / edit / disable credit packages from **Admin → Packages**.

---

## MongoDB connection details

`backend/.env` exposes:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="emergent_clone"
```

To use a managed MongoDB (Atlas, DigitalOcean, etc.) put your connection
string into `MONGO_URL`:

```env
MONGO_URL="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
DB_NAME="emergent_clone"
```

Then `sudo systemctl restart emergent-backend`. Indexes are created automatically
on first boot.

Collections used: `users`, `projects`, `packages`, `payment_transactions`, `settings`, `credit_logs`.

---

## API summary

All routes are mounted under `/api`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/` | – | Health check |
| `GET` | `/public/settings` | – | Site name + publishable Stripe key |
| `GET` | `/public/packages` | – | Active credit packages |
| `POST` | `/auth/signup` | – | Email/password signup |
| `POST` | `/auth/login` | – | Login (returns JWT) |
| `GET` | `/auth/me` | user | Current user |
| `GET` | `/projects` | user | List projects |
| `POST` | `/projects` | user | Create empty project |
| `GET` | `/projects/{id}` | user | Get one |
| `PATCH` | `/projects/{id}` | user | Rename |
| `DELETE` | `/projects/{id}` | user | Delete |
| `POST` | `/projects/{id}/chat` | user | Send AI message (1 credit) |
| `POST` | `/payments/checkout` | user | Start Stripe Checkout |
| `GET` | `/payments/status/{session_id}` | user | Poll payment status |
| `POST` | `/webhook/stripe` | Stripe | Webhook endpoint |
| `GET/PUT` | `/admin/settings` | admin | App settings |
| `GET/POST/PUT/DELETE` | `/admin/packages[/id]` | admin | Manage packages |
| `GET` | `/admin/users` | admin | List users |
| `PUT` | `/admin/users/{id}` | admin | Change role/credits |
| `POST` | `/admin/credits/adjust` | admin | Give/revoke credits |
| `GET` | `/admin/transactions` | admin | List Stripe transactions |

---

## License

MIT — do whatever you want.
