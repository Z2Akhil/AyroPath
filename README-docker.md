# AryoPath Docker Setup

This document describes how to run the AryoPath application using Docker Compose with MongoDB Atlas.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- MongoDB Atlas account and cluster
- MongoDB Atlas connection string

## Quick Start

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd AryoPath
   ```

2. **Configure MongoDB Atlas connection**
   - Copy `.env.docker` to `.env`
   - Update `MONGODB_ATLAS_URI` with your MongoDB Atlas connection string

3. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the applications**
   - **Client Application**: http://localhost:5173
   - **Admin Dashboard**: http://localhost:5174
   - **Backend API**: http://localhost:3000

## Services Overview

### 1. Backend API
- **Container**: `aryopath-backend`
- **Port**: 3000
- **Environment**: Production
- **Dependencies**: MongoDB Atlas

### 2. Client Frontend
- **Container**: `aryopath-client`
- **Port**: 5173
- **Features**: Customer-facing lab test booking

### 3. Admin Frontend
- **Container**: `aryopath-admin`
- **Port**: 5174
- **Features**: Admin dashboard for management

## Useful Commands

### Start Services
```bash
sudo docker compose up -d
```

### Stop Services
```bash
sudo docker compose down
```

### View Logs
```bash
# All services
sudo docker compose logs

# Specific service
sudo docker compose logs backend
sudo docker compose logs client
sudo docker compose logs admin
```

### Check Service Status
```bash
sudo docker compose ps
```

### Rebuild Services
```bash
# Rebuild specific service
sudo docker compose build backend

# Rebuild all services
sudo docker compose build
```

### Access MongoDB Atlas
```bash
# Use MongoDB Compass or mongosh with your Atlas connection string
# mongosh "your-mongodb-atlas-connection-string"
```

## Environment Configuration

The Docker setup uses environment variables defined in:
- `docker-compose.yml` - Main configuration
- `.env.docker` - Reference environment variables

### Key Environment Variables

**Backend:**
- `MONGODB_ATLAS_URI`: MongoDB Atlas connection string (required)
- `JWT_SECRET`: JWT signing secret
- `CLIENT_URLS`: Allowed CORS origins
- `PORT`: Backend server port

**Frontend:**
- `VITE_TARGET_URL`: Backend API URL

## Development vs Production

### Development
For development, you might want to:
1. Use `npm run dev` instead of building
2. Enable hot reloading
3. Use development environment variables

### Production
For production deployment:
1. Update all secrets (JWT_SECRET, database passwords)
2. Use proper SSL certificates
3. Configure reverse proxy (nginx)
4. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5173, and 5174 are available
2. **Build failures**: Check Docker logs for specific errors
3. **Database connection**: Verify MongoDB Atlas connection string is correct and network accessible
4. **CORS errors**: Check CLIENT_URLS environment variable

### Health Checks
All services include health checks. You can monitor them with:
```bash
docker-compose ps
```

### MongoDB Atlas Connection
- Ensure your MongoDB Atlas cluster is running
- Verify the connection string includes proper authentication
- Check network access from your Docker containers to Atlas

## Security Notes

- Change all default passwords in production
- Use strong JWT secrets
- Configure proper firewall rules
- Consider using SSL/TLS for all connections
- Regularly update Docker images

## Next Steps

1. Configure your actual API keys and secrets
2. Set up SSL certificates
3. Configure monitoring and logging
4. Set up backup strategies for MongoDB
5. Configure reverse proxy for production deployment
