# OpenRole.net Deployment Guide

Complete production deployment guide for the OpenRole.net transparent job platform.

## 🚀 Quick Deployment

### Prerequisites
- Docker and Docker Compose installed
- Domain name configured (for production)
- Server with at least 2GB RAM and 20GB storage

### 1. Initial Setup
```bash
# Clone/copy the project files to your server
cd /path/to/openrole.net

# Copy environment file and configure
cp .env.prod.example .env.prod
nano .env.prod  # Edit with your settings
```

### 2. Configure Environment Variables
Edit `.env.prod` with your production values:

```bash
# Database Configuration
DB_NAME=openrole_prod
DB_USER=openrole_user
DB_PASSWORD=your_secure_database_password_here
MYSQL_ROOT_PASSWORD=your_secure_root_password_here

# Domain Configuration
DOMAIN=openrole.net
WWW_DOMAIN=www.openrole.net
SSL_EMAIL=admin@openrole.net

# WordPress Admin
WP_ADMIN_EMAIL=admin@openrole.net
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=your_secure_admin_password_here
```

### 3. Deploy
```bash
# Make scripts executable
chmod +x *.sh

# Deploy to production
./deploy.sh production
```

## 🔧 Manual Deployment Steps

### Step 1: SSL Certificate Setup
```bash
# For production with real domain
./setup-ssl.sh

# For development/testing
DOMAIN=localhost ./setup-ssl.sh
```

### Step 2: Deploy Application
```bash
# Start production containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Step 3: WordPress Configuration
```bash
# Install WordPress (if first deployment)
docker-compose -f docker-compose.prod.yml exec wordpress wp core install \
  --url="https://openrole.net" \
  --title="OpenRole.net - Where Every Role is Open" \
  --admin_user="admin" \
  --admin_password="secure_password" \
  --admin_email="admin@openrole.net" \
  --allow-root

# Activate theme and plugins
docker-compose -f docker-compose.prod.yml exec wordpress wp theme activate openrole --allow-root
docker-compose -f docker-compose.prod.yml exec wordpress wp plugin activate --all --allow-root
```

## 🏗️ Architecture Overview

### Production Stack
- **Nginx**: Reverse proxy with SSL termination
- **WordPress**: Application server with PHP 8.2
- **MySQL 8.0**: Database server
- **Redis**: Caching layer
- **Let's Encrypt**: SSL certificates

### Container Services
- `openrole_nginx`: Web server and SSL termination
- `openrole_wordpress_prod`: WordPress application
- `openrole_mysql_prod`: Database server
- `openrole_redis`: Caching and sessions

## 🔒 Security Features

### SSL/TLS Configuration
- **Let's Encrypt certificates** with auto-renewal
- **TLS 1.2+ only** with strong cipher suites
- **HSTS headers** for enhanced security
- **Perfect Forward Secrecy** enabled

### WordPress Security
- **File editing disabled** in admin
- **Force SSL admin** access
- **Sensitive file access blocked**
- **Security headers** implemented
- **Regular security updates**

### Database Security
- **Non-root database user** with limited privileges
- **Strong password requirements**
- **Network isolation** between containers
- **Regular automated backups**

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check website availability
curl -I https://openrole.net
```

### Backup Management
```bash
# Manual database backup
docker-compose -f docker-compose.prod.yml exec mysql mysqldump \
  -u root -p openrole_prod > backup-$(date +%Y%m%d).sql

# Manual file backup
docker-compose -f docker-compose.prod.yml exec wordpress \
  tar -czf backup-files-$(date +%Y%m%d).tar.gz /var/www/html/wp-content
```

### Performance Monitoring
```bash
# Check resource usage
docker stats

# WordPress performance test
curl -w "@curl-format.txt" -s -o /dev/null https://openrole.net
```

## 🔄 Updates and Maintenance

### Updating WordPress Core
```bash
# Update WordPress core
docker-compose -f docker-compose.prod.yml exec wordpress wp core update --allow-root

# Update plugins
docker-compose -f docker-compose.prod.yml exec wordpress wp plugin update --all --allow-root

# Update themes
docker-compose -f docker-compose.prod.yml exec wordpress wp theme update --all --allow-root
```

### Container Updates
```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Recreate containers with new images
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

## 🚨 Troubleshooting

### Common Issues

#### SSL Certificate Problems
```bash
# Check certificate validity
openssl x509 -in ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

#### Database Connection Issues
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec wordpress wp db check --allow-root

# Reset database password
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p
```

#### Performance Issues
```bash
# Check container resources
docker stats

# Optimize database
docker-compose -f docker-compose.prod.yml exec wordpress wp db optimize --allow-root

# Clear cache
docker-compose -f docker-compose.prod.yml restart redis
```

### Log Analysis
```bash
# WordPress logs
docker-compose -f docker-compose.prod.yml logs wordpress

# Nginx access logs
docker-compose -f docker-compose.prod.yml logs nginx

# Database logs
docker-compose -f docker-compose.prod.yml logs mysql
```

## 🎯 Production Checklist

### Pre-Launch
- [ ] Domain DNS configured
- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] Backup strategy implemented
- [ ] Monitoring set up

### Post-Launch
- [ ] Test all critical functionality
- [ ] Verify job posting and CV upload
- [ ] Check email notifications
- [ ] Performance test completed
- [ ] Security scan passed

### Ongoing Maintenance
- [ ] Regular backups scheduled
- [ ] Security updates automated
- [ ] Performance monitoring active
- [ ] SSL auto-renewal verified

## 🔗 Useful Commands

```bash
# Complete redeployment
./deploy.sh production

# Check deployment status
docker-compose -f docker-compose.prod.yml ps

# Access WordPress CLI
docker-compose -f docker-compose.prod.yml exec wordpress wp --allow-root

# Database access
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 📞 Support

For deployment issues or questions:
1. Check the logs first: `docker-compose -f docker-compose.prod.yml logs`
2. Review this deployment guide
3. Check WordPress and plugin documentation
4. Contact system administrator

---

**OpenRole.net** - Where Every Role is Open 🎯