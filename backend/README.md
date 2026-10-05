# 🏫 Sunshine Kids - Pre-School Management System REST API

A production-quality, modular, and enterprise-grade Express.js REST API with MongoDB, JWT Authentication, and Role-Based Access Control (RBAC).

---

## 🏗️ Architecture & Directory Structure

```
backend/
├── src/
│   ├── config/             # Database connection & memory fallback
│   │   └── db.js
│   ├── controllers/        # Clean HTTP controllers handling req/res
│   │   ├── announcementController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── classController.js
│   │   ├── dashboardController.js
│   │   ├── eventController.js
│   │   ├── feeController.js
│   │   ├── parentController.js
│   │   ├── reportController.js
│   │   ├── scheduleController.js
│   │   ├── settingController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   └── userController.js
│   ├── middleware/         # Auth, Authorization, Error Handling, Validation
│   │   ├── auth.js
│   │   ├── errorMiddleware.js
│   │   ├── notFound.js
│   │   └── validate.js
│   ├── models/             # Mongoose schemas with virtuals & indexing
│   │   ├── Announcement.js
│   │   ├── Attendance.js
│   │   ├── Class.js
│   │   ├── Event.js
│   │   ├── Fee.js
│   │   ├── Parent.js
│   │   ├── Payment.js
│   │   ├── Schedule.js
│   │   ├── Setting.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   └── User.js
│   ├── routes/             # RESTful API route definitions
│   │   ├── announcementRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── authRoutes.js
│   │   ├── classRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── feeRoutes.js
│   │   ├── parentRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── scheduleRoutes.js
│   │   ├── settingRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   └── userRoutes.js
│   ├── services/           # Encapsulated business logic & database queries
│   │   ├── announcementService.js
│   │   ├── attendanceService.js
│   │   ├── authService.js
│   │   ├── classService.js
│   │   ├── dashboardService.js
│   │   ├── eventService.js
│   │   ├── feeService.js
│   │   ├── parentService.js
│   │   ├── reportService.js
│   │   ├── scheduleService.js
│   │   ├── settingService.js
│   │   ├── studentService.js
│   │   ├── teacherService.js
│   │   └── userService.js
│   ├── utils/              # ApiError, ApiResponse, asyncHandler, token helpers
│   │   ├── apiError.js
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── objectIdUtil.js
│   │   └── tokenUtil.js
│   ├── validators/         # Express-validator schema rules & ObjectId checks
│   │   ├── announcementValidator.js
│   │   ├── attendanceValidator.js
│   │   ├── authValidator.js
│   │   ├── classValidator.js
│   │   ├── commonValidators.js
│   │   ├── eventValidator.js
│   │   ├── feeValidator.js
│   │   ├── parentValidator.js
│   │   ├── scheduleValidator.js
│   │   ├── studentValidator.js
│   │   ├── teacherValidator.js
│   │   └── userValidator.js
│   ├── seeds/              # Database population scripts
│   │   ├── seed.js
│   │   └── seedFunction.js
│   ├── app.js              # Express app setup, CORS, Helmet, Morgan, and routers
│   └── server.js           # Server listen & unhandled rejection handling
├── .env                    # Active environment variables
├── .env.example            # Environment template
├── package.json
└── README.md
```

---

## 🛡️ Security & Best Practices

1. **Password Protection**:
   - `password` field set to `{ select: false }` on the `User` schema.
   - Pre-save `bcryptjs` hashing with salt rounds.
   - `toJSON` transform automatically strips `password` from responses.
2. **Layer Separation**:
   - **Routes**: Define endpoints, wire middleware and validators.
   - **Validators**: Enforce schemas, sanitize inputs, validate 24-character hexadecimal MongoDB ObjectIds.
   - **Controllers**: Lean request/response delegates using `asyncHandler`.
   - **Services**: Pure business logic, duplicate prevention, and Mongoose operations.
   - **Utils**: Standard `ApiError` class and `ApiResponse` envelope.
3. **Database Resilience**:
   - Primary: Connects to `MONGODB_URI` (`mongodb://127.0.0.1:27017/preschool_db`).
   - Fallback: Auto-spins up `mongodb-memory-server` if local MongoDB is inactive, ensuring zero-config local operation.
4. **Duplicate Prevention**:
   - Unique email and employee IDs.
   - Unique compound index `{ student: 1, dateString: 1 }` on `Attendance` prevents duplicate roll calls on the same day.
   - Timetable collision prevention for identical class, day, and time slots.
   - Unique transaction and receipt numbers for fee payments.

---

## 🔑 Development Seed Credentials

> [!IMPORTANT]
> **DEVELOPMENT & TESTING CREDENTIALS ONLY**
> The following accounts are pre-seeded for local testing and role-based demonstration purposes. Never use these in a production deployment.

| Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Admin** | `admin@preschool.com` | `Admin@123` | Full system access: manage teachers, classes, fees, announcements, students, settings |
| **Teacher** | `teacher@preschool.com` | `Teacher@123` | Assigned classes, student directory, class timetable, mark/bulk attendance |
| **Parent** | `parent@preschool.com` | `Parent@123` | View own child profile, child attendance history, class schedules, fee dues & online payment |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/preschool_db
JWT_SECRET=supersecret_preschool_jwt_key_2026_dev_prod
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Start Server
```bash
# Development with nodemon
npm run dev

# Production
npm start
```

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register a new user account (`admin`, `teacher`, or `parent`).
- `POST /api/auth/login`: Authenticate with email/password and receive JWT Bearer token.
- `GET /api/auth/me`: Fetch currently authenticated user profile (password stripped).
- `PUT /api/auth/profile`: Update current user's name, phone, and avatar.
- `PUT /api/auth/change-password`: Change password.

### Students (`/api/students`)
- `GET /api/students`: List students with filters (`search`, `classId`, `status`, `page`, `limit`).
- `GET /api/students/:id`: Get full student profile with class and parent info.
- `POST /api/students`: Register student *(Admin)*.
- `PUT /api/students/:id`: Update student record *(Admin, Teacher)*.
- `DELETE /api/students/:id`: Delete student record *(Admin)*.
- `GET /api/students/class/:classId`: Get all students enrolled in a class.

### Teachers (`/api/teachers`)
- `GET /api/teachers`: List all teachers *(Admin)*.
- `GET /api/teachers/:id`: Get teacher profile *(Admin, Teacher)*.
- `POST /api/teachers`: Register teacher and provision user account *(Admin)*.
- `PUT /api/teachers/:id`: Update teacher profile *(Admin, Teacher)*.
- `DELETE /api/teachers/:id`: Delete teacher *(Admin)*.

### Parents (`/api/parents`)
- `GET /api/parents`: List parents with children *(Admin)*.
- `GET /api/parents/:id`: Get parent details *(Admin, Parent)*.
- `POST /api/parents`: Register parent profile *(Admin)*.
- `PUT /api/parents/:id`: Update parent profile *(Admin, Parent)*.
- `DELETE /api/parents/:id`: Delete parent *(Admin)*.

### Classes (`/api/classes`)
- `GET /api/classes`: List all preschool classes with live enrollment counts.
- `GET /api/classes/:id`: Get class details with student list.
- `POST /api/classes`: Create class *(Admin)*.
- `PUT /api/classes/:id`: Update class *(Admin)*.
- `DELETE /api/classes/:id`: Delete class *(Admin)*.

### Attendance (`/api/attendance`)
- `GET /api/attendance`: Query attendance by `classId` and `date`.
- `POST /api/attendance`: Mark single student attendance (duplicate-safe upsert).
- `POST /api/attendance/bulk`: Bulk roll-call marking for a class.
- `GET /api/attendance/student/:studentId`: Student attendance history and percentage rate.

### Schedules (`/api/schedules`)
- `GET /api/schedules`: List all timetable schedule items.
- `GET /api/schedules/class/:classId`: Get timetable for class.
- `POST /api/schedules`: Create timetable slot *(Admin)*.
- `PUT /api/schedules/:id`: Update timetable slot *(Admin)*.
- `DELETE /api/schedules/:id`: Delete timetable slot *(Admin)*.

### Fees & Invoicing (`/api/fees`)
- `GET /api/fees`: Query fee invoices with status and type filters.
- `GET /api/fees/:id`: View invoice details and payment history.
- `GET /api/fees/student/:studentId`: Student-specific fee ledger.
- `POST /api/fees`: Issue new fee invoice *(Admin)*.
- `PUT /api/fees/:id`: Update fee invoice *(Admin)*.
- `DELETE /api/fees/:id`: Cancel/delete fee invoice *(Admin)*.
- `POST /api/fees/:id/payment`: Record payment / checkout.
- `GET /api/fees/payment/:paymentId`: Retrieve printable payment receipt.

### Announcements (`/api/announcements`)
- `GET /api/announcements`: List announcements (auto-filtered by audience role).
- `GET /api/announcements/:id`: View announcement details.
- `POST /api/announcements`: Post announcement *(Admin)*.
- `PUT /api/announcements/:id`: Update announcement *(Admin)*.
- `DELETE /api/announcements/:id`: Delete announcement *(Admin)*.

### Events (`/api/events`)
- `GET /api/events`: List calendar events by category or date.
- `GET /api/events/:id`: View event details.
- `POST /api/events`: Schedule event *(Admin)*.
- `PUT /api/events/:id`: Update event *(Admin)*.
- `DELETE /api/events/:id`: Delete event *(Admin)*.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/admin`: Executive KPIs, attendance rates, financial totals.
- `GET /api/dashboard/teacher`: Assigned classes, today's schedule, attendance status.
- `GET /api/dashboard/parent`: Children profiles, fee dues, attendance rates.

### Reports (`/api/reports`)
- `GET /api/reports/summary`: Demographic and operational totals.
- `GET /api/reports/attendance`: Attendance trends across days.
- `GET /api/reports/fees`: Financial collections and pending fee breakdown.

### Users (`/api/users`)
- `GET /api/users`: List system accounts *(Admin)*.
- `POST /api/users`: Provision user *(Admin)*.
- `PUT /api/users/:id`: Edit user / reset password *(Admin)*.
- `DELETE /api/users/:id`: Delete user account *(Admin)*.

### Settings (`/api/settings`)
- `GET /api/settings`: Get school information and academic preferences.
- `PUT /api/settings`: Update school branding and preferences *(Admin)*.
