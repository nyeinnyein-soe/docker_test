FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install system dependencies and add PHP repository
RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    git \
    unzip \
    && add-apt-repository ppa:ondrej/php -y \
    && apt-get update \
    && apt-get install -y \
    php8.3 \
    php8.3-cli \
    php8.3-common \
    php8.3-pgsql \
    php8.3-sqlite3 \
    php8.3-xml \
    php8.3-mbstring \
    php8.3-curl \
    php8.3-zip \
    php8.3-bcmath \
    php8.3-gd \
    php8.3-intl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html/backend

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
