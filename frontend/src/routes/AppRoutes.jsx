import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth Pages
import Login from '../pages/Login';

// Common / Shared Pages
import Profile from '../pages/admin/Profile';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentManagement from '../pages/admin/StudentManagement';
import TeacherManagement from '../pages/admin/TeacherManagement';
import ParentManagement from '../pages/admin/ParentManagement';
import ClassManagement from '../pages/admin/ClassManagement';
import AttendanceManagement from '../pages/admin/AttendanceManagement';
import ScheduleManagement from '../pages/admin/ScheduleManagement';
import FeeManagement from '../pages/admin/FeeManagement';
import AnnouncementManagement from '../pages/admin/AnnouncementManagement';
import EventManagement from '../pages/admin/EventManagement';
import Reports from '../pages/admin/Reports';
import UserManagement from '../pages/admin/UserManagement';
import Settings from '../pages/admin/Settings';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherStudents from '../pages/teacher/TeacherStudents';
import TeacherAttendance from '../pages/teacher/TeacherAttendance';
import TeacherSchedule from '../pages/teacher/TeacherSchedule';
import TeacherAnnouncements from '../pages/teacher/TeacherAnnouncements';
import TeacherEvents from '../pages/teacher/TeacherEvents';

// Parent Pages
import ParentDashboard from '../pages/parent/ParentDashboard';
import ChildProfile from '../pages/parent/ChildProfile';
import ParentAttendance from '../pages/parent/ParentAttendance';
import ParentSchedule from '../pages/parent/ParentSchedule';
import ParentFees from '../pages/parent/ParentFees';
import ParentAnnouncements from '../pages/parent/ParentAnnouncements';
import ParentEvents from '../pages/parent/ParentEvents';

// Helper Root Redirect
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleHome = {
    admin: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    parent: '/parent/dashboard',
  };

  return <Navigate to={roleHome[user?.role] || '/login'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="teachers" element={<TeacherManagement />} />
        <Route path="parents" element={<ParentManagement />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="schedules" element={<ScheduleManagement />} />
        <Route path="fees" element={<FeeManagement />} />
        <Route path="announcements" element={<AnnouncementManagement />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Teacher Protected Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="schedule" element={<TeacherSchedule />} />
        <Route path="announcements" element={<TeacherAnnouncements />} />
        <Route path="events" element={<TeacherEvents />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Parent Protected Routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="child" element={<ChildProfile />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="schedule" element={<ParentSchedule />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="announcements" element={<ParentAnnouncements />} />
        <Route path="events" element={<ParentEvents />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-All Route */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
