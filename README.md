# TaskForge

A scalable, full-stack project and task management platform built for teams to collaborate efficiently. TaskForge provides organization-based workspaces, role-based access control, real-time collaboration, secure authentication, and asynchronous background job processing.

## Features

### Authentication & Security
- JWT Authentication
- Refresh Token Rotation
- Secure Password Hashing
- Protected Routes
- Role-Based Access Control (RBAC)
- Rate Limiting
- Request Validation
- Centralized Error Handling

### Organization Management
- Create Organizations
- Invite Team Members
- Manage Organization Roles
- Organization Dashboard

### Project Management
- Create, Update and Delete Projects
- Project Members
- Project Statistics
- Project Search & Filtering

### Task Management
- Create Tasks
- Assign Multiple Members
- Task Priorities
- Due Dates
- Status Tracking
- Labels
- File Attachments
- Comments
- Activity Timeline
- Server-side Pagination
- Sorting & Filtering

### Real-Time Features
- Live Notifications
- Real-Time Task Updates
- Socket.IO Integration

### Background Jobs
- Email Notifications
- Task Reminder Jobs
- Queue Management using BullMQ
- Redis-backed Job Processing

### Performance
- Optimized PostgreSQL Queries
- Indexed Database
- Cursor/Offset Pagination
- Modular Architecture
- Scalable Folder Structure

---

# Tech Stack

## Frontend
- React.js
- Tailwind CSS
- Axios
- React Router

## Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL (Neon)
- Redis (Upstash)
- BullMQ
- Socket.IO

## Authentication
- JWT
- Refresh Tokens
- bcrypt

## Deployment
- Vercel (Frontend)
- Render (Backend)
- Neon PostgreSQL
- Upstash Redis

---

# System Architecture

```
Client (React)
        │
        ▼
Express API Server
        │
 ┌──────┼────────┐
 │      │        │
 ▼      ▼        ▼
PostgreSQL   Redis   Socket.IO
   │          │
   ▼          ▼
 Prisma     BullMQ Workers
```

---

# Folder Structure

```
TaskForge
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── hooks
│   └── services
│
├── backend
│   ├── prisma
│   ├── src
│   │   ├── controllers
│   │   ├── routes
│   │   ├── middlewares
│   │   ├── services
│   │   ├── workers
│   │   ├── utils
│   │   └── validations
│   └── server.js
│
└── README.md
```

---

# API Features

- RESTful API Design
- Authentication APIs
- Organization APIs
- Project APIs
- Task APIs
- Comment APIs
- Notification APIs
- File Upload APIs

---

# Database

- PostgreSQL
- Prisma ORM
- Normalized Relational Schema
- Foreign Key Constraints
- Indexed Columns
- Multi-Tenant Design

---

# Security

- JWT Authentication
- Refresh Token Rotation
- Password Hashing
- RBAC
- Request Validation
- HTTP-only Cookies (optional)
- Rate Limiting
- Secure API Design

---

# Key Backend Concepts Used

- REST APIs
- Authentication & Authorization
- Role-Based Access Control
- Background Job Processing
- Real-Time Communication
- Pagination
- Database Transactions
- Error Handling
- Modular Architecture
- Scalable Backend Design

---

# Future Improvements

- Google OAuth Login
- Docker Support
- Kubernetes Deployment
- CI/CD Pipeline
- Unit & Integration Testing
- API Documentation using Swagger
- Analytics Dashboard
- Mobile Application

---

# Installation

## Clone Repository

```bash
git clone https://github.com/Darshan000234/TaskForge.git
```

## Backend

```bash
cd backend
npm install
```

Create a `.env` file and configure:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
PORT=
```

Run Prisma Migration

```bash
npx prisma migrate dev
```

Start Backend

```bash
npm run dev
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Author

**Darshan Desale**

- GitHub: [https://github.com/Darshan000234](https://github.com/Darshan000234)
- LinkedIn: [https://linkedin.com/in/<your-linkedin>](https://www.linkedin.com/in/darshan-desale-66114028b/)

---

⭐ If you found this project useful, consider giving it a star.
