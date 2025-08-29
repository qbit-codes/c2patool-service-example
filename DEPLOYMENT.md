# VPS Deployment Guide

## Prerequisites

- Linux VPS with Node.js installed
- Git access to your repository
- Sufficient storage for uploaded images

## Deployment Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd c2patool-service-example
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your VPS settings:
   ```env
   PORT=8000
   HOST=your-vps-domain.com
   ```

4. **Ensure c2patool binary has correct permissions**
   ```bash
   chmod +x c2patool
   ```

5. **Test the application**
   ```bash
   npm run start:prod
   ```

6. **Set up process manager (recommended)**
   
   Install PM2:
   ```bash
   npm install -g pm2
   ```
   
   Start the service:
   ```bash
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