#!/bin/bash
set -e

LOG_FILE="/opt/sixhe/deploy.log"
mkdir -p "$(dirname "$LOG_FILE")"
# 同时输出到控制台和日志文件
exec > >(tee -a "$LOG_FILE") 2>&1

DOMAIN="cd.380540612.xyz"
CONF_SRC="nginx/sixhe.conf"
CONF_DST="/etc/nginx/sites-enabled/sixhe.conf"

echo "[$(date)] 开始部署..."
cd /opt/sixhe

echo "==> 丢弃 npm install 在服务器上产生的 package-lock 本地改动"
git checkout -- react-ts/package-lock.json || true

echo "==> git pull"
git pull origin main

echo "==> 安装/更新依赖"
cd react-ts
npm install

echo "==> 构建前端"
npm run build

cd /opt/sixhe

# 首次部署时才覆盖 Nginx 配置并申请证书；证书申请成功后不再覆盖，
# 避免 certbot 写入的 SSL 配置被模板重置。
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "==> 首次部署：同步 Nginx 配置"
  cp "$CONF_SRC" "$CONF_DST"
  sed -i "s/server_name .*/server_name ${DOMAIN};/" "$CONF_DST"
  nginx -t

  echo "==> 确保 Nginx 处于运行状态"
  systemctl start nginx || true
  systemctl reload-or-restart nginx

  echo "==> 安装 Certbot"
  if ! command -v certbot &>/dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
  fi

  echo "==> 申请 Let's Encrypt 证书"
  certbot --nginx -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --redirect
else
  echo "==> 证书已存在，跳过 Nginx 配置覆盖与证书申请"
fi

echo "==> 配置 DuckDNS 自动更新（cldan）"
chmod +x duckdns/duckdns.sh
if ! crontab -l 2>/dev/null | grep -qF "duckdns/duckdns.sh"; then
  (crontab -l 2>/dev/null || true; echo "*/5 * * * * /opt/sixhe/duckdns/duckdns.sh >/dev/null 2>&1") | crontab -
fi

echo "==> 重启 webhook 服务"
systemctl restart sixhe-webhook || true

echo "==> 最终检查并重载 Nginx"
nginx -t
systemctl reload nginx

echo "[$(date)] 部署完成"
