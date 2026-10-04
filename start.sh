#!/bin/bash

# Garante que o NVM e os binários do Node sejam carregados
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:$PATH"

echo "🚀 Iniciando InvestHub (Backend API + Frontend Web)..."
trap 'kill 0' SIGINT SIGTERM EXIT

(cd backend && npm run dev) &
npm run dev
