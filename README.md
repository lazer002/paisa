# YOLO HRM System

A comprehensive Human Resource Management system built with Next.js frontend and Express.js backend.

## Project Structure

```
yolo/
├── client/          # Next.js frontend application
├── server/          # Express.js backend API
├── package.json     # Root workspace configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies for all workspaces:
```bash
npm install
```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Backend API server on `http://localhost:5000`
- Frontend Next.js app on `http://localhost:3000`

### Individual Commands

Run only the backend:
```bash
cd server && npm run dev
```

Run only the frontend:
```bash
cd client && npm run dev
```

### Production

Build both applications:
```bash
npm run build
```

Start the backend server:
```bash
npm run start
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start the backend server
- `npm run seed` - Run database seeding (backend only)

## Technology Stack

### Frontend (client/)
- Next.js 15.5.2
- React 19.1.0
- TypeScript
- Tailwind CSS
- Radix UI components
- React Hook Form
- Zustand for state management

### Backend (server/)
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

## Features

- User authentication and authorization
- Role-based access control (Super Admin, Admin, HR, Employee, Teacher, Student)
- Institute management
- Employee management
- Student management
- Teacher management
- HR management
- Dashboard with analytics
- Attendance tracking
- Payroll management
- Study material management

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/institutes` - Institute management
- `/api/users` - User management
- `/api/hr` - HR management
- `/api/employees` - Employee management
- `/api/teachers` - Teacher management
- `/api/students` - Student management

## Environment Variables

Create a `.env` file in the server directory:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```
