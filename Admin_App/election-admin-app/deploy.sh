#!/bin/bash

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install serve to serve static files
sudo npm install -g serve

# Navigate to app directory
cd /home/ubuntu/election-admin-app

# Install dependencies
npm install

# Build the React app
npm run build

# Serve the build folder on port 80
sudo pm2 start "serve -s build -l 80" --name election-admin

# Save PM2 process list and configure startup
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
