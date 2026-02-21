# Docker Usage Guide

This guide provides instructions for running the ERP-POS system using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

## Quick Start

1. **Build and start the services:**
   ```bash
   docker compose up -d --build
   ```
   *Note: The first build might take some time as it installs dependencies.*

2. **Access the application:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **Database (PostgreSQL):** `localhost:5433` (External port)

## Common Commands

### Stopping Services
```bash
docker compose down
```

### Viewing Logs
```bash
# View logs from all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Running Commands Inside Containers

#### Backend (Laravel Artisan)
```bash
# Run migrations
docker compose exec backend php artisan migrate

# Seed the database
docker compose exec backend php artisan db:seed

# Clear configuration cache
docker compose exec backend php artisan config:clear
```

#### Frontend (NPM)
```bash
# Install new dependencies
docker compose exec frontend npm install <package-name>
```

## Database Information

- **Database System:** PostgreSQL 15
- **Container Name:** `erppos-db`
- **Internal Port:** `5432`
- **External Port:** `5433`
- **Credentials:**
  - **Database:** `erppos_db`
  - **User:** `erppos_user`
  - **Password:** `erppos_password`

You can change these in the `docker-compose.yml` file or by creating a `.env` file in the root directory.

## Default Login Credentials
- **Email:** `manager@example.com`
- **PIN:** `1234`
*(Requires `php artisan db:seed` to be run)*

## Running on a Remote Server (AWS EC2)

If you are running these containers on AWS, follow these steps to access them from your browser:

### 1. Configure AWS Security Group
You must allow inbound traffic to your EC2 instance for the following ports:
- **Port 5173**: For the Frontend web interface.
- **Port 8000**: For the Backend API.
- **Port 22**: For SSH access (already standard).

In the AWS Console:
`EC2 > Security Groups > [Your Group] > Edit inbound rules`
Add "Custom TCP" rules for 5173 and 8000 with Source set to `0.0.0.0/0` (or your IP for better security).

### 2. Update Environment Variables
For the frontend to successfully communicate with the backend API from your local browser, you must update the URLs in `docker-compose.yml` to use your AWS Public IP instead of `localhost`.

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ...
    environment:
      - APP_URL=http://<YOUR_AWS_PUBLIC_IP>:8000
      - FRONTEND_URL=http://<YOUR_AWS_PUBLIC_IP>:5173
```

Then restart the containers:
```bash
docker compose up -d
```

### 3. Access in Browser
Once configured, open your browser and navigate to:
`http://<YOUR_AWS_PUBLIC_IP>:5173`
