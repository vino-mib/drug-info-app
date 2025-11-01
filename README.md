# Drug Information Management System

A full-stack web application for managing and viewing drug information with advanced filtering capabilities.

## Features

- **Interactive Drug Table**: View drug information in a sortable, paginated table
- **Company Filtering**: Filter drugs by company using dropdown or clicking company names in the table
- **Configurable Columns**: Table configuration fetched from backend API
- **Responsive Design**: Built with Material-UI for modern, responsive interface
- **Date Localization**: Launch dates formatted according to user's locale
- **REST API**: Full backend API with MongoDB integration
- **Docker Support**: Complete containerization for easy deployment
- **Unit Tests**: Comprehensive Jest test suite for both frontend and backend

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components and styling
- **Axios** for API communication
- **Jest & React Testing Library** for testing

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Jest & Supertest** for API testing

### DevOps
- **Docker & Docker Compose** for containerization
- **Nginx** for production frontend serving

## Project Structure

```
drug-info-app/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── DrugTable.tsx
│   │   │   ├── CompanyFilter.tsx
│   │   │   └── __tests__/   # Component tests
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript interfaces
│   │   └── App.tsx
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Express API server
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── scripts/             # Database seeding
│   ├── __tests__/           # API tests
│   ├── Dockerfile
│   └── package.json
├── drugData 2025.json       # Source data file
├── docker-compose.yml       # Multi-container setup
└── README.md
```

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd drug-info-app
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to be ready** (about 2-3 minutes for first run)

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

5. **Seed the database** (if not done automatically)
   ```bash
   docker-compose run seeder
   ```

## Manual Development Setup

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open browser**
   - Application: http://localhost:3000

## API Documentation

### Endpoints

#### Drugs
- **GET** `/api/drugs` - Get all drugs with pagination and filtering
  - Query parameters:
    - `company` - Filter by company name
    - `page` - Page number (default: 1)
    - `limit` - Items per page (default: 50)
    - `sortBy` - Sort field (default: 'launchDate')
    - `sortOrder` - Sort direction: 'asc' or 'desc' (default: 'desc')

- **GET** `/api/drugs/:id` - Get single drug by ID

#### Companies
- **GET** `/api/companies` - Get all unique company names (sorted alphabetically)
- **GET** `/api/companies/stats` - Get company statistics with drug counts

#### Configuration
- **GET** `/api/config` - Get table configuration

### Example Responses

#### Get Drugs
```json
{
  "drugs": [
    {
      "id": "507f1f77bcf86cd799439011",
      "code": "0006-0568",
      "genericName": "vorinostat",
      "brandName": "ZOLINZA",
      "company": "Merck Sharp & Dohme Corp.",
      "launchDate": "2004-02-14T23:01:10Z",
      "displayName": "vorinostat (ZOLINZA)",
      "sequentialId": 1
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 20,
    "totalCount": 1000,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### Test Coverage
The test suite includes:
- **Component Tests**: DrugTable and CompanyFilter components
- **API Tests**: All REST endpoints
- **Integration Tests**: Database operations
- **Filtering Tests**: Company filter functionality

## Features in Detail

### Drug Table
- **Sortable Columns**: Click headers to sort data
- **Pagination**: Navigate through large datasets
- **Sequential IDs**: Auto-generated sequential numbering
- **Clickable Companies**: Click company names to filter
- **Date Formatting**: Automatic locale-based date formatting

### Company Filtering
- **Dropdown Filter**: Select company from dropdown
- **"All Companies" Option**: Clear filters
- **Click-to-Filter**: Click company names in table
- **Visual Feedback**: Shows current filter status

### Data Management
- **MongoDB Integration**: Robust data storage
- **Data Validation**: Server-side validation
- **Indexing**: Optimized database queries
- **Bulk Import**: Efficient data seeding

## Deployment

### Production with Docker
```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d

# Scale backend services
docker-compose up -d --scale backend=3

# Monitor logs
docker-compose logs -f
```

### Environment Variables

#### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/druginfo
```

#### Frontend
- `REACT_APP_API_URL` - Backend API URL (optional, defaults to `/api`)

## Performance Optimizations

- **Database Indexing**: Optimized queries for company and date filtering
- **Pagination**: Server-side pagination for large datasets
- **Caching**: Nginx caching for static assets
- **Compression**: Gzip compression enabled
- **Health Checks**: Docker health monitoring

## Security Features

- **CORS Protection**: Configured for cross-origin requests
- **Helmet**: Security headers middleware
- **Input Validation**: Server-side request validation
- **MongoDB Security**: User authentication and role-based access