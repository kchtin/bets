#!/bin/bash
set -e

echo "[$(date)] 开始部署..."
cd /opt/sixhe

echo "==> git pull"
git pull origin main

echo "==> 安装/更新依赖"
cd react-ts
npm install

echo "==> 构建前端"
npm run build

cd /opt/sixhe

echo "==> 同步 Nginx 配置"
cp nginx/sixhe.conf /etc/nginx/sites-enabled/sixhe.conf
nginx -t

echo "==> 安装 Certbot（如尚未安装）"
if ! command -v certbot &>/dev/null; then
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
fi

echo "==> 申请/检查 Let's Encrypt 证书"
DOMAIN="cldan.duckdns.org"
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  certbot --nginx -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --no-eff-email \
    --redirect
else
  echo "证书已存在，跳过申请"
fi

echo "==> 配置 DuckDNS 自动更新"
chmod +x duckdns/duckdns.sh
# 避免重复添加 cron 任务
if ! crontab -l 2>/dev/null | grep -qF "duckdns/duckdns.sh"; then
  (crontab -l 2>/dev/null || true; echo "*/5 * * * * /opt/sixhe/duckdns/duckdns.sh >/dev/null 2>&1") | crontab -
fi

echo "==> 重载 Nginx"
systemctl reload nginx

echo "[$(date)] 部署完成"
