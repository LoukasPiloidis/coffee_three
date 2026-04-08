# Coffee Three — Deployment Guide

Step-by-step guide to deploy Coffee Three to a Contabo VPS. Written assuming
you've never deployed a Dockerized app to a Linux server before. Follow it
top-to-bottom the first time.

Rough time: **2–3 hours** the first time, mostly waiting on DNS + Docker builds.

---

## Table of contents

1. [What you'll end up with](#1-what-youll-end-up-with)
2. [Prerequisites — accounts you'll need](#2-prerequisites--accounts-youll-need)
3. [Buy a Contabo VPS](#3-buy-a-contabo-vps)
4. [Point your domain at the VPS](#4-point-your-domain-at-the-vps)
5. [First login & securing the server](#5-first-login--securing-the-server)
6. [Install Docker](#6-install-docker)
7. [Sign up for third-party services](#7-sign-up-for-third-party-services)
8. [Get the code onto the VPS](#8-get-the-code-onto-the-vps)
9. [Create the `.env` file](#9-create-the-env-file)
10. [First deploy](#10-first-deploy)
11. [Verify everything works](#11-verify-everything-works)
12. [Test a backup restore (don't skip this)](#12-test-a-backup-restore-dont-skip-this)
13. [Day-to-day operations](#13-day-to-day-operations)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What you'll end up with

A single Contabo VPS running, inside Docker:

- **app** — the Next.js site
- **db** — Postgres 17 with a persistent volume
- **migrate** — runs database migrations on each deploy, then exits
- **caddy** — reverse proxy with automatic HTTPS (Let's Encrypt)
- **db-backup** — daily `pg_dump`, rotated (14 daily / 8 weekly / 12 monthly)

Publicly reachable at `https://your-domain.com`.

---

## 2. Prerequisites — accounts you'll need

Create these before you start. All free or cheap.

1. **A domain name.** Anywhere (Namecheap, Porkbun, Cloudflare Registrar, etc.).
   ~$10/year. You need to be able to edit its DNS records.
2. **Contabo account** — https://contabo.com
3. **Keystatic Cloud account** — https://keystatic.cloud (CMS for the menu in prod)
4. **A GitHub account** with the `coffee_three` repo pushed to it (private is fine)

You also need, on your local machine:

- An **SSH key pair**. Check with `ls ~/.ssh/id_*.pub`. If empty:
  ```bash
  ssh-keygen -t ed25519 -C "your-email@example.com"
  ```
  Press enter through the prompts. This creates `~/.ssh/id_ed25519` (private,
  never share) and `~/.ssh/id_ed25519.pub` (public, safe to paste anywhere).

---

## 3. Buy a Contabo VPS

1. Go to https://contabo.com → VPS → **VPS 10** (3 vCPU / 8 GB RAM / 75 GB NVMe).
   VPS 10 is plenty for a few hundred orders/day.
2. During checkout:
   - **Region**: closest to your customers. For Greece pick **EU (Nuremberg)**
     or **EU (Düsseldorf)**.
   - **Image**: **Ubuntu 24.04**.
   - **Login**: choose **SSH key** and paste the contents of
     `~/.ssh/id_ed25519.pub`. (You can also pick a root password as a backup.)
   - **Add-ons**: none. Skip the daily snapshot upsell — we're doing our own
     backups.
3. Pay. Contabo sends a welcome email when provisioning is done (usually
   within an hour, sometimes up to 24h on their free tier VPSes).
4. In that email, note the **IP address** of your new server.

---

## 4. Point your domain at the VPS

At your domain registrar's DNS panel, create two records:

| Type | Name | Value              | TTL  |
|------|------|--------------------|------|
| A    | `@`  | `<your VPS IP>`    | 300  |
| A    | `www`| `<your VPS IP>`    | 300  |

(`@` means the bare domain, e.g. `coffee-three.gr`. `www` is the `www.`
subdomain.)

DNS can take a few minutes to propagate. Verify from your laptop:

```bash
dig +short your-domain.com
# should print your VPS IP
```

If it doesn't resolve yet, wait 5–10 minutes and try again. Don't proceed
until DNS is correct — Caddy will fail to get a TLS cert otherwise.

---

## 5. First login & securing the server

### 5.1 SSH in as root

```bash
ssh root@<your VPS IP>
```

First time, it'll ask about the host key fingerprint — type `yes`.

### 5.2 Update the system

```bash
apt update && apt upgrade -y
```

If it prompts about configuration files or restarting services, accept the
defaults (press enter / select "keep local").

### 5.3 Create a non-root user

Running everything as root is a bad habit. Make a user for yourself:

```bash
adduser deploy
# Set a strong password. You can skip the "Full Name" etc. prompts with enter.
usermod -aG sudo deploy
```

Copy your SSH key to the new user so you can log in without a password:

```bash
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

In **a new terminal window** (keep the root session open as a safety net),
verify you can log in as `deploy`:

```bash
ssh deploy@<your VPS IP>
sudo whoami   # should print "root" after typing deploy's password
```

If that works, you can exit the root session.

### 5.4 Disable root SSH and password login

Still as `deploy`, edit the SSH config:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change (or add) these lines:

```
PermitRootLogin no
PasswordAuthentication no
```

Save (`Ctrl+O`, enter, `Ctrl+X`), then:

```bash
sudo systemctl restart ssh
```

**Keep your current session open.** In another terminal try
`ssh root@<IP>` — it should be rejected. Good.

### 5.5 Firewall

Ubuntu ships with `ufw`. Allow only what you need:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Type `y` to confirm. Check:

```bash
sudo ufw status
```

Should show `22`, `80`, `443` as `ALLOW`.

### 5.6 Automatic security updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Select **Yes**. This applies OS security patches automatically.

---

## 6. Install Docker

Docker isn't in Ubuntu's default repos in a usable version. Use Docker's
official install script:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Let the non-root user run `docker` without `sudo`:

```bash
sudo usermod -aG docker deploy
```

**Log out and back in** (`exit`, then `ssh deploy@<IP>`) for the group
change to take effect. Verify:

```bash
docker run --rm hello-world
```

You should see a "Hello from Docker!" message. If it asks for sudo, your
group change didn't take effect — log out and in again.

Docker Compose v2 is included with modern Docker — verify:

```bash
docker compose version
# Docker Compose version v2.x.x
```

---

## 7. Sign up for third-party services

You need credentials/tokens from four services. Gather them all before
step 9, where you'll paste them into `.env`.

### 7.1 Keystatic Cloud

1. Sign up at https://keystatic.cloud with your GitHub account.
2. Create a team if you don't have one.
3. Create a new project. Name it whatever. After creation, you'll see an
   identifier like `your-team/coffee-three`. Copy that.
4. In the project settings, connect it to your GitHub repo for the menu
   content to sync via git. Follow the in-app instructions.

### 7.2 Generate AUTH_SECRET

On your laptop (or on the VPS, doesn't matter):

```bash
openssl rand -base64 32
```

Copy the output. This is `AUTH_SECRET`.

### 7.3 Pick a strong POSTGRES_PASSWORD

Another random string — anything secure:

```bash
openssl rand -base64 24
```

---

## 8. Get the code onto the VPS

The app is built from source on the VPS (no prebuilt image registry needed).

### 8.1 Clone the repo

On the VPS as `deploy`:

```bash
cd ~
git clone https://github.com/<your-username>/coffee_three.git
cd coffee_three
```

If the repo is **private**, either make it public temporarily, or use a
GitHub deploy key. **All commands in this subsection run on the VPS as
`deploy`** — the deploy key authorizes this specific machine to clone, so the
keypair must be generated on the VPS, not on your laptop.

1. **On the VPS**, generate a fresh keypair and print the public half:

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
   cat ~/.ssh/github_deploy.pub
   ```

2. **In your browser**, copy the printed `ssh-ed25519 …` line and add it on
   GitHub: **Repo → Settings → Deploy keys → Add deploy key**. Title it
   something like `coffee-three-vps`. Leave "Allow write access" off.

3. **Back on the VPS**, tell SSH to use that key for `github.com`, then
   clone:

   ```bash
   cat >> ~/.ssh/config <<'EOF'
   Host github.com
     IdentityFile ~/.ssh/github_deploy
     StrictHostKeyChecking no
   EOF
   chmod 600 ~/.ssh/config

   # Sanity check — should print "Hi <user>/coffee_three! …"
   ssh -T git@github.com

   git clone git@github.com:<your-username>/coffee_three.git
   cd coffee_three
   ```

   If `ssh -T` says `Permission denied (publickey)`, the deploy key wasn't
   added correctly on GitHub — re-check that the pubkey you pasted matches
   `cat ~/.ssh/github_deploy.pub` on the VPS exactly.

---

## 9. Create the `.env` file

Inside `~/coffee_three` on the VPS:

```bash
cp .env.production.example .env
nano .env
```

Fill in every value. Here's what each one is for:

```bash
# Postgres — pick strong values. The app talks to db via the internal
# docker network, so the "host" part doesn't matter here; compose wires it.
POSTGRES_USER=coffee
POSTGRES_PASSWORD=<the strong password you generated>
POSTGRES_DB=coffee

# better-auth
AUTH_SECRET=<the openssl rand -base64 32 output>
AUTH_URL=https://your-domain.com   # must be https + your real domain

# Staff
STAFF_EMAIL=you@your-domain.com    # the email address that gets staff role
                                   # the first time it signs up

# Caddy — the domain it should serve + request a cert for
CADDY_DOMAIN=your-domain.com

# Keystatic Cloud project identifier
NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT=your-team/coffee-three
```

Save (`Ctrl+O`, enter, `Ctrl+X`).

**Verify permissions** so nobody else can read it:

```bash
chmod 600 .env
```

---

## 10. First deploy

Still inside `~/coffee_three`:

```bash
docker compose up -d --build
```

What happens:

1. Docker pulls base images (`postgres:17-alpine`, `caddy:2-alpine`,
   `prodrigestivill/postgres-backup-local`).
2. It builds the app image from the `Dockerfile` — this runs `pnpm install`
   and `pnpm build`. **First build takes 5–10 minutes.** Subsequent builds
   reuse cached layers and take ~1 minute.
3. `db` starts, waits for healthcheck.
4. `migrate` runs, creates all tables, exits.
5. `app`, `caddy`, `db-backup` start.
6. Caddy reaches out to Let's Encrypt, gets a TLS cert, starts serving HTTPS.
   **This only works if your DNS is correct** (step 4).

Watch the logs to see things start up:

```bash
docker compose logs -f
```

Press `Ctrl+C` to stop tailing (the containers keep running in the
background — `-d` in the up command means "detached").

Check all containers are up:

```bash
docker compose ps
```

All services except `migrate` should be `running` or `healthy`. `migrate`
should be `exited (0)` — that's correct, it's a one-shot.

---

## 11. Verify everything works

### 11.1 The site loads

Open `https://your-domain.com` in a browser. You should see:

- The locale-prefixed homepage (it'll redirect to `/el`).
- A padlock icon — HTTPS is working.

If you get a "your connection is not private" warning, Caddy hasn't finished
getting a cert yet. Wait 30 seconds, refresh. If it persists after a few
minutes, jump to [Troubleshooting](#14-troubleshooting).

### 11.2 Sign in works

1. Go to `https://your-domain.com/el/signup`.
2. Create an account using the email you set as `STAFF_EMAIL`. Pick any
   password (≥ 8 chars).
3. You should land back on the site, signed in.
4. Because this email matches `STAFF_EMAIL`, the `databaseHooks.user.create.after`
   hook in `src/auth.ts` promoted you to `role: 'staff'`.

### 11.3 Staff dashboard

Go to `https://your-domain.com/staff`. You should see the orders dashboard
(empty so far). If you get a 401/403, the staff promotion didn't happen —
see [Troubleshooting](#14-troubleshooting).

### 11.4 Menu (Keystatic)

Go to `https://your-domain.com/keystatic`. Sign in with GitHub (same account
connected to your Keystatic Cloud project). You should see the CMS with the
initial categories/items from the repo's `content/` directory.

### 11.5 Place a test order

1. Add an item to the cart from the homepage.
2. Go to `/cart` → **Checkout**.
3. Fill in a delivery address inside one of the allowed postcodes (from
   Keystatic settings).
4. Submit.
5. You should land on the order status page at `/order/<token>`.
6. On the staff dashboard, the order should appear within 6 seconds.

### 11.6 The first backup ran

The backup runs at the configured schedule (`@daily`, midnight container
time). To force one immediately:

```bash
docker compose exec db-backup /backup.sh
docker compose exec db-backup ls -lh /backups/last
```

You should see a `coffee-latest.sql.gz` (and a dated file in `/backups/daily`).

---

## 12. Test a backup restore (don't skip this)

**An untested backup is not a backup.** Do this once, right after your first
successful deploy, while the stakes are low.

Create a throwaway database next to the real one and restore into it:

```bash
# Create the test database
docker compose exec db psql -U coffee -c "CREATE DATABASE coffee_restore_test;"

# Restore the latest dump into it
docker compose exec db-backup sh -c 'gunzip -c /backups/last/coffee-latest.sql.gz' \
  | docker compose exec -T db psql -U coffee -d coffee_restore_test

# Confirm tables exist
docker compose exec db psql -U coffee -d coffee_restore_test -c "\dt"

# Clean up
docker compose exec db psql -U coffee -c "DROP DATABASE coffee_restore_test;"
```

If `\dt` lists the expected tables (`users`, `orders`, `order_items`, etc.),
your backups are valid and restorable. Sleep well.

---

## 13. Day-to-day operations

### 13.1 Deploying a new version

On your laptop: push changes to GitHub. On the VPS:

```bash
cd ~/coffee_three
git pull
docker compose up -d --build
```

- Only the `app` image rebuilds (the other services don't change).
- `migrate` will re-run — migrations are idempotent (`scripts/migrate.mjs`
  tracks applied ones in a `_migrations` table).
- Caddy, db, db-backup keep running untouched.

Downtime during a deploy is ~5 seconds while the new `app` container takes
over.

### 13.2 Watching logs

```bash
# Live tail from all services
docker compose logs -f

# Just the app
docker compose logs -f app

# Last 200 lines of the db
docker compose logs --tail 200 db

# Last hour, capped at 500 lines
docker compose logs --since 1h --tail 500 app

# Search across one service
docker compose logs app | grep -i error

# Since a specific timestamp (RFC3339)
docker compose logs --since 2026-04-08T08:00 app
```

Logs are stored on disk by Docker's `json-file` driver, rotated at
**10 MB × 5 files per service** (configured in `docker-compose.yml`). That
gives you ~50 MB of recent history per container, fully searchable from
SSH. No third-party log shipper required.

If you ever want a small web UI for browsing logs without leaving the
browser, [Dozzle](https://dozzle.dev) is a single self-hosted container
with no DB — drop it into `docker-compose.yml` later if needed.

### 13.3 Restarting things

```bash
docker compose restart app          # restart just the app
docker compose down && docker compose up -d   # full restart
```

### 13.4 Running a one-off psql

```bash
docker compose exec db psql -U coffee -d coffee
```

### 13.5 Promoting a user to staff

The first user to sign up with the email in `STAFF_EMAIL` is auto-promoted
to the `staff` role by `databaseHooks.user.create.after` in `src/auth.ts`.
For anyone else — adding a second staff member, fixing an account that
signed up before `STAFF_EMAIL` was set, or recovering from a typo — promote
them manually with this one-liner:

1. **From your laptop**, SSH into the VPS as the `deploy` user:

   ```bash
   ssh deploy@<your VPS IP>
   ```

2. **On the VPS**, change into the project directory (where
   `docker-compose.yml` lives — without this, `docker compose` doesn't know
   which stack to talk to):

   ```bash
   cd ~/coffee_three
   ```

3. **Run the promotion query** through the running `db` container. Replace
   `you@your-domain.com` with the user's exact email (case-insensitive
   match, but otherwise verbatim — no aliases):

   ```bash
   docker compose exec db psql -U coffee -d coffee \
     -c "UPDATE \"user\" SET role='staff' WHERE lower(email)=lower('you@your-domain.com');"
   ```

   Note the **quoted `"user"`** — `user` is a reserved word in Postgres, so
   it has to be wrapped in double quotes. The command should print
   `UPDATE 1`. If it prints `UPDATE 0`, the email doesn't match any row —
   double-check spelling and that the person has already signed up at least
   once.

4. **Verify** (optional):

   ```bash
   docker compose exec db psql -U coffee -d coffee \
     -c "SELECT email, role FROM \"user\" WHERE role='staff';"
   ```

5. **Tell the user to sign out and back in.** Better-auth caches the role on
   the session row, so an existing session still says `customer` until they
   re-authenticate. After signing in again, they can hit
   `https://your-domain.com/staff`.

To **demote** someone, swap `'staff'` for `'customer'` in the same UPDATE.
To delete the account entirely, `DELETE FROM "user" WHERE email='…';` —
that cascades to their `session`, `account`, `addresses`, and detaches
their orders (orders are kept with `user_id` set to NULL by the FK's
`ON DELETE SET NULL`, so order history isn't lost).

### 13.6 Freeing disk (eventually)

Old Docker images pile up over time. Every few months:

```bash
docker image prune -f
```

Check disk usage:

```bash
df -h /
docker system df
```

### 13.7 Monitoring

- **Uptime**: sign up at https://uptimerobot.com (free), add a monitor for
  `https://your-domain.com`, alert to your email if it goes down.
- **Host resources**: SSH in and check `htop`, `df -h`, `docker stats`. At
  this scale a once-a-week glance is plenty.

### 13.8 Rotating secrets

If a secret leaks:

1. Regenerate it.
2. Update `.env` on the VPS.
3. `docker compose up -d` — the affected container restarts with new env.

`AUTH_SECRET` is a special case — rotating it signs everyone out. Not a
disaster, but don't do it casually.

---

## 14. Troubleshooting

### Caddy can't get a certificate

Symptoms: browser shows a self-signed cert warning, or `curl` on HTTPS fails.

```bash
docker compose logs caddy | tail -50
```

Common causes:

- **DNS not propagated yet.** Run `dig +short your-domain.com` — if it
  doesn't show your VPS IP, wait or fix the DNS record.
- **Port 80 blocked.** Let's Encrypt validates over port 80. Check `sudo ufw
  status` and that nothing else is listening on 80 (`sudo ss -tlnp | grep :80`
  should only show Docker).
- **Rate-limited.** If you deployed and broke things many times in a row,
  Let's Encrypt rate-limits (5 failures per hour per hostname). Wait an hour.

### `migrate` container exits with code ≠ 0

```bash
docker compose logs migrate
```

Usually means a migration file is broken or the DB isn't reachable. Fix the
issue, then re-run:

```bash
docker compose up -d migrate
```

### App container keeps restarting

```bash
docker compose logs app | tail -100
```

Most common: a missing or wrong env var. Look for `throw` messages referring
to `AUTH_SECRET`, `DATABASE_URL`, etc. Fix `.env`, then:

```bash
docker compose up -d app
```

### Staff dashboard returns 403

Auto-promotion fires once, the moment a user with `STAFF_EMAIL` first signs
up. If the account already existed before `STAFF_EMAIL` was set, or the
email was a typo, the row's `role` is still `customer`. Promote it manually
following [§13.5 Promoting a user to staff](#135-promoting-a-user-to-staff),
then have the user sign out and back in.

### The VPS is slow / out of memory

Very unlikely at this scale, but:

```bash
free -h              # RAM usage
docker stats         # per-container usage (Ctrl+C to exit)
df -h                # disk
```

If Postgres is eating too much RAM, add `shared_buffers=128MB` and
`work_mem=4MB` env vars. If the app is leaking, restart it:
`docker compose restart app`.

### "I broke something and want to start over"

Nuclear option — **this wipes all data including the database**:

```bash
docker compose down -v    # -v removes volumes (db-data, db-backups, ...)
docker compose up -d --build
```

Don't run this in anger once you have real orders.

---

## Appendix: file reference

Files created/modified by this deployment (relative to repo root):

- `docker-compose.yml` — service definitions for app, db, caddy, db-backup
- `Caddyfile` — reverse proxy + auto-HTTPS config
- `Dockerfile` — multi-stage build for the Next.js standalone output
- `.env.production.example` — template for the `.env` you create on the VPS
- `.env` — **never commit this**, it's gitignored; holds all real secrets
- `scripts/migrate.mjs` — idempotent migration runner, invoked by the `migrate` service
