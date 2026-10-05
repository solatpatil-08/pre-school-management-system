# Pre-School Management System

> A modern, full-stack, enterprise-grade **Early Childhood Education & Pre-School Management Platform** engineered with React 18, Vite, Tailwind CSS, Node.js, Express, and MongoDB.

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-emerald.svg)]()
[![Security](https://img.shields.io/badge/Security-Helmet%20%7C%20JWT%20%7C%20RBAC%20%7C%20RateLimit-red.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [User Roles & Permissions](#-user-roles--permissions)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Quick Start](#-installation--quick-start)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Database Configuration & Seeding](#4-database-configuration--seeding)
  - [5. Run the Application](#5-run-the-application)
- [Development Credentials](#-development-credentials)
- [Authentication & Authorization](#-authentication--authorization)
- [API Documentation](#-api-documentation)
- [Screenshots & UI Showcase](#-screenshots--ui-showcase)
- [Security Considerations](#-security-considerations)
- [Deployment Instructions](#-deployment-instructions)
- [Git & GitHub Workflow](#-git--github-workflow)
- [Troubleshooting](#-troubleshooting)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🌟 Project Overview

The **Pre-School Management System** is a purpose-built educational SaaS platform tailored specifically to early childhood education providers, daycares, Montessori schools, and kindergartens. 

Managing early childhood programs requires meticulous attention to health histories, dietary constraints, strict guardian pickup authorization, daily attendance rhythms, curriculum planning, and flexible installment fee schedules. This system streamlines administrative tasks, empowers early educators with interactive classroom tools, and provides parents with real-time insight into their child’s safety, wellness, and learning milestones.

---

## ✨ Key Features

### 👑 1. Admin Management Suite
- **Interactive Executive Dashboard**: Real-time statistical metrics powered by MongoDB aggregations—total enrolled students, active teachers, verified parents, daily attendance %, pending fee ledger, upcoming school events, priority bulletins, and recent school activities.
- **Visual Analytics**: Interactive responsive charts for 7-day attendance trends, room capacity & classroom enrollment occupancy, and fee collection reconciliation.
- **Student Information System (SIS)**: Full CRUD operations for child profiles, including date of birth, blood group, medical history, critical allergy warnings, emergency contact protocols, assigned classroom, and guardian linkage.
- **Staff & Educator Registry**: Teacher profiles with employee identification, qualifications, Montessori specializations, assigned classrooms, and contact details.
- **Guardian Directory**: Parent accounts linked to student profiles, complete with emergency phone lines, occupations, and home addresses.
- **Classroom & Capacity Management**: Room allocation, student cap enforcement, sectioning, and lead educator assignment.
- **Classroom Attendance Center**: Real-time roll call marking with status modes (`PRESENT`, `LATE`, `ABSENT`, `LEAVE`), bulk attendance submit, historical date picker, and daily attendance logs.
- **Weekly Schedule & Routine Planner**: Day-by-day timetable planner categorized by activity type (`Academic`, `Play`, `Meal`, `Arts & Craft`, `Music & Movement`, `Nap/Rest`) with room and teacher allocations.
- **Fees & Financial Management**: Fee invoicing with dynamic status calculation (`PENDING`, `PARTIAL`, `PAID`, `OVERDUE`), installment logging, payment receipts, search, status filtering, and payment ledger history.
- **School Announcements**: Multi-role broadcast announcements (`All`, `Teacher`, `Parent`) with priority badges (`Urgent`, `High`, `Normal`, `Low`) and pin-to-top functionality.
- **Events & Activities Calendar**: Interactive school calendar tracking celebrations, parent-teacher conferences, workshops, and sports days.
- **Reports & Data Export**: Pre-compiled attendance summaries, financial fee reports, and student enrollment occupancy breakdowns.
- **User Account Administration**: Role-based user oversight, credential resets, and account activation toggles.
- **Institution Settings**: Configurable school branding, academic term, contact metadata, currency, and admission number prefixes.

### 👩‍🏫 2. Teacher Portal
- **Dedicated Teacher Dashboard**: Assigned room overview, enrolled child headcount, today's schedule timetable, today's attendance summary, and relevant announcements.
- **Classroom Student Roster**: Direct access to student emergency contacts, health conditions, allergy alerts, and guardian info for assigned pupils.
- **Attendance Roll Call**: Quick marking of daily attendance with instant status indicators and remark tracking.
- **Daily Class Timetable**: Hourly activity timeline with room assignments, timeslots, and subject descriptions.
- **Circulars & Event Bulletins**: School-wide and teacher-targeted circulars, guidelines, and upcoming activity notices.
- **Profile & Security**: Self-service profile management and credential updates.

### 👨‍👩‍👧 3. Parent Portal
- **Family Dashboard**: Summary of enrolled children, school alerts, child attendance percentage, and pending fee dues.
- **Child Dossier**: Detailed medical profile, blood group, recorded allergies, and emergency protocols.
- **Attendance Monitoring**: Historical presence records, timestamps, and absence tracking.
- **Daily Routine Timetable**: Hourly view of child's daily schedule (circle time, meals, learning activities, nap periods).
- **Tuition & Fee Records**: Invoice breakdown, payment history, outstanding balance tracking, and printable receipts.
- **School Circulars & Events**: Direct stream of school circulars and upcoming events.

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework**: [React 18](https://react.dev/) with modern functional components and Hooks.
- **Build Tooling**: [Vite](https://vitejs.dev/) with Hot Module Replacement (HMR).
- **Styling & Design System**: [Tailwind CSS](https://tailwindcss.com/) customized with extended color palettes, card elevations, smooth CSS transitions, and mobile-first responsive breakpoints.
- **Routing**: [React Router v6](https://reactrouter.com/) with declarative role-guarded routes (`ProtectedRoute`).
- **Icons**: [Lucide React](https://lucide.dev/) for a unified, modern icon system.
- **HTTP Client**: [Axios](https://axios-http.com/) configured with base URL, bearer token interceptors, and automated 401 handling.
- **State Management**: React Context API (`AuthContext`, `ToastContext`).

### Backend Architecture
- **Runtime & Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
- **Database Engine**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/) with indexing, schema validation, and virtual population.
- **Embedded Database Fallback**: Built-in `mongodb-memory-server` fallback for instant zero-config developer onboarding without a local MongoDB service.
- **Authentication**: Stateless [JSON Web Tokens (JWT)](https://jwt.io/) signed with HMAC SHA-256.
- **Password Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) salted password hashing (10 rounds).
- **Input Validation**: [express-validator](https://express-validator.github.io/docs/) input sanitization and schema verification.
- **HTTP Security**: [Helmet](https://helmetjs.github.io/) HTTP security headers, CORS origin verification, and Rate Limiting.
- **Sanitization**: Custom regex sanitizers and NoSQL operator injection blockers.

---

## 🏗️ System Architecture

```
                          ┌─────────────────────────────┐
                          │   Client Application        │
                          │   React 18 + Vite + Tailwind│
                          └──────────────┬──────────────┘
                                         │ HTTPS / JSON
                                         ▼
                          ┌─────────────────────────────┐
                          │   Express API Gateway       │
                          │ (Helmet, CORS, RateLimiter) │
                          └──────────────┬──────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
      ┌───────────────────────────┐               ┌───────────────────────────┐
      │  Authentication Layer     │               │  Input Validation Layer   │
      │  (JWT + Role-Based RBAC)  │               │  (express-validator)      │
      └────────────┬──────────────┘               └─────────────┬─────────────┘
                   │                                            │
                   └─────────────────────┬──────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │   Controllers & Services    │
                          │ (Business Logic & Scoping)  │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │    Mongoose Data Models     │
                          │ (Indexed Schemas & Virtuals)│
                          └──────────────┬──────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
        ┌─────────────────────────┐             ┌─────────────────────────┐
        │  Local / Atlas MongoDB  │             │ Embedded Memory Server  │
        │  (Production / Dev)     │   --OR--    │ (Zero-Config Fallback)  │
        └─────────────────────────┘             └─────────────────────────┘
```

### Architectural Principles
1. **Layered Separation of Concerns**: Controller (HTTP handling) $\rightarrow$ Service (business rules & logic) $\rightarrow$ Model (database persistence & validation).
2. **Strict Role-Based Access Control (RBAC)**: All endpoints are secured by authentication middleware (`protect`) and authorized by role (`authorize('admin', 'teacher')`).
3. **IDOR Prevention**: Student, parent, and fee records verify ownership so parents can never access other children's dossiers or fee statements.
4. **Resilient Portability**: If MongoDB is not running locally, the server initializes an in-memory replica set and populates seeds automatically so development never halts.

---

## 👥 User Roles & Permissions

| Permission / Action | Admin | Teacher | Parent |
|---|:---:|:---:|:---:|
| View Executive School Dashboard | ✅ | ❌ | ❌ |
| View Teacher Dashboard | ❌ | ✅ | ❌ |
| View Parent & Family Dashboard | ❌ | ❌ | ✅ |
| Manage Student Profiles (CRUD) | ✅ | 👁️ View Assigned | 👁️ View Own Child |
| Manage Educators & Staff (CRUD) | ✅ | ❌ | ❌ |
| Manage Guardian Directory (CRUD) | ✅ | ❌ | ❌ |
| Manage Classes & Room Capacities | ✅ | 👁️ View Assigned | ❌ |
| Mark Daily Classroom Attendance | ✅ | ✅ Assigned Rooms | ❌ |
| View Attendance History & Logs | ✅ | ✅ Assigned Rooms | 👁️ View Own Child |
| Configure Daily & Weekly Timetables | ✅ | 👁️ View Schedule | 👁️ View Child Schedule |
| Create Fee Invoices & Payment Ledger | ✅ | ❌ | 👁️ View / Pay Own Child |
| Post Announcements & Circulars | ✅ | 👁️ View Notices | 👁️ View Notices |
| Create Calendar Events | ✅ | 👁️ View Events | 👁️ View Events |
| View Analytics & System Reports | ✅ | ❌ | ❌ |
| Manage User Accounts & Reset Passwords | ✅ | ❌ | ❌ |
| School Configuration Settings | ✅ | ❌ | ❌ |

---

## 📁 Folder Structure

```
Pre-School Management System/
├── package.json                          # Monorepo orchestration scripts
├── README.md                             # Project documentation
├── .gitignore                            # Root version control exclusions
│
├── backend/
│   ├── .env.example                      # Backend environment template
│   ├── package.json                      # Backend dependencies & scripts
│   ├── test-auth.js                      # Unit test for auth flows
│   ├── test-qa-audit.js                  # End-to-end 38-point QA audit test suite
│   ├── test-security-audit.js            # 21-point automated security audit suite
│   └── src/
│       ├── config/
│       │   ├── db.js                     # MongoDB connection & memory fallback
│       │   └── jwt.js                    # JWT configuration constants
│       ├── controllers/                  # 14 HTTP Request Handlers
│       │   ├── announcementController.js
│       │   ├── attendanceController.js
│       │   ├── authController.js
│       │   ├── classController.js
│       │   ├── dashboardController.js
│       │   ├── eventController.js
│       │   ├── feeController.js
│       │   ├── parentController.js
│       │   ├── paymentController.js
│       │   ├── reportController.js
│       │   ├── scheduleController.js
│       │   ├── settingController.js
│       │   ├── studentController.js
│       │   ├── teacherController.js
│       │   └── userController.js
│       ├── middleware/                   # Express Middleware Stack
│       │   ├── authMiddleware.js         # JWT verify & RBAC authorization
│       │   ├── errorMiddleware.js        # Global error & 404 handler
│       │   ├── mongoSanitize.js          # NoSQL operator injection defense
│       │   ├── rateLimiter.js            # Express API rate limiting
│       │   ├── securityHeaders.js        # Helmet and CSP headers
│       │   └── validate.js               # Express-validator error handler
│       ├── models/                       # 12 Mongoose Schemas
│       │   ├── Announcement.js
│       │   ├── Attendance.js
│       │   ├── Class.js
│       │   ├── Event.js
│       │   ├── Fee.js
│       │   ├── Parent.js
│       │   ├── Payment.js
│       │   ├── Schedule.js
│       │   ├── Setting.js
│       │   ├── Student.js
│       │   ├── Teacher.js
│       │   └── User.js
│       ├── routes/                       # Express Route Definitions
│       ├── seeds/                        # Database Seeds & Realistic Data
│       │   ├── seed.js                   # Standalone seed executor
│       │   └── seedFunction.js           # Reusable seeder logic
│       ├── services/                     # Business Logic Services
│       ├── utils/                        # Backend Utilities & Helpers
│       │   ├── apiError.js               # Standardized Error class
│       │   ├── commonUtil.js             # Pagination, regex, string normalization
│       │   └── index.js                  # Barrel export
│       ├── app.js                        # Express App initialization
│       └── server.js                     # HTTP Server listener
│
└── frontend/
    ├── .env.example                      # Frontend environment template
    ├── index.html                        # HTML5 document template
    ├── package.json                      # Frontend dependencies & build scripts
    ├── tailwind.config.js                # Tailwind theme extensions & tokens
    ├── vite.config.js                    # Vite configuration & proxy
    └── src/
        ├── api/
        │   ├── axios.js                  # Axios instance with interceptors
        │   ├── services.js               # Centralized API service layer
        │   └── index.js                  # Barrel export
        ├── components/
        │   ├── common/                   # Reusable UI Design System
        │   │   ├── Badge.jsx             # Status badge
        │   │   ├── Button.jsx            # Multi-variant button
        │   │   ├── Card.jsx              # Elevated card container
        │   │   ├── ConfirmDialog.jsx     # Destructive action modal
        │   │   ├── EmptyState.jsx        # Data empty placeholder
        │   │   ├── ErrorState.jsx        # Error display & retry banner
        │   │   ├── Input.jsx             # Accessible labeled input
        │   │   ├── Loader.jsx            # Multi-variant spinner / skeletons
        │   │   ├── LoadingSpinner.jsx    # Centered spinner
        │   │   ├── Modal.jsx             # Accessible dialog
        │   │   ├── Navbar.jsx            # Top bar with profile & quick alerts
        │   │   ├── Pagination.jsx        # Table pagination
        │   │   ├── ProtectedRoute.jsx    # Role-based route guard
        │   │   ├── Select.jsx            # Form select dropdown
        │   │   ├── Sidebar.jsx           # Responsive navigation drawer
        │   │   ├── Skeleton.jsx          # Pulse skeleton placeholders
        │   │   ├── StatCard.jsx          # Metric statistic cards
        │   │   ├── Table.jsx             # Accessible tabular layout
        │   │   ├── Toast.jsx             # Alert toast notifications
        │   │   └── index.js              # Centralized component export
        │   ├── dashboard/                # Analytics & Visualization Widgets
        │   │   ├── AttendanceChart.jsx   # 7-day attendance trends
        │   │   ├── EnrollmentChart.jsx   # Classroom occupancy bars
        │   │   ├── FeeChart.jsx          # Revenue breakdown
        │   │   └── RecentActivities.jsx  # Activity audit stream
        │   └── layout/
        │       └── DashboardLayout.jsx   # Main application dashboard layout
        ├── context/
        │   ├── AuthContext.jsx           # User session & auth state
        │   └── ToastContext.jsx          # Toast dispatch provider
        ├── pages/
        │   ├── Login.jsx                 # Login view with 1-click demo accounts
        │   ├── admin/                    # 13 Admin Management Views
        │   │   ├── AdminDashboard.jsx
        │   │   ├── StudentManagement.jsx
        │   │   ├── TeacherManagement.jsx
        │   │   ├── ParentManagement.jsx
        │   │   ├── ClassManagement.jsx
        │   │   ├── AttendanceManagement.jsx
        │   │   ├── ScheduleManagement.jsx
        │   │   ├── FeeManagement.jsx
        │   │   ├── AnnouncementManagement.jsx
        │   │   ├── EventManagement.jsx
        │   │   ├── UserManagement.jsx
        │   │   ├── Reports.jsx
        │   │   ├── Settings.jsx
        │   │   └── Profile.jsx
        │   ├── teacher/                  # 6 Teacher Portal Views
        │   │   ├── TeacherDashboard.jsx
        │   │   ├── TeacherStudents.jsx
        │   │   ├── TeacherAttendance.jsx
        │   │   ├── TeacherSchedule.jsx
        │   │   ├── TeacherAnnouncements.jsx
        │   │   └── TeacherEvents.jsx
        │   └── parent/                   # 6 Parent Portal Views
        │       ├── ParentDashboard.jsx
        │       ├── ChildProfile.jsx
        │       ├── ParentAttendance.jsx
        │       ├── ParentSchedule.jsx
        │       ├── ParentFees.jsx
        │       ├── ParentAnnouncements.jsx
        │       └── ParentEvents.jsx
        ├── routes/
        │   ├── AppRoutes.jsx             # Central routing configuration
        │   └── ProtectedRoute.jsx        # Route authentication guard
        ├── App.jsx                       # Root React Component
        ├── main.jsx                      # DOM mount point
        └── index.css                     # Tailwind directives & styles
```

---

## ⚡ Prerequisites

Before installing the project, verify that your development environment meets the following specifications:

- **Node.js**: Version `18.18.0` or higher (`v20.x` LTS recommended). Check with `node -v`.
- **npm**: Version `9.0.0` or higher (`v10.x` recommended). Check with `npm -v`.
- **MongoDB**: *(Optional)* Local MongoDB community server (v5.0+) running on port 27017 or a MongoDB Atlas connection string.
  > 💡 **Notice**: If you do not have MongoDB installed, the backend will **automatically start an embedded in-memory MongoDB instance** and seed it for you!

---

## 🚀 Installation & Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-username/preschool-management-system.git
cd preschool-management-system
```

### 2. Install Dependencies

You can install all dependencies across the root, backend, and frontend with a single command:

```bash
npm run install:all
```

*Or install them individually in their respective directories:*

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

#### Backend Configuration:
Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Review and adjust `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/preschool_db
JWT_SECRET=supersecret_preschool_jwt_key_2026_dev_prod
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

#### Frontend Configuration:
Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

Review `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Configuration & Seeding

Populate the database with realistic sample preschool data (classrooms, educators, pupils, medical details, schedules, attendance history, and fee records):

```bash
npm run seed
```

*Or from within the backend directory:*
```bash
cd backend && npm run seed
```

### 5. Run the Application

#### Single Command (Recommended — Starts Both Concurrently):
```bash
npm run dev
```
This runs both the backend Express server and the Vite React frontend in parallel.

---

#### Or Run Individually in Separate Terminals:

##### Terminal 1 — Start Backend Server:
```bash
npm run dev:backend
# Or: cd backend && npm run dev
```
*Backend runs on:* `http://localhost:5000`  
*API Health check:* `http://localhost:5000/api/health`

##### Terminal 2 — Start Frontend Client:
```bash
npm run dev:frontend
# Or: cd frontend && npm run dev
```
*Frontend runs on:* `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173` to access the application.

---

## 🔑 Development Credentials

The login page includes **1-Click Quick-Fill Demo Buttons** for convenience. You can also sign in manually using any of the following seeded credentials:

| Role | Email Address | Password | Description |
|---|---|---|---|
| **Admin (Principal)** | `admin@preschool.com` | `Admin@123` | Full system governance, financials, staffing & SIS |
| **Teacher (Educator)** | `teacher@preschool.com` | `Teacher@123` | Classroom attendance, student rosters & schedules |
| **Teacher (Secondary)** | `sarah.jenkins@preschool.com` | `Teacher@123` | Additional early educator profile |
| **Parent (Guardian)** | `parent@preschool.com` | `Parent@123` | Child progress, medical alerts, attendance & fees |
| **Parent (Secondary)** | `john.doe@parent.com` | `Parent@123` | Additional guardian profile |

> 🔒 **Security Notice**: Passwords adhere to strict complexity requirements: minimum 8 characters with at least one uppercase letter, one lowercase letter, and one number.

---

## 🔐 Authentication & Authorization

Authentication is handled statelessly via **JSON Web Tokens (JWT)**:

1. **User Sign-In**: The client transmits email and password to `POST /api/auth/login`.
2. **Credential Validation**: Passwords are verified against the salted bcrypt hash stored in MongoDB.
3. **Token Issuance**: A signed JWT containing user ID, role, and name is returned in the JSON payload:
   ```json
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "_id": "670...",
       "name": "School Principal",
       "email": "admin@preschool.com",
       "role": "admin"
     }
   }
   ```
4. **Token Storage**: The JWT is saved in `localStorage` by `AuthContext`.
5. **Request Authorization**: Axios automatically attaches the token to all outgoing requests via an HTTP Bearer header:
   ```http
   Authorization: Bearer <token>
   ```
6. **Backend Verification**: `authMiddleware.protect` extracts and verifies the token, while `authMiddleware.authorize(...roles)` enforces role-level authorization.

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

### 1. Authentication (`/api/auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate user & return JWT token |
| `POST` | `/auth/register` | Public (Parent only) | Register parent account |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/auth/profile` | Authenticated | Update current user name / phone |
| `PUT` | `/auth/change-password` | Authenticated | Update account password |

### 2. Students (`/api/students`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students` | Admin, Teacher, Parent | List students (scoped by role / class) |
| `POST` | `/students` | Admin | Enroll new student |
| `GET` | `/students/:id` | Admin, Teacher, Parent | Get student record (IDOR protected) |
| `PUT` | `/students/:id` | Admin | Update student information |
| `DELETE` | `/students/:id` | Admin | Delete student record |

### 3. Teachers (`/api/teachers`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/teachers` | Admin, Teacher | List all early educators |
| `POST` | `/teachers` | Admin | Create teacher profile |
| `GET` | `/teachers/:id` | Admin, Teacher | Retrieve teacher details |
| `PUT` | `/teachers/:id` | Admin | Update teacher record & assigned classes |
| `DELETE` | `/teachers/:id` | Admin | Delete teacher record |

### 4. Parents (`/api/parents`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/parents` | Admin | List all registered guardians |
| `POST` | `/parents` | Admin | Register parent & link children |
| `GET` | `/parents/:id` | Admin, Parent | Get guardian record (IDOR protected) |
| `PUT` | `/parents/:id` | Admin, Parent | Update guardian details (IDOR protected) |
| `DELETE` | `/parents/:id` | Admin | Delete parent record |

### 5. Classes (`/api/classes`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/classes` | Admin, Teacher, Parent | List all classrooms |
| `POST` | `/classes` | Admin | Create classroom & assign teacher |
| `GET` | `/classes/:id` | Admin, Teacher, Parent | Get classroom details |
| `PUT` | `/classes/:id` | Admin | Update classroom details & capacity |
| `DELETE` | `/classes/:id` | Admin | Delete classroom |

### 6. Attendance (`/api/attendance`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/attendance` | Admin, Teacher, Parent | Get attendance records (scoped by role) |
| `POST` | `/attendance` | Admin, Teacher | Mark single student attendance |
| `POST` | `/attendance/bulk` | Admin, Teacher | Mark bulk classroom attendance |
| `GET` | `/attendance/stats` | Admin, Teacher, Parent | Get attendance compliance metrics |
| `GET` | `/attendance/student/:id` | Admin, Teacher, Parent | Get student attendance history |

### 7. Schedules (`/api/schedules`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/schedules` | Admin, Teacher, Parent | List schedule slots |
| `POST` | `/schedules` | Admin | Create timetable activity slot |
| `PUT` | `/schedules/:id` | Admin | Update activity slot |
| `DELETE` | `/schedules/:id` | Admin | Delete activity slot |

### 8. Fees & Payments (`/api/fees`, `/api/payments`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/fees` | Admin, Parent | List fee invoices (scoped by parent child) |
| `POST` | `/fees` | Admin | Generate fee invoice |
| `GET` | `/fees/:id` | Admin, Parent | Get fee invoice details (IDOR protected) |
| `PUT` | `/fees/:id` | Admin | Update fee details |
| `DELETE` | `/fees/:id` | Admin | Delete fee record |
| `GET` | `/payments` | Admin, Parent | List payment transactions |
| `POST` | `/payments` | Admin, Parent | Record payment (auto-updates fee status) |

### 9. Announcements & Events (`/api/announcements`, `/api/events`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/announcements` | Authenticated | List announcements (filtered by user role) |
| `POST` | `/announcements` | Admin | Create announcement bulletin |
| `PUT` | `/announcements/:id` | Admin | Edit announcement |
| `DELETE` | `/announcements/:id` | Admin | Delete announcement |
| `GET` | `/events` | Authenticated | List events calendar |
| `POST` | `/events` | Admin | Create event |
| `PUT` | `/events/:id` | Admin | Edit event |
| `DELETE` | `/events/:id` | Admin | Delete event |

### 10. Dashboard & Reports (`/api/dashboard`, `/api/reports`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard/admin` | Admin | Real-time school KPIs, feeds & chart stats |
| `GET` | `/dashboard/teacher` | Teacher | Room schedule, attendance & student list |
| `GET` | `/dashboard/parent` | Parent | Child summary, dues, schedule & alerts |
| `GET` | `/reports/attendance` | Admin | Comprehensive attendance compliance report |
| `GET` | `/reports/fees` | Admin | Revenue billing & collection breakdown |
| `GET` | `/reports/enrollment` | Admin | Student classroom distribution report |

---

## 🖼️ Screenshots & UI Showcase

*To add screenshots to your repository, capture views and place image files in the `docs/screenshots/` directory.*

### 1. Executive Admin Dashboard
Comprehensive overview displaying school population, live attendance rates, fee balances, trend charts, and recent activity streams.
```markdown
![Admin Dashboard](docs/screenshots/admin-dashboard.png)
```

### 2. Student Registry & Health Profiles
Detailed dossiers containing vital health notes, allergies, blood groups, and designated guardian contact cards.
```markdown
![Student Management](docs/screenshots/student-management.png)
```

### 3. Classroom Roll Call & Attendance Center
Interactive daily attendance tracker with single-click bulk marking and color-coded status badges.
```markdown
![Attendance Management](docs/screenshots/attendance-tracker.png)
```

### 4. Financial Ledger & Printable Receipts
Fee invoice management with partial payment calculations, collection methods, and printable vouchers.
```markdown
![Fee Ledger](docs/screenshots/fee-management.png)
```

### 5. Parent & Family Portal
Guardian view showing enrolled children, daily routines, attendance percentages, and pending school notices.
```markdown
![Parent Portal](docs/screenshots/parent-portal.png)
```

---

## 🔒 Security Considerations

The application implements defense-in-depth security measures across the entire stack:

- **Password Hashing**: Passwords are protected using `bcryptjs` with 10 salt rounds. Plaintext passwords are never stored or returned in API responses.
- **Data Protection in Responses**: Mongoose schema projections (`select: false`) guarantee password fields are omitted across user queries.
- **Insecure Direct Object Reference (IDOR) Mitigation**: Strict ownership verification prevents parents from viewing or modifying records of other families.
- **NoSQL Injection Defense**: Custom sanitization middleware strips MongoDB query operators (`$gt`, `$ne`, `$where`, etc.) from incoming query strings and request bodies.
- **MongoDB ObjectId Validation**: Custom express-validator middleware validates all route params (`:id`) to prevent CastError stack trace leaks.
- **HTTP Security Headers**: Integrated with [Helmet](https://helmetjs.github.io/) to enforce:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-XSS-Protection: 1; mode=block`
  - `Permissions-Policy` restrictions
  - Removal of `X-Powered-By` fingerprinting
- **CORS Protection**: Access is restricted to trusted origins defined in `CLIENT_URL`.
- **API Rate Limiting**: Global rate limiter limits requests to 100 requests per 15-minute window per IP to safeguard against brute-force attacks and abuse.
- **Automated Security Verification**: Includes an automated 21-point security audit suite ([test-security-audit.js](file:///c:/Users/pratap%20solat/OneDrive/Pre-School%20Management%20System/backend/test-security-audit.js)) validating zero vulnerabilities.

---

## 🚢 Deployment Instructions

### Option 1: Full-Stack on Modern Cloud Platforms (Render / Railway)

#### 1. Backend Service (Web Service):
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `PORT` = `5000` (or platform default)
  - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/preschool_db`
  - `JWT_SECRET` = `<generate-strong-32-char-random-key>`
  - `JWT_EXPIRE` = `7d`
  - `CLIENT_URL` = `https://your-frontend-domain.vercel.app`

#### 2. Frontend Client (Static Site on Vercel / Netlify):
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL` = `https://your-backend-api.onrender.com/api`

---

## 🌿 Git & GitHub Workflow

Follow standard Git flow practices when collaborating on this repository:

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "feat: initial commit of production-ready Pre-School Management System"
```

### 2. Create GitHub Remote & Push
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/preschool-management-system.git
git push -u origin main
```

### 3. Branching & Commit Conventions
- `main`: Production-ready code.
- `develop`: Integration branch for tested features.
- `feature/<feature-name>`: Scoped branches for new features.
- `fix/<bug-name>`: Bug fixes and patches.

**Commit Format:**
```
feat(attendance): add bulk class attendance marking
fix(auth): correct token expiration handling in axios interceptor
docs(readme): update API documentation table
style(components): improve responsive modal styling
```

---

## 🔧 Troubleshooting

### 1. Port 5000 or 5173 is Already in Use (`EADDRINUSE`)
- **Backend**: Update `PORT=5001` in `backend/.env` and update `VITE_API_URL=http://localhost:5001/api` in `frontend/.env`.
- **Windows Command to Kill Port**:
  ```powershell
  # Find PID on port 5000
  netstat -ano | findstr :5000
  # Kill process by PID
  taskkill /PID <PID> /F
  ```

### 2. MongoDB Connection Refused (`ECONNREFUSED 127.0.0.1:27017`)
- Ensure the local MongoDB service is running:
  - Windows Services: Start the `MongoDB Server` service.
  - Linux/macOS: `sudo systemctl start mongod` or `brew services start mongodb-community`.
- Alternatively, leave `MONGODB_URI` blank or let the server auto-start the **embedded in-memory database**.

### 3. CORS Error in Browser Console
- Check `backend/.env` and verify `CLIENT_URL` matches your frontend origin (e.g., `http://localhost:5173`).
- Ensure no trailing slashes are present in `CLIENT_URL`.

### 4. Login Fails with "Invalid Credentials"
- Ensure you have executed `npm run seed` to load the default users.
- Verify password capitalization: passwords follow the `Role@123` pattern (`Admin@123`, `Teacher@123`, `Parent@123`).

---

## 🔭 Future Improvements

While the application is fully functional, upcoming releases can incorporate:
- [ ] **Real-time Push Notifications**: WebSocket integration for instant guardian alerts upon child check-in and checkout.
- [ ] **Payment Gateway Integration**: Direct Stripe / PayPal checkout integration for live debit/credit card processing.
- [ ] **Automated SMS & WhatsApp Alerts**: Twilio integration for emergency notifications and attendance broadcasts.
- [ ] **Bus & Transportation Live Tracking**: Geolocation route maps for school transport services.
- [ ] **Digital Portfolio & Photo Gallery**: Photo sharing module for classroom activities and developmental milestones.
- [ ] **Multi-Language Localization**: Full i18n support for multilingual family communication.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute this software for educational and commercial purposes.

---

<p align="center">
  Built with ❤️ for Early Childhood Educators, Administrators, and Families.
</p>
