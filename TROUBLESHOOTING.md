# Troubleshooting Guide

This document contains solutions to common issues, production setup, security recommendations, and maintenance procedures.

## Common Development Issues

### Permission Denied Errors

```bash
# Fix storage permissions
sudo chown -R $USER:$USER /path/to/erp-pos/backend/storage
sudo chmod -R 775 /path/to/erp-pos/backend/storage

# Fix bootstrap cache permissions
sudo chown -R $USER:$USER /path/to/erp-pos/backend/bootstrap/cache
sudo chmod -R 775 /path/to/erp-pos/backend/bootstrap/cache
```

### Database Connection Failed

**Symptoms:**
- `SQLSTATE[08006] [7] could not connect to server`
- `Connection refused` errors

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Check database credentials in `.env`:**
   ```bash
   cd backend
   cat .env | grep DB_
   ```

3. **Test connection manually:**
   ```bash
   psql -U erppos_user -d erppos_db -h localhost
   ```

4. **Check PostgreSQL authentication:**
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Ensure local connections are allowed:
   # local   all             all                                     md5
   # host    all             all             127.0.0.1/32            md5
   sudo systemctl restart postgresql
   ```

### Frontend Can't Connect to Backend

**Symptoms:**
- CORS errors in browser console
- Network errors when making API calls

**Solutions:**

1. **Check backend CORS configuration:**
   ```bash
   cd backend
   # Verify FRONTEND_URL in .env
   cat .env | grep FRONTEND_URL
   ```

2. **Clear Laravel config cache:**
   ```bash
   php artisan config:clear
   ```

3. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/api/auth/login
   ```

4. **Check API URL in frontend:**
   - Verify `frontend/src/lib/api.ts` has correct base URL
   - Check browser Network tab for actual request URLs

### Composer Memory Limit

**Error:** `Fatal error: Allowed memory size exhausted`

**Solution:**
```bash
php -d memory_limit=-1 /usr/local/bin/composer install
```

### Laravel Route Not Found

**Symptoms:**
- 404 errors on API routes
- Routes not appearing in `php artisan route:list`

**Solutions:**

1. **Clear route cache:**
   ```bash
   php artisan route:clear
   php artisan route:cache  # Only in production
   ```

2. **Verify routes are registered:**
   ```bash
   php artisan route:list
   ```

3. **Check API route file:**
   ```bash
   cat backend/routes/api.php
   ```

### Migration Errors

**Symptoms:**
- `SQLSTATE[42S01]: Base table or view already exists`
- `SQLSTATE[42S02]: Base table or view not found`

**Solutions:**

1. **Reset database (WARNING: Deletes all data):**
   ```bash
   php artisan migrate:fresh
   php artisan migrate:fresh --seed  # With demo data
   ```

2. **Rollback and re-run:**
   ```bash
   php artisan migrate:rollback
   php artisan migrate
   ```

3. **Check migration status:**
   ```bash
   php artisan migrate:status
   ```

### Node.js/npm Issues

**Clear cache and reinstall:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Vite build errors:**
```bash
rm -rf node_modules/.vite
npm run dev
```

## Production Setup

### Web Server Configuration (Nginx)

#### Backend Configuration

Create `/etc/nginx/sites-available/erp-pos-backend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/erp-pos/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/erp-pos-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Frontend Configuration

Create `/etc/nginx/sites-available/erp-pos-frontend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/erp-pos/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Queue Worker Setup

Create `/etc/systemd/system/erp-pos-queue.service`:

```ini
[Unit]
Description=ERP-POS Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/erp-pos/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable erp-pos-queue
sudo systemctl start erp-pos-queue
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Security Recommendations

### Firewall Setup

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Application Security

1. **Environment Variables:**
   - Set `APP_DEBUG=false` in production
   - Use strong `APP_KEY`
   - Never commit `.env` file

2. **Database Security:**
   - Use strong passwords
   - Limit PostgreSQL access to localhost
   - Regular backups

3. **File Permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/erp-pos
   sudo chmod -R 755 /var/www/erp-pos
   sudo chmod -R 775 /var/www/erp-pos/backend/storage
   ```

4. **Regular Updates:**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update PHP dependencies
   cd backend && composer update
   
   # Update Node.js dependencies
   cd frontend && npm update
   ```

## Maintenance

### Update Application

```bash
cd /var/www/erp-pos

# Pull latest changes
git pull origin main

# Backend updates
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend updates
cd ../frontend
npm install
npm run build
```

### Database Backup

**Create Backup:**
```bash
# Single database
sudo -u postgres pg_dump erppos_db > backup_$(date +%Y%m%d_%H%M%S).sql

# All databases
sudo -u postgres pg_dumpall > backup_all_$(date +%Y%m%d_%H%M%S).sql
```

**Restore Backup:**
```bash
sudo -u postgres psql erppos_db < backup_YYYYMMDD_HHMMSS.sql
```

**Automated Daily Backup (Cron):**
```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /usr/bin/pg_dump -U erppos_user erppos_db > /backups/erppos_$(date +\%Y\%m\%d).sql
```

### Log Management

**View Laravel Logs:**
```bash
tail -f /var/www/erp-pos/backend/storage/logs/laravel.log
```

**Rotate Logs:**
```bash
# Laravel handles log rotation automatically
# Or use logrotate for system logs
```

### Performance Optimization

**Laravel Optimization:**
```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

**Clear Caches:**
```bash
php artisan optimize:clear
```

**Composer Optimization:**
```bash
composer install --no-dev --optimize-autoloader
```

## Monitoring

### Check Service Status

```bash
# PostgreSQL
sudo systemctl status postgresql

# PHP-FPM
sudo systemctl status php8.2-fpm

# Nginx
sudo systemctl status nginx

# Queue Worker
sudo systemctl status erp-pos-queue
```

### Check Logs

```bash
# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log

# Laravel logs
tail -f backend/storage/logs/laravel.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [React Documentation](https://react.dev)
