# Hostel Management & Room Allocation System

A production-quality full-stack web application for managing hostel allocation, room selection, and document verification for a college.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT |
| File Uploads | Multer + Cloudinary |

## Features

### Admin (setup order matters)
1. **Student Management** — master student database (required first)
   - Add, edit, delete, search students
   - Import CSV/Excel bulk upload
   - Download import template
2. **Warden Management** — create warden pool
   - Add, edit, delete wardens with Employee ID, mobile, PIN
3. **Academic Structure** — configure branches & strength per year (required before mapping)
   - Upload Excel/CSV with Academic Year, Branch, Student Strength
   - Manual CRUD, search/filter by year
   - Re-upload to update existing year-branch records
4. **Hostel Management** — import or add hostels, then assign warden
   - Import hostels via Excel/CSV (Name, Code, Capacity, Floors, Gender, Status)
   - Import rooms via Excel/CSV (Room Number, Hostel Code/Name, Floor, Capacity, Status)
   - Manual CRUD for hostels and rooms per hostel
   - Download import templates
5. **Branch-Year Mapping** — only after academic structure + wardens are ready
6. **Dashboard & Allocation Overview**

Students cannot self-register — only admin-added students can log in.

### Student
- Login with registration number, roll number, email
- Automatic hostel assignment based on branch + year
- Group creation (size 1-3)
- Roommate invitations with accept/reject
- Room selection with vacancy filtering
- Document upload via Cloudinary
- Allocation confirmation

### Warden
- Dashboard for assigned hostel only
- Student list with room details
- Room occupancy monitoring
- Document viewing and verification

## Project Structure

```
hostel_room allocation/
├── backend/
│   ├── src/
│   │   ├── config/         # DB & Cloudinary config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, upload
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── seeds/          # Seed data
│   │   ├── utils/          # Helpers & constants
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Role-based pages
│   │   ├── services/       # API client
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for document uploads)

### 1. Clone and Install

```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Configure Environment

**backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hostel_allocation
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## API Endpoints

### Auth
- `POST /api/auth/admin/login`
- `POST /api/auth/student/login`
- `POST /api/auth/warden/login`
- `GET /api/auth/me`

### Admin
- `GET/POST/PUT/DELETE /api/admin/students`
- `POST /api/admin/students/import` — CSV/Excel upload
- `GET /api/admin/students/template` — download template
- `GET/POST/PUT/DELETE /api/admin/wardens`
- `GET /api/admin/wardens/available`
- `GET/POST/PUT/DELETE /api/admin/academic-structure`
- `GET /api/admin/academic-structure/template` — download template
- `POST /api/admin/academic-structure/import` — bulk upload (upserts by year+branch)
- `GET /api/admin/academic-structure/years` — distinct academic years
- `GET /api/admin/academic-structure/status` — configured flag
- `GET /api/admin/academic-structure/by-year/:year` — branches for a year
- `POST /api/admin/hostels/:hostelId/assign-warden-by-id`
- `DELETE /api/admin/hostels/:hostelId/warden`
- `GET /api/admin/dashboard`
- `GET /api/admin/allocation-overview`
- `GET /api/admin/branch-strengths`
- `GET /api/admin/mappings`
- `GET /api/admin/hostels/list`
- `GET /api/admin/hostels/template` — download hostel import template
- `POST /api/admin/hostels/import` — bulk hostel import
- `POST/PUT/DELETE /api/admin/hostels`
- `GET /api/admin/hostels/:id`
- `GET /api/admin/hostels/:id/mappings`
- `POST /api/admin/hostels/:id/mappings`
- `POST /api/admin/hostels/:hostelId/recalculate-capacity`
- `GET /api/admin/rooms/template` — download room import template
- `POST /api/admin/rooms/import` — bulk room import (all hostels)
- `GET/POST /api/admin/hostels/:hostelId/rooms`
- `POST /api/admin/hostels/:hostelId/rooms/import`
- `PUT/DELETE /api/admin/rooms/:roomId`

### Student
- `GET /api/student/dashboard`
- `POST /api/student/group`
- `POST /api/student/group/invite`
- `PUT /api/student/invitations/:id/respond`
- `GET /api/student/rooms`
- `POST /api/student/rooms/select`
- `POST /api/student/documents`

### Warden
- `GET /api/warden/dashboard`
- `GET /api/warden/students`
- `GET /api/warden/rooms`
- `GET /api/warden/documents`
- `PUT /api/warden/documents/:id/verify`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

## Business Rules

- Admin must populate master student database before allocation
- Academic structure (branch + strength per year) must be configured before branch-year hostel mapping
- Students cannot self-register; login only works for admin-added records
- Warden must be assigned to a hostel before branch-year mapping
- One warden per hostel; one hostel per warden
- One student can belong to only one group
- Maximum group size is 3
- Room selection only when all invitations are accepted
- Rejecting an invitation resets the group process
- Rooms shown only if `vacantSeats >= groupSize`
- Room selection is final after document submission
- Wardens can only access their assigned hostel
- Group leader uploads documents for all roommates

## License

MIT
