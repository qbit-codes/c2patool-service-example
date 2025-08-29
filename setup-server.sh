#!/bin/bash

# C2PA Service Server Setup Script
# Run this script on your VPS after cloning the repository

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="91.98.126.109"
SERVICE_NAME="c2pa-service"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up C2PA Service on VPS..."

# Check if we're in the right directory
if [[ ! -f "server.js" || ! -f "package.json" ]]; then
    print_error "Please run this script from the c2patool-service-example directory"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install --production

# Create .env file
print_status "Creating environment configuration..."
if [[ ! -f .env ]]; then
    cp .env.example .env
    sed -i "s/HOST=localhost/HOST=$VPS_IP/" .env
    print_success "Created .env file with VPS IP"
else
    print_warning ".env file already exists"
fi

# Make c2patool executable
print_status "Setting c2patool permissions..."
chmod +x c2patool

# Test c2patool
print_status "Testing c2patool..."
if ./c2patool --version; then
    print_success "c2patool is working"
else
    print_error "c2patool test failed"
    exit 1
fi

# Setup PM2 if not already running
print_status "Setting up PM2 service..."
if pm2 list | grep -q "c2pa-service"; then
    print_status "Restarting existing PM2 service..."
    pm2 restart c2pa-service
else
    print_status "Starting new PM2 service..."
    pm2 start server.js --name c2pa-service
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup (if not already done)
if ! systemctl is-enabled pm2-$(whoami) &>/dev/null; then
    print_status "Setting up PM2 startup..."
    pm2 startup
    print_warning "Please run the generated command as root to complete PM2 startup setup"
fi

# Test the service
print_status "Testing service..."
sleep 3

if curl -s http://localhost:8000/version > /dev/null; then
    print_success "Service is running successfully!"
    print_status "Local access: http://localhost:8000"
    print_status "External access: http://$VPS_IP:8000"
else
    print_error "Service test failed"
    print_status "Checking PM2 logs:"
    pm2 logs c2pa-service --lines 10
    exit 1
fi

# Setup nginx (if config exists and user has sudo)
if [[ -f "nginx.conf" ]] && sudo -n true 2>/dev/null; then
    print_status "Setting up nginx reverse proxy..."
    sudo cp nginx.conf /etc/nginx/sites-available/c2pa-service
    
    if [[ ! -L /etc/nginx/sites-enabled/c2pa-service ]]; then
        sudo ln -s /etc/nginx/sites-available/c2pa-service /etc/nginx/sites-enabled/
    fi
    
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_success "Nginx configured successfully"
        print_status "Service accessible at: http://$VPS_IP"
    else
        print_error "Nginx configuration test failed"
    fi
else
    print_warning "Skipping nginx setup (no sudo access or config not found)"
    print_status "Service accessible at: http://$VPS_IP:8000"
fi

print_success "Setup complete!"
print_status ""
print_status "Service Status:"
pm2 status

print_status ""
print_status "To manage the service:"
print_status "  pm2 restart c2pa-service  # Restart service"
print_status "  pm2 stop c2pa-service     # Stop service"  
print_status "  pm2 logs c2pa-service     # View logs"
print_status "  pm2 monit                 # Monitor dashboard"