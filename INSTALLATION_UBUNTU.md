# Development Installation Guide for Ubuntu

This guide provides step-by-step instructions to set up the ERP-POS system for **development** on Ubuntu 20.04 LTS or later.

## Prerequisites

- Ubuntu 20.04 LTS or later
- sudo access
- Internet connection

## Setup proxy in termial
```bash
export http_proxy="socks5://127.0.0.1:1080"
export https_proxy="socks5://127.0.0.1:1080"
```

## or use proxychains prefix

```bash
proxychains composer install
```

## Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install PHP 8.2+ and Required Extensions

```bash
# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 and required extensions
sudo apt install -y php8.3 php8.3-cli php8.3-common \
    php8.3-pgsql php8.3-sqlite3 \
    php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip \
    php8.3-bcmath php8.3-gd php8.3-intl

# Verify PHP installation
php -v
```

**Required PHP Extensions:**
- `pgsql` - PostgreSQL database support
- `xml` - XML processing
- `mbstring` - Multibyte string handling
- `curl` - HTTP client
- `zip` - Archive handling
- `bcmath` - Arbitrary precision mathematics
- `gd` - Image processing
- `intl` - Internationalization

## Step 3: Install Composer (PHP Dependency Manager)

```bash
# Download Composer installer
cd ~
curl -sS https://getcomposer.org/installer | php

# Move to global location
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Verify installation
composer --version
```

## Step 4: Install Node.js and npm

```bash
# Verify installation
node --version
npm --version
```

## Step 5: Install PostgreSQL Database

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE USER erppos_user WITH PASSWORD 'erppos_password';
CREATE DATABASE erppos_db OWNER erppos_user;
GRANT ALL PRIVILEGES ON DATABASE erppos_db TO erppos_user;
\q
```

**Note:** Replace `erppos_password` with your preferred password.

## Step 6: Clone or Prepare Project

```bash
# Navigate to your development directory
cd ~
# or wherever you want the project
cd /var/www  # if you prefer

# Clone repository (if using git)
git clone <your-repository-url> erp-pos
cd erp-pos

# OR if you already have the project files, navigate to the directory
cd /path/to/erp-pos
```

## Step 7: Backend Setup (Laravel)

### Install PHP Dependencies

```bash
cd backend

# Install all dependencies (including dev dependencies for development)
composer install
```

If you encounter memory limit issues:
```bash
php -d memory_limit=-1 /usr/local/bin/composer install
```

### Configure Environment

```bash
# Copy environment example file
cp .env.example .env

# Generate application key (required for Laravel)
php artisan key:generate
```

### Configure Database Connection

Edit the `.env` file:

```bash
nano .env
# or use your preferred editor: nano, vscode, zed, etc.
```

Update the database configuration section:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=erppos_db
DB_USERNAME=erppos_user
DB_PASSWORD=erppos_password
```

Also update these settings for development:

```env
APP_NAME="ERP-POS"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# CORS - Allow frontend to connect
FRONTEND_URL=http://localhost:5173
```

### Run Database Migrations

```bash
# Run migrations to create database tables
php artisan migrate

# (Optional) Seed database with demo data
php artisan db:seed
```

**Demo Login Credentials** (after seeding):
- Email: `manager@example.com`
- PIN: `1234`

### Set Up Storage Link

```bash
# Create symbolic link for storage
php artisan storage:link
```

### Set Permissions (if needed)

```bash
# Make sure storage and cache directories are writable
chmod -R 775 storage bootstrap/cache
```

## Step 8: Frontend Setup

### Install Node.js Dependencies

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

### Configure Frontend (if needed)

The frontend is configured to connect to `http://localhost:8000` by default. If your backend runs on a different URL, update:

```bash
# Create .env file in frontend directory (if needed)
nano .env
```

Add:
```env
VITE_API_URL=http://localhost:8000
```

## Step 9: Start Development Servers

### Start Backend Server

Open a terminal and run:

```bash
cd backend
php artisan serve
```

The backend API will be available at: `http://localhost:8000`

### Start Frontend Development Server

Open another terminal and run:

```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## Step 10: Verify Installation

1. **Backend API Test:**
   ```bash
   curl http://localhost:8000/api/auth/login
   ```
   Should return a JSON response (likely an error about missing credentials, which is expected).

2. **Frontend Access:**
   - Open browser: `http://localhost:5173`
   - You should see the application login screen

3. **Test Login:**
   - Email: `manager@example.com`
   - PIN: `1234`
   - (Only if you ran `php artisan db:seed`)

## Laravel-Specific Development Commands

### Artisan Commands

```bash
cd backend

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Create new migration
php artisan make:migration create_table_name

# Run tests
php artisan test

# Tinker (interactive shell)
php artisan tinker
```

### Common Development Tasks

**Create a new model with migration:**
```bash
php artisan make:model ModelName -m
```

**Create a new controller:**
```bash
php artisan make:controller ControllerName
```

**Create a new API resource:**
```bash
php artisan make:resource ResourceName
```

**View all routes:**
```bash
php artisan route:list
```

## Project Structure

```
erp-pos/
├── backend/                 # Laravel application
│   ├── app/
│   │   ├── Actions/        # Business logic actions
│   │   ├── Http/
│   │   │   └── Controllers/Api/  # API controllers
│   │   ├── Models/         # Eloquent models
│   │   └── Services/       # Service classes
│   ├── database/
│   │   ├── migrations/    # Database migrations
│   │   └── seeders/       # Database seeders
│   ├── routes/
│   │   └── api.php        # API routes
│   └── .env               # Environment configuration
│
└── frontend/              # React application
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── stores/        # Zustand state stores
    │   └── lib/           # Utilities and API client
    └── package.json       # Node.js dependencies
```

## Development Workflow

1. **Backend Changes:**
   - Edit files in `backend/app/`
   - Laravel will auto-reload (no restart needed)
   - Run migrations: `php artisan migrate`

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Vite will hot-reload automatically
   - No restart needed

3. **Database Changes:**
   - Create migration: `php artisan make:migration`
   - Edit migration file in `backend/database/migrations/`
   - Run: `php artisan migrate`

## Troubleshooting

### Composer Issues

**Memory limit error:**
```bash
php -d memory_limit=-1 /usr/local/bin/composer install
```

**Permission denied:**
```bash
sudo chown -R $USER:$USER ~/.composer
```

### Database Connection Issues

**Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

**Test database connection:**
```bash
psql -U erppos_user -d erppos_db -h localhost
```

**Reset database:**
```bash
cd backend
php artisan migrate:fresh --seed
```

### Laravel Issues

**Clear all caches:**
```bash
cd backend
php artisan optimize:clear
```

**Regenerate autoload files:**
```bash
composer dump-autoload
```

**Check Laravel logs:**
```bash
tail -f backend/storage/logs/laravel.log
```

### Frontend Issues

**Clear node_modules and reinstall:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Clear Vite cache:**
```bash
rm -rf frontend/node_modules/.vite
```

## Next Steps

- See [DEVELOPMENT.md](./DEVELOPMENT.md) for development guidelines and best practices
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions
- Check the main [README.md](./README.md) for project overview

## Quick Reference

**Start Development:**
```bash
# Terminal 1 - Backend
cd backend && php artisan serve

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

**Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api (check routes)

**Default Login (after seeding):**
- Email: `manager@example.com`
- PIN: `1234`
