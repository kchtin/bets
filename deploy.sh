#!/bin/bash
set -e

LOG_FILE="/opt/sixhe/deploy.log"
mkdir -p "$(dirname "$LOG_FILE")"
# 同时输出到控制台和日志文件
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date)] 开始部署..."
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
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
# 禁用可能冲突的默认站点
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "==> 确保 Nginx 处于运行状态"
systemctl start nginx || true
systemctl reload-or-restart nginx

echo "==> 安装 Certbot（如尚未安装）"
if ! command -v certbot &>/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
fi

echo "==> 申请/检查 Let's Encrypt 证书"
DOMAIN="cldan.duckdns.org"
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  set +e
  certbot --nginx -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --no-eff-email \
    --redirect \
    --verbose
  CERT_EXIT=$?
  set -e
  echo "certbot 退出码: $CERT_EXIT"
  if [ $CERT_EXIT -ne 0 ]; then
    echo "证书申请失败，查看 /var/log/letsencrypt/letsencrypt.log"
    tail -n 50 /var/log/letsencrypt/letsencrypt.log || true
  fi
else
  echo "证书已存在，跳过申请"
fi

echo "==> 配置 DuckDNS 自动更新"
chmod +x duckdns/duckdns.sh
if ! crontab -l 2>/dev/null | grep -qF "duckdns/duckdns.sh"; then
  (crontab -l 2>/dev/null || true; echo "*/5 * * * * /opt/sixhe/duckdns/duckdns.sh >/dev/null 2>&1") | crontab -
fi

echo "==> 重启 webhook 服务以加载最新 webhook.js"
systemctl restart sixhe-webhook || systemctl restart webhook || true

echo "==> 最终重载 Nginx"
nginx -t
systemctl reload nginx

echo "[$(date)] 部署完成"
