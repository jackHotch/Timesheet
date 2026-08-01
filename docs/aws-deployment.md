# Deploying Timesheet to a single AWS EC2 instance

This is a click-through runbook for standing up the app on one EC2 instance via the console (no Terraform/CDK, no Docker/ECS). The client and API run as plain Node processes under pm2, fronted by Caddy for TLS. Deploys are a `git pull` + rebuild over SSH, triggered by GitHub Actions.

Region used throughout: **us-east-1**.

## 0. Naming convention

| Resource | Name |
|---|---|
| EC2 instance | `timesheet-server` |
| Security group | `timesheet-ec2-sg` |
| IAM role (instance profile) | `timesheet-ec2-role` |
| Elastic IP | `timesheet-eip` |

## Prerequisites

- A Neon Postgres project exists; you have its host, port, user, password, database name.
- `simpletimesheet.app` is registered and DNS-hosted at Cloudflare.
- You have an AWS account with console access and can create IAM roles.
- You have an SSH key pair to use for both console access and GitHub Actions deploys (create one during instance launch, or bring your own).

## 1. IAM — instance role

IAM → Roles → **Create role** → trusted entity: AWS service → **EC2**.

**`timesheet-ec2-role`**
- Inline policy: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::<your-bucket>` and `arn:aws:s3:::<your-bucket>/*`.
- This is what replaces static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` — the API's S3 client falls back to the instance profile automatically via the AWS SDK's default credential chain (same code path that supported ECS task roles before; see `api/src/aws/s3.service.ts`).

## 2. Networking — security group

Use the **default VPC**.

`timesheet-ec2-sg` inbound rules:
- TCP 22 (SSH) from `0.0.0.0/0` — restrict to your admin IP if you have a static one; GitHub Actions' runner IPs are not static, so this can't be locked down to GitHub alone. Key-based auth is the real protection here.
- TCP 80 from `0.0.0.0/0` and `::/0` — Caddy needs this for the ACME HTTP-01 challenge and to redirect to HTTPS.
- TCP 443 from `0.0.0.0/0` and `::/0`.

Outbound: all (needed to reach Neon, S3, npm registry, Let's Encrypt).

## 3. EC2 instance

1. EC2 → **Launch instance** → name `timesheet-server`.
2. AMI: Ubuntu 24.04 LTS (or Amazon Linux 2023 — adjust package manager commands below accordingly).
3. Instance type: `t3.small` (1 vCPU / 2 GB is tight for two Node builds running back to back; `t3.micro` will work but expect slow `npm ci`/`next build` steps and possible OOM — size up if that happens).
4. Key pair: select or create one. Save the private key — it becomes the `EC2_SSH_KEY` GitHub secret.
5. Network settings: default VPC, auto-assign public IP **enabled**, security group `timesheet-ec2-sg`.
6. Storage: 20 GiB gp3 (two Node projects' `node_modules` plus build output add up).
7. Advanced → IAM instance profile: `timesheet-ec2-role`.
8. Launch.
9. EC2 → **Elastic IPs** → **Allocate** → associate it with `timesheet-server`, so the public IP survives a stop/start.

## 4. Cloudflare — DNS

Add two DNS records (proxy status **DNS only** / grey cloud — Caddy needs to see the real client IP and handle its own TLS via the ACME challenge, which Cloudflare's proxy would interfere with):
- `simpletimesheet.app` (apex) → A → the instance's Elastic IP.
- `api.simpletimesheet.app` → A → the same Elastic IP.

Wait for DNS to propagate before continuing (Caddy will retry certificate issuance on its own, but it's simpler to get DNS right first).

## 5. Server setup

SSH into the instance (`ssh -i your-key.pem ubuntu@<elastic-ip>`) and run:

```bash
# Swap — next build alone needs 1.5-2GB; without swap, small instances
# (t3.micro/t3.small) OOM-kill the build (shows up as "Bus error (core dumped)").
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# pm2
sudo npm install -g pm2

# Caddy
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

Clone the repo and create the runtime env files (these are gitignored — `git pull` on future deploys will never touch or overwrite them):

```bash
git clone https://github.com/jackHotch/Timesheet.git ~/timesheet
cd ~/timesheet
```

`~/timesheet/api/.env`:
```
PORT=8080
CLIENT_URL=https://simpletimesheet.app
JWT_SECRET=<a long random string, not the default>
DATABASE_HOST=<your Neon host>
DATABASE_PORT=5432
DATABASE_USER=<your Neon user>
DATABASE_PASSWORD=<your Neon password>
DATABASE_NAME=<your Neon database name>
DATABASE_SSL=true
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your S3 bucket name>
```

`~/timesheet/client/.env.production` (only `NEXT_PUBLIC_*` vars matter here — they're baked in at `next build` time):
```
NEXT_PUBLIC_API_URL=https://api.simpletimesheet.app
```

Point Caddy at the repo's checked-in config and start everything:

```bash
sudo rm -f /etc/caddy/Caddyfile
sudo ln -s ~/timesheet/deploy/ec2/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy

cd ~/timesheet/api && npm ci && npm run migrate:up && npm run build && cd ..
cd ~/timesheet/client && npm ci && npm run build && cd ..

pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it prints (registers pm2 to survive reboots)
```

Visit `https://simpletimesheet.app` and `https://api.simpletimesheet.app/health` — Caddy issues Let's Encrypt certificates automatically on first request to each hostname, so the first hit may take a few seconds.

> If you ever edit `deploy/ec2/Caddyfile`, `git pull` on the instance picks up the change automatically (it's a symlink), but you still need `sudo systemctl reload caddy` afterward — that step isn't part of the automated deploy script since the Caddyfile rarely changes.

## 6. GitHub repository configuration

Repo Settings → **Secrets and variables** → **Actions** → **Secrets**:
- `EC2_HOST` = the instance's Elastic IP (or a DNS name pointing to it).
- `EC2_USER` = `ubuntu` (or `ec2-user` if you used Amazon Linux).
- `EC2_SSH_KEY` = the private key from step 3, pasted in full (contents of the `.pem` file).

No AWS credentials or OIDC role are needed in GitHub Actions anymore — the deploy is a plain SSH session, and migrations run on the instance itself using the DB credentials already in `api/.env`.

## 7. First push & validation

1. Push to `production`. Watch Actions → `Deploy` run the SSH step: `git pull`, `npm ci`/`migrate:up`/`build` for both apps, then `pm2 reload`.
2. `ssh` in and run `pm2 status` — both `timesheet-api` and `timesheet-client` should show `online`. `pm2 logs` to tail output if something's wrong.
3. Visit `https://simpletimesheet.app` (client should load) and `https://api.simpletimesheet.app/health` (should return `{"status":"ok"}`) — both over valid HTTPS.
4. Log in through the client and exercise a file-upload/invoice flow to confirm the API's S3 instance-role permissions are working end-to-end.

## Related code changes made for this deployment

- `ecosystem.config.js` (repo root) — pm2 process definitions for `timesheet-api` (`node dist/src/main.js`) and `timesheet-client` (`next start -p 3000`).
- `deploy/ec2/Caddyfile` — reverse proxy + automatic TLS for both hostnames; symlinked from `/etc/caddy/Caddyfile` on the instance.
- `.github/workflows/deploy.yml` — replaced the ECR build/push + ECS task-definition rendering with a single SSH step that pulls, rebuilds, and `pm2 reload`s on the instance.
- `api/package.json` — fixed `start:prod` to point at the actual Nest build output path (`dist/src/main`, matching `nest-cli.json`'s `sourceRoot`).
- `client/next.config.mjs` — dropped `output: 'standalone'` (a Docker-only optimization; irrelevant now that the client runs via `next start`).
- `api/src/aws/s3.service.ts` — comment updated to reflect that the fallback credential chain now resolves via the EC2 instance profile rather than an ECS task role (the code itself didn't need to change).
- Removed: `deploy/ecs/*.json` task definitions, `api/Dockerfile`, `client/Dockerfile` (the production multi-stage builds — `Dockerfile.dev` files are untouched and still used for local `docker compose` dev).
