# Nginx Homelab Automation

This project includes a script to generate and optionally install an nginx site config for your sub-domain routing.

## Files

- `ops/nginx/divid-site.conf.template`: nginx template with placeholders
- `scripts/setup-nginx-site.sh`: generator and installer
- `ops/nginx/generated/`: rendered configs

## Generate a Site Config

```bash
bash scripts/setup-nginx-site.sh --domain app.example.com
```

This writes:

`ops/nginx/generated/app.example.com.conf`

Default upstream host ports:

- Frontend: `18081`
- Backend API: `18080`

## Generate + Install into nginx

```bash
bash scripts/setup-nginx-site.sh --domain app.example.com --install
```

Install mode does:

1. Copies config to `/etc/nginx/sites-available/<name>.conf`
2. Symlinks it into `/etc/nginx/sites-enabled/<name>.conf`
3. Runs `nginx -t`
4. Verifies the site is enabled and points to the expected config file
5. Restarts nginx
6. Verifies nginx is active and that `server_name <domain>` appears in active config
7. Probes `http://127.0.0.1/` with `Host: <domain>` and prints the returned HTTP code

## Optional Overrides

```bash
bash scripts/setup-nginx-site.sh \
  --domain app.example.com \
  --frontend-port 18081 \
  --backend-port 18080 \
  --name divid-app
```

## Makefile Shortcuts

```bash
make nginx-site DOMAIN=app.example.com
make nginx-site-install DOMAIN=app.example.com
```