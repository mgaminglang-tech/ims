# IMS (Inventory Management System)

A full-stack React application with Express backend and MSSQL database for managing inventory, assets, and documents.

## Features

- Asset management and tracking
- Document management
- User authentication
- Dashboard with analytics
- Borrow/return item tracking
- Print management

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, MSSQL
- **Database**: Microsoft SQL Server
- **State Management**: TanStack Query

## Local Development

### Prerequisites
- Node.js 18+
- SQL Server (local or Docker)
- Git

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up database (see Database Setup section)
4. Start development servers:
   ```bash
   # Terminal 1: Start backend
   npm start

   # Terminal 2: Start frontend
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173)

## Database Setup

### Local SQL Server
1. Install SQL Server Express
2. Create database named `imsdb`
3. Update `.env` with your local credentials

### Online Database (Azure SQL, etc.)
1. Create online database
2. Update `.env` with online credentials:
   ```env
   DB_SERVER=your-server.database.windows.net
   DB_DATABASE=imsdb
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_ENCRYPT=true
   DB_TRUST_CERT=false
   ```

## Online Deployment for Testing

### Option 1: Vercel (Frontend) + Railway (Backend + Database)

#### Deploy Backend to Railway:
1. Go to [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy backend (it will auto-detect as Node.js)

#### Deploy Frontend to Vercel:
1. Go to [Vercel.com](https://vercel.com)
2. Connect GitHub repository
3. Set `VITE_API_URL` to your Railway backend URL
4. Deploy

### Option 2: Render (Full Stack)

#### Deploy to Render:
1. Go to [Render.com](https://render.com)
2. Create new Web Service from Git
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Option 3: Heroku

#### Deploy to Heroku:
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables: `heroku config:set KEY=VALUE`
5. Deploy: `git push heroku main`

## Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend
VITE_API_URL=https://api.mervinautomation.it.com/api

# Database
DB_SERVER=localhost
DB_DATABASE=imsdb
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your-password
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Production (update for deployment)
# VITE_API_URL=https://your-backend-url.com/api
```

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm start` - Start production server (backend)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
IMSv1/
├── backend/           # Express server
│   ├── routes/       # API routes
│   ├── db.js         # Database connection
│   └── server.js     # Main server file
├── src/              # React frontend
│   ├── components/   # Reusable components
│   ├── pages/        # Page components
│   ├── contexts/     # React contexts
│   └── lib/          # Utilities
├── public/           # Static assets
└── dist/             # Production build output
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
