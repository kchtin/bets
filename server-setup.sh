#!/bin/bash
# 在服务器上以 root 身份执行：bash server-setup.sh
set -e

PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKs4lYH3B5KhYXyUiC/4Pp9S9HoXfwAoX7V177XlqAak sixhe-deploy@kchtinMacBook-Air.local"

echo "==> 添加部署公钥..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
if ! grep -qF "$PUB_KEY" ~/.ssh/authorized_keys; then
  echo "$PUB_KEY" >> ~/.ssh/authorized_keys
fi

echo "==> 配置 SSH 端口 22 并启用密钥登录..."
SSH_CONFIG="/etc/ssh/sshd_config"

# 确保 Port 22
if grep -qE '^#?\s*Port\s+' "$SSH_CONFIG"; then
  sed -i 's/^#\?\s*Port\s\+.*/Port 22/' "$SSH_CONFIG"
else
  echo "Port 22" >> "$SSH_CONFIG"
fi

# 允许 root 用密钥登录
if grep -qE '^#?\s*PermitRootLogin\s+' "$SSH_CONFIG"; then
  sed -i 's/^#\?\s*PermitRootLogin\s\+.*/PermitRootLogin prohibit-password/' "$SSH_CONFIG"
else
  echo "PermitRootLogin prohibit-password" >> "$SSH_CONFIG"
fi

# 启用公钥认证
if grep -qE '^#?\s*PubkeyAuthentication\s+' "$SSH_CONFIG"; then
  sed -i 's/^#\?\s*PubkeyAuthentication\s\+.*/PubkeyAuthentication yes/' "$SSH_CONFIG"
else
  echo "PubkeyAuthentication yes" >> "$SSH_CONFIG"
fi

# 保留密码登录，防止密钥没配好把你锁在外面；等密钥登录验证通过后再手动关闭
if grep -qE '^#?\s*PasswordAuthentication\s+' "$SSH_CONFIG"; then
  sed -i 's/^#\?\s*PasswordAuthentication\s\+.*/PasswordAuthentication yes/' "$SSH_CONFIG"
else
  echo "PasswordAuthentication yes" >> "$SSH_CONFIG"
fi

echo "==> 重启 SSH 服务..."
if command -v systemctl &>/dev/null; then
  systemctl restart sshd || systemctl restart ssh
elif command -v service &>/dev/null; then
  service sshd restart || service ssh restart
fi

echo "==> 完成。当前配置："
echo "    端口：22"
echo "    root 密钥登录：已启用"
echo "    root 密码登录：仍保留（确认密钥能登后再关闭）"
