# SpinPick Backend

This is the backend for the SpinPick application, consisting of two components:

1. **Directus Headless CMS** - Powers content management and user authentication
2. **Express API Server** - Provides secure API endpoints and Directus integration

## Directus Setup

### Prerequisites

- Docker
- Docker Compose

### Running Directus

1. Start the Directus server:

```bash
docker-compose up -d
```

2. Access the Directus admin panel at [http://localhost:8082/admin](http://localhost:8082/admin)

3. Log in with the following credentials:
   - Email: admin@example.com
   - Password: spinpick123

### Stopping Directus

```bash
docker-compose down
```

## API Server

The API server provides secure endpoints for the SpinPick frontend while protecting sensitive admin credentials.

### Features

- **Secure Directus Integration**: Handles all Directus API calls server-side to protect admin credentials
- **User Authentication**: Works with the frontend auth system
- **Theme Management**: Store and retrieve custom user themes
- **Result Tracking**: Save and retrieve spin results
- **Automatic Collection Setup**: Creates required Directus collections on startup

### Setting Up the API Server

1. Install dependencies:
   ```bash
   cd backend
   pnpm install
   ```

2. Make sure your `.env` file contains the required variables:
   ```
   DIRECTUS_BASE_URL=http://localhost:8082
   DIRECTUS_ADMIN_TOKEN=your-admin-token
   PORT=3001
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

### API Endpoints

#### Health Check
- **GET /api/health** - Check if the API is running

#### Themes
- **GET /api/themes/:userId** - Get themes for a specific user
- **POST /api/themes** - Create a new theme for a user

#### Spin Results
- **GET /api/results/:userId** - Get spin results for a specific user
- **POST /api/results** - Save a new spin result

## Data Persistence

- **Directus Data**: Persisted in the `./database` directory
- **Uploaded Files**: Stored in the `./uploads` directory
- **Extensions**: Stored in the `./extensions` directory