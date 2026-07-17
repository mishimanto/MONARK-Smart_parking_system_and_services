# MONARK — Smart Parking & Vehicle Services

MONARK is a full-stack parking and vehicle-service management platform. It combines parking discovery and booking, wallet-based payments, vehicle service ordering, role-based operations, and a configurable administration panel in one application.

## Key Features

- Parking discovery, slot availability, booking, extension, cancellation, and checkout
- Digital wallet top-up, transaction verification, and payment-method management
- Vehicle service catalog, service centers, service orders, slips, and invoices
- Separate dashboards for customers, administrators, managers, and mechanics
- Role-based access control with granular admin permissions
- User profiles, avatar upload, password reset, and email verification
- Contact messages, editable site settings, team members, reporting, and exports
- Responsive React storefront and administration interface

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, React Router, Axios, Recharts |
| Backend | Laravel 12, PHP 8.2+, Laravel Sanctum |
| Database | MySQL |
| UI feedback | React Hot Toast, SweetAlert2 |
| Documents | Laravel DOMPDF |
| Images | Intervention Image |

## Project Structure

```text
.
├── frontend/       # React/Vite storefront and dashboards
├── backend-api/    # Laravel REST API, migrations, seeders, and tests    # Repository-wide ignore rules
└── README.md
```

## Requirements

- PHP 8.2 or newer
- Composer 2
- Node.js 20 or newer and npm
- MySQL 8 or a compatible database

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/mishimanto/smart-parking-system-and-services.git
cd smart-parking-system-and-services
```

### 2. Configure the backend

```bash
cd backend-api
composer install
cp .env.example .env
php artisan key:generate
```

Create a MySQL database, update the `DB_*` values in `backend-api/.env`, then run:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

The API will be available at `http://127.0.0.1:8000/api`.

### 3. Configure the frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Demo Credentials

Running `php artisan migrate --seed` creates this local development account when it does not already exist:

| Role | Email | Password | Dashboard |
| --- | --- | --- | --- |
| Administrator | `admin@gmail.com` | `admin123` | `/admin` |


That seeder also creates this mechanic account:

| Role | Email | Password | Dashboard |
| --- | --- | --- | --- |
| Mechanic | `mechanic@monark.test` | `mechanic123` | `/mechanic/dashboard` |

> These credentials are for local demonstration only. Change them before deploying, and never add real credentials or a populated `.env` file to Git.

## Useful Commands

### Frontend

```bash
npm run dev
npm run build
```

### Backend

```bash
./vendor/bin/phpunit
php artisan migrate:fresh --seed
php artisan optimize:clear
php artisan schedule:work
```

## API and Authentication

The frontend reads its API endpoint from `VITE_API_BASE_URL`. The local default is:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Protected endpoints use Laravel Sanctum bearer tokens. The API applies role and permission middleware for customer, admin, manager, and mechanic operations.

## Production Notes

- Build the frontend with `npm run build` and serve the contents of `frontend/dist` from the frontend document root.
- Point the API domain document root to `backend-api/public`, never to the Laravel project root.
- Set `APP_ENV=production`, `APP_DEBUG=false`, production database/mail values, and the correct `FRONTEND_URL`.
- Build the frontend with the production API URL in `VITE_API_BASE_URL`.
- Run Laravel cache commands only after the production environment is configured.

## License

No open-source license has been assigned yet. All rights are reserved by the project owner.
