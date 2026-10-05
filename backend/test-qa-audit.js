/**
 * Comprehensive Senior QA Audit Script
 * Tests Authentication, RBAC, Admin CRUD, Teacher workflows, Parent workflows, and DB constraints
 */
const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failed++;
    errors.push({ testName, details });
  }
}

async function runAudit() {
  console.log('========================================================');
  console.log('       STARTING COMPLETE END-TO-END QA AUDIT');
  console.log('========================================================\n');

  // --- SECTION 1: AUTHENTICATION & ACCESS CONTROL ---
  console.log('--- 1. Testing Authentication & RBAC ---');

  // 1.1 Invalid Login
  const invRes = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@preschool.com', password: 'WrongPassword' },
  });
  assert(invRes.status === 401 && !invRes.data?.success, '1.1 Reject invalid password with 401');

  // 1.2 Non-existent user
  const nonExRes = await req('/auth/login', {
    method: 'POST',
    body: { email: 'ghost@preschool.com', password: 'AnyPassword' },
  });
  assert(nonExRes.status === 401 && !nonExRes.data?.success, '1.2 Reject non-existent user with 401');

  // 1.3 Valid Admin Login
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@preschool.com', password: 'Admin@123' },
  });
  assert(adminLogin.status === 200 && adminLogin.data?.success && adminLogin.data?.token, '1.3 Admin login success with JWT');
  const adminToken = adminLogin.data?.token;

  // 1.4 Valid Teacher Login
  const teacherLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'teacher@preschool.com', password: 'Teacher@123' },
  });
  assert(teacherLogin.status === 200 && teacherLogin.data?.success, '1.4 Teacher login success');
  const teacherToken = teacherLogin.data?.token;

  // 1.5 Valid Parent Login
  const parentLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'parent@preschool.com', password: 'Parent@123' },
  });
  assert(parentLogin.status === 200 && parentLogin.data?.success, '1.5 Parent login success');
  const parentToken = parentLogin.data?.token;

  // 1.6 Unauthorized Request (no token)
  const noTokenRes = await req('/users');
  assert(noTokenRes.status === 401, '1.6 Reject request without token with 401');

  // 1.7 Malformed Token
  const badTokenRes = await req('/users', {
    headers: { Authorization: 'Bearer thisisnotavalidjwt' },
  });
  assert(badTokenRes.status === 401, '1.7 Reject malformed token with 401');

  // 1.8 Role Restriction: Teacher cannot access Admin User Management
  const teacherForbiddenRes = await req('/users', {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert(teacherForbiddenRes.status === 403, '1.8 Teacher denied access to Admin User Management with 403');

  // 1.9 Role Restriction: Parent cannot access Teacher Management
  const parentForbiddenRes = await req('/teachers', {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(parentForbiddenRes.status === 403, '1.9 Parent denied access to Teacher Management with 403');


  // --- SECTION 2: ADMIN CRUD OPERATIONS ---
  console.log('\n--- 2. Testing Admin CRUD Operations ---');
  const authHeader = { Authorization: `Bearer ${adminToken}` };

  // 2.1 Classes CRUD
  const classCreate = await req('/classes', {
    method: 'POST',
    headers: authHeader,
    body: {
      name: 'QA Audit Class',
      section: 'QA',
      roomNumber: 'Room 999',
      capacity: 15,
      description: 'Temporary class for QA audit',
    },
  });
  assert(classCreate.status === 201 && classCreate.data?.class?._id, '2.1 Create Class');
  const classId = classCreate.data?.class?._id;

  const classGet = await req(`/classes/${classId}`, { headers: authHeader });
  assert(classGet.status === 200 && classGet.data?.class?.name === 'QA Audit Class', '2.2 Read Class by ID');

  const classUpdate = await req(`/classes/${classId}`, {
    method: 'PUT',
    headers: authHeader,
    body: { name: 'QA Audit Class Updated', capacity: 20 },
  });
  assert(classUpdate.status === 200 && classUpdate.data?.class?.capacity === 20, '2.3 Update Class');

  // 2.2 Parent CRUD
  const parentCreate = await req('/parents', {
    method: 'POST',
    headers: authHeader,
    body: {
      name: 'QA Test Parent',
      email: `qa.parent.${Date.now()}@preschool.com`,
      password: 'Password@123',
      phone: '+1 555 999 0001',
      relationship: 'Mother',
      occupation: 'QA Engineer',
      address: '123 QA Lane',
    },
  });
  assert(parentCreate.status === 201 && parentCreate.data?.parent?._id, '2.4 Create Parent');
  const parentId = parentCreate.data?.parent?._id;

  // 2.3 Student CRUD
  const studentCreate = await req('/students', {
    method: 'POST',
    headers: authHeader,
    body: {
      firstName: 'Audit',
      lastName: 'Kid',
      dateOfBirth: '2022-05-15',
      gender: 'Male',
      bloodGroup: 'O+',
      rollNumber: `QA-${Date.now()}`,
      class: classId,
      parent: parentId,
      admissionDate: '2026-09-01',
    },
  });
  assert(studentCreate.status === 201 && studentCreate.data?.student?._id, '2.5 Create Student');
  const studentId = studentCreate.data?.student?._id;

  const studentGet = await req(`/students/${studentId}`, { headers: authHeader });
  assert(studentGet.status === 200 && studentGet.data?.student?.firstName === 'Audit', '2.6 Read Student by ID');

  const studentUpdate = await req(`/students/${studentId}`, {
    method: 'PUT',
    headers: authHeader,
    body: { firstName: 'AuditUpdated' },
  });
  assert(studentUpdate.status === 200 && studentUpdate.data?.student?.firstName === 'AuditUpdated', '2.7 Update Student');

  // 2.4 Teacher CRUD
  const teacherCreate = await req('/teachers', {
    method: 'POST',
    headers: authHeader,
    body: {
      name: 'QA Instructor',
      email: `qa.teacher.${Date.now()}@preschool.com`,
      password: 'Password@123',
      phone: '+1 555 999 0002',
      employeeId: `TCH-QA-${Date.now()}`,
      qualification: 'M.Ed',
      specialization: 'Early Childhood Care',
      joiningDate: '2026-01-10',
    },
  });
  assert(teacherCreate.status === 201 && teacherCreate.data?.teacher?._id, '2.8 Create Teacher');
  const teacherId = teacherCreate.data?.teacher?._id;

  // 2.5 Attendance
  const attRes = await req('/attendance', {
    method: 'POST',
    headers: authHeader,
    body: {
      student: studentId,
      class: classId,
      date: '2026-10-04',
      status: 'Present',
      remarks: 'Audited attendance mark',
    },
  });
  assert(attRes.status === 200 || attRes.status === 201, '2.9 Mark Single Student Attendance');

  // 2.6 Schedule / Timetable
  const schedCreate = await req('/schedules', {
    method: 'POST',
    headers: authHeader,
    body: {
      class: classId,
      subject: 'Creative Art & Music',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Room 999',
    },
  });
  assert(schedCreate.status === 201 && schedCreate.data?.schedule?._id, '2.10 Create Class Schedule');
  const scheduleId = schedCreate.data?.schedule?._id;

  // 2.7 Fees Management
  const feeCreate = await req('/fees', {
    method: 'POST',
    headers: authHeader,
    body: {
      student: studentId,
      feeType: 'Tuition Fee',
      amount: 500,
      dueDate: '2026-11-01',
      academicYear: '2026-2027',
      description: 'Term 1 Tuition Audit',
    },
  });
  assert(feeCreate.status === 201 && feeCreate.data?.fee?._id, '2.11 Create Fee Invoice');
  const feeId = feeCreate.data?.fee?._id;
  assert(feeCreate.data?.fee?.status === 'PENDING' && feeCreate.data?.fee?.remainingAmount === 500, '2.12 Fee Initial Status PENDING with 500 remaining');

  // 2.8 Payment Recording (Partial Payment)
  const partialPay = await req(`/fees/${feeId}/payment`, {
    method: 'POST',
    headers: authHeader,
    body: {
      amount: 200,
      paymentMethod: 'Credit Card',
      transactionId: `TXN-${Date.now()}`,
      notes: 'Partial deposit',
    },
  });
  assert(partialPay.status === 201 && partialPay.data?.fee?.status === 'PARTIAL', '2.13 Partial Payment status is PARTIAL');
  assert(partialPay.data?.fee?.remainingAmount === 300, '2.14 Partial Payment updates remainingAmount to 300');

  // 2.9 Full Payment
  const fullPay = await req(`/fees/${feeId}/payment`, {
    method: 'POST',
    headers: authHeader,
    body: {
      amount: 300,
      paymentMethod: 'Cash',
      transactionId: `TXN-FINAL-${Date.now()}`,
      notes: 'Final settlement',
    },
  });
  assert(fullPay.status === 201 && fullPay.data?.fee?.status === 'PAID', '2.15 Full Payment status transitions to PAID');
  assert(fullPay.data?.fee?.remainingAmount === 0, '2.16 Full Payment updates remainingAmount to 0');

  // 2.10 Announcements CRUD
  const annCreate = await req('/announcements', {
    method: 'POST',
    headers: authHeader,
    body: {
      title: 'QA Audit Announcement',
      message: 'This is a verified test announcement.',
      targetRole: 'ALL',
      priority: 'high',
      status: 'PUBLISHED',
    },
  });
  assert(annCreate.status === 201 && annCreate.data?.announcement?._id, '2.17 Create Announcement');
  const announcementId = annCreate.data?.announcement?._id;

  // 2.11 Events CRUD
  const eventCreate = await req('/events', {
    method: 'POST',
    headers: authHeader,
    body: {
      title: 'QA Sports Day Gala',
      description: 'Annual athletics event for testing.',
      date: '2026-11-20',
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      location: 'Main Field',
      category: 'Sports',
      targetAudience: 'ALL',
    },
  });
  assert(eventCreate.status === 201 && eventCreate.data?.event?._id, '2.18 Create Event');
  const eventId = eventCreate.data?.event?._id;

  // 2.12 Dashboard Admin & Charts
  const adminDash = await req('/dashboard/admin', { headers: authHeader });
  assert(adminDash.status === 200 && adminDash.data?.data?.stats?.totalStudents > 0, '2.19 Admin Dashboard Stats');

  const adminCharts = await req('/dashboard/admin/charts', { headers: authHeader });
  assert(adminCharts.status === 200 && (adminCharts.data?.data?.attendanceOverview || adminCharts.data?.attendanceOverview), '2.20 Admin Dashboard Charts');


  // --- SECTION 3: TEACHER WORKFLOWS ---
  console.log('\n--- 3. Testing Teacher Workflows ---');
  const teacherHeader = { Authorization: `Bearer ${teacherToken}` };

  const teachDash = await req('/dashboard/teacher', { headers: teacherHeader });
  assert(teachDash.status === 200 && teachDash.data?.success, '3.1 Teacher Dashboard Endpoint');

  const teachAnn = await req('/announcements', { headers: teacherHeader });
  assert(teachAnn.status === 200 && Array.isArray(teachAnn.data?.announcements || teachAnn.data?.data), '3.2 Teacher View Announcements');

  const teachEvents = await req('/events', { headers: teacherHeader });
  assert(teachEvents.status === 200 && Array.isArray(teachEvents.data?.events || teachEvents.data?.data), '3.3 Teacher View Events');


  // --- SECTION 4: PARENT WORKFLOWS ---
  console.log('\n--- 4. Testing Parent Workflows ---');
  const parentHeader = { Authorization: `Bearer ${parentToken}` };

  const parentDash = await req('/dashboard/parent', { headers: parentHeader });
  assert(parentDash.status === 200 && parentDash.data?.success, '4.1 Parent Dashboard Endpoint');

  const parentFees = await req('/fees', { headers: parentHeader });
  assert(parentFees.status === 200 && Array.isArray(parentFees.data?.fees || parentFees.data?.data), '4.2 Parent View Child Fees');

  const parentPayments = await req('/payments', { headers: parentHeader });
  assert(parentPayments.status === 200 && Array.isArray(parentPayments.data?.payments || parentPayments.data?.data), '4.3 Parent View Payments');

  const parentAnn = await req('/announcements', { headers: parentHeader });
  assert(parentAnn.status === 200 && Array.isArray(parentAnn.data?.announcements || parentAnn.data?.data), '4.4 Parent View Announcements');


  // --- SECTION 5: DATABASE CONSTRAINTS & DUPLICATE PREVENTION ---
  console.log('\n--- 5. Testing Database Validation & Duplicate Prevention ---');

  // 5.1 Duplicate Email in User registration
  const dupUserRes = await req('/users', {
    method: 'POST',
    headers: authHeader,
    body: {
      name: 'Duplicate Test',
      email: 'admin@preschool.com', // Already used
      password: 'Password@123',
      role: 'teacher',
    },
  });
  assert(dupUserRes.status === 400 || dupUserRes.status === 409 || !dupUserRes.data?.success, '5.1 Prevent Duplicate User Email');

  // 5.2 Invalid Field Validation (invalid email format)
  const badEmailRes = await req('/users', {
    method: 'POST',
    headers: authHeader,
    body: {
      name: 'Bad Email User',
      email: 'not-an-email',
      password: 'Password@123',
      role: 'parent',
    },
  });
  assert(badEmailRes.status === 400 || !badEmailRes.data?.success, '5.2 Reject Invalid Email Format');

  // --- SECTION 6: CLEANUP TEMPORARY QA RECORDS ---
  console.log('\n--- 6. Cleanup Temporary QA Audit Records ---');
  await req(`/events/${eventId}`, { method: 'DELETE', headers: authHeader });
  await req(`/announcements/${announcementId}`, { method: 'DELETE', headers: authHeader });
  await req(`/fees/${feeId}`, { method: 'DELETE', headers: authHeader });
  await req(`/schedules/${scheduleId}`, { method: 'DELETE', headers: authHeader });
  await req(`/students/${studentId}`, { method: 'DELETE', headers: authHeader });
  await req(`/parents/${parentId}`, { method: 'DELETE', headers: authHeader });
  await req(`/teachers/${teacherId}`, { method: 'DELETE', headers: authHeader });
  await req(`/classes/${classId}`, { method: 'DELETE', headers: authHeader });
  console.log('  [CLEANUP] Temporary audit records cleanly removed.');

  console.log('\n========================================================');
  console.log(`AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    console.error('\nFAILED TESTS DETAILS:');
    errors.forEach(e => console.error(`- ${e.testName}: ${e.details}`));
    process.exit(1);
  } else {
    console.log('\nALL END-TO-END TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit Script Failed Exceptionally:', err);
  process.exit(1);
});
