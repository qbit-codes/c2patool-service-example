# VPS Deployment Guide

## Prerequisites

- Linux VPS with Node.js installed
- Git access to your repository
- Sufficient storage for uploaded images

## Deployment Steps

### Quick Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/contentauth/c2patool-service-example.git
   cd c2patool-service-example
   ```

2. **Run the setup script**
   ```bash
   ./setup-server.sh
   ```

The script will automatically:
- Install dependencies
- Create .env with your VPS IP (91.98.126.109)
- Set c2patool permissions
- Start PM2 service
- Configure nginx (if sudo available)
- Test the deployment

### Manual Setup (Alternative)

1. **Install dependencies**
   ```bash
   npm install --production
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   sed -i "s/HOST=localhost/HOST=91.98.126.109/" .env
   ```

3. **Set permissions and start service**
   ```bash
   chmod +x c2patool
   pm2 start server.js --name c2pa-service
   pm2 startup
   pm2 save
   ```

## Important Notes

- The c2patool binary is Linux x86-64 compatible
- Ensure your VPS has sufficient disk space for image uploads
- Consider setting up a reverse proxy (nginx) for production
- For HTTPS, configure your reverse proxy accordingly
- The service creates upload directories automatically

## Port Configuration

Default port is 8000. To run on port 80 (requires sudo):
```bash
sudo PORT=80 HOST=your-domain.com npm run start:prod
```

## Monitoring

Check service status:
```bash
pm2 status
pm2 logs c2pa-service
```