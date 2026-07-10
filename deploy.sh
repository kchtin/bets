#!/bin/bash
set -e

echo "[$(date)] 开始部署..."
cd /opt/sixhe

echo "==> git pull"
git pull origin main

echo "==> npm install"
cd react-ts
npm install

echo "==> npm run build"
npm run build

echo "==> reload nginx"
systemctl reload nginx

echo "[$(date)] 部署完成"
