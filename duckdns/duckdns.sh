#!/bin/bash
# DuckDNS 动态解析更新脚本
# 服务器每 5 分钟执行一次，保持 cldan.duckdns.org 指向当前公网 IP

DOMAIN="cldan"
TOKEN="d96389f6-5c63-4bd0-af44-df6696bc7df1"
LOG_FILE="/opt/sixhe/duckdns/duckdns.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date -Iseconds)] 更新 DuckDNS..." >> "$LOG_FILE"
curl -fsS -o - "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=" >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"
