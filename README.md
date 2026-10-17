# TaskForge

TaskForge is a full-stack project and task management app for teams. It supports organization workspaces, projects, task assignments, team invitations, task discussions, and activity tracking.

The project focuses on backend workflows such as authentication, authorization, relational data modeling, caching, background jobs, and real-time updates.

## Features

- **Authentication:** email/password signup and login, Google sign-in, short-lived JWT access tokens, and refresh-token rotation backed by Redis.
- **Organizations and roles:** create workspaces, invite members, select an active workspace, and apply organization/project/task access checks for Admin, Manager, and Member roles.
- **Project and task management:** create and update projects and tasks, assign multiple users to tasks, manage priorities, statuses and due dates, and search/filter lists.
- **Pagination and caching:** cursor-based pagination on list endpoints and Redis caching for selected reads and dashboard data.
- **Real-time updates:** Socket.IO events for collaboration, invitations, project/task changes, and task discussions.
- **Background jobs:** BullMQ workers send organization invitation emails and scheduled task reminder emails.
- **Task discussions and files:** task-level messages with optional PDF, text, and JPEG/PNG attachments uploaded to Cloudinary.
- **Audit trail:** record changes with action/resource details and optional before/after values and field differences.
- **Account and settings:** update username, sign out, and delete an account.

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma ORM |
| Cache and queue infrastructure | Redis, BullMQ |
| Real-time communication | Socket.IO |
| Authentication | JWT, bcrypt, Google OAuth |
| Background email | Nodemailer |
| File uploads | Multer, Cloudinary |

## Architecture

```mermaid
flowchart LR
    U[React Frontend] -->|REST API| E[Express API]
    U <-->|Socket.IO| E
    E --> P[Prisma ORM]
    P --> DB[(PostgreSQL)]
    E <--> R[(Redis)]
    E --> Q[BullMQ Queues]
    Q --> IW[Invitation Worker]
    Q --> RW[Task Reminder Worker]
    IW --> M[Email via Nodemailer]
    RW --> M
    E --> C[Cloudinary File Storage]
```

The Express server exposes the REST API and Socket.IO connection. Prisma handles PostgreSQL access. Redis is used for selected caches, refresh-token tracking, rate limiting, and BullMQ job queues. Separate workers process invitation emails and task reminders.

## Project Structure

```text
TaskForge-App/
├── Backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── config/       # Prisma, Redis, Cloudinary setup
│       ├── controllers/  # Request handlers and business workflows
│       ├── middlewares/ # Authentication, role checks, rate limits
│       ├── queue/        # BullMQ queue and Redis connection
│       ├── routes/       # REST API route definitions
│       ├── services/    # Audit-log service
│       ├── utils/       # Tokens, uploads, mail, socket helpers, diffs
│       ├── workers/     # Invitation and reminder workers
│       └── server.js
├── Frontend/
│   └── src/
│       ├── api/          # Axios client and token refresh handling
│       ├── components/   # Pages, layouts, modals and UI components
│       ├── socket/       # Socket.IO client
│       └── utils/        # Auth state and UI helpers
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL database
- Redis instance
- API credentials for optional integrations such as Google sign-in, Gmail email delivery, and Cloudinary uploads

### 1. Clone the repository

```bash
git clone https://github.com/Darshan000234/TaskForge-App.git
cd TaskForge-App
```

### 2. Configure the backend

Create `Backend/.env`:

```env
PORT=3000
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
REDIS_URL=redis://localhost:6379

JWT_ACCESS_TOKEN=replace_with_a_long_random_secret
JWT_REFRESH_TOKEN=replace_with_another_long_random_secret

# Google sign-in
GOOGLE_URL=your_google_user_info_endpoint

# Email delivery (Gmail SMTP through Nodemailer)
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

# Cloudinary uploads
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

Fill in the values for your own services. Keep secrets in environment files; do not commit them.

Install backend dependencies and apply the Prisma migrations:

```bash
cd Backend
npm install
npx prisma generate
npx prisma migrate dev
```

Start the API and both background workers:

```bash
npm run dev
```

The API runs on `http://localhost:3000` by default. A health endpoint is available at `GET /health`.

The development command starts the Express server, invitation worker, and task-reminder worker together. Redis must be reachable for the cache, token tracking, rate limits, and queues.

### 3. Configure and start the frontend

Create `Frontend/.env`:

```env
VITE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Optional links used on the landing page
VITE_LinkedInURL=your_linkedin_url
VITE_GithubURL=https://github.com/Darshan000234
VITE_Email=your_email_address
```

Install dependencies and start Vite in a separate terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The backend's `CLIENT_URL` must match the frontend origin because CORS is configured for that origin and credentials are enabled.

Google sign-in, email delivery, and file uploads require their respective credentials. Email/password authentication and the core application still require the database, Redis, and JWT secrets.

## API Overview

Routes below are mounted by the Express server. Protected route groups require a valid access token in the `Authorization: Bearer <token>` header.

| Base path | Purpose |
|---|---|
| `/user` | Signup, login, Google sign-in, token refresh, profile, logout, account deletion |
| `/orgs` | Organization/workspace management, active workspace, members, statistics and organization tasks |
| `/orgs/proj` | Project creation, listing, editing, deletion and manager reassignment |
| `/proj/task` | Task creation, listing, filtering, editing, assignment and statistics |
| `/proj/team` | Project members and task assignment management |
| `/invites` | Organization invitations: create, list, accept, reject and delete |
| `/proj/task/chat` | Task discussion messages and file attachments |
| `/audit` | Filtered, paginated audit-log queries |
| `/setting` | Username updates |
| `/health` | Basic health check |

## Data Model

The Prisma schema models users, organizations, organization memberships, projects, project memberships, tasks, task assignees, team invitations, task messages, and audit logs. Unique constraints and indexes support membership relationships and common lookups.

## Development Notes

- Backend entry point: `Backend/src/server.js`
- Prisma schema: `Backend/prisma/schema.prisma`
- Frontend entry point: `Frontend/src/main.jsx`
- Frontend scripts: `npm run dev`, `npm run build`, `npm run lint`
- Backend scripts: `npm run dev`, `npm start`, `npm run worker:invite`, `npm run worker:reminder`

This repository is a learning and portfolio project. Automated test scripts are not currently configured in the package manifests.

## Author

**Darshan Desale**

- GitHub: [Darshan000234](https://github.com/Darshan000234)
- LinkedIn: [Darshan Desale](https://www.linkedin.com/in/darshan-desale-66114028b/)
