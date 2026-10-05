const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Teacher = require('./src/models/Teacher');
const Parent = require('./src/models/Parent');
const Class = require('./src/models/Class');
const Attendance = require('./src/models/Attendance');
const Fee = require('./src/models/Fee');
const Payment = require('./src/models/Payment');
const Announcement = require('./src/models/Announcement');
const Event = require('./src/models/Event');
const Schedule = require('./src/models/Schedule');

function request(port, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting Real Backend Dashboard System Tests ===');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  let mongoServer;
  let server;
  let port;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Admin Principal',
      email: 'admin@preschool.test',
      password: 'Password123!',
      role: 'admin',
    });

    const teacherUser = await User.create({
      name: 'Sarah Teacher',
      email: 'teacher@preschool.test',
      password: 'Password123!',
      role: 'teacher',
    });

    const parentUser = await User.create({
      name: 'John Parent',
      email: 'parent@preschool.test',
      password: 'Password123!',
      role: 'parent',
    });

    // 2. Create Classrooms
    const classNursery = await Class.create({
      name: 'Nursery Bluebirds',
      section: 'A',
      capacity: 15,
      roomNumber: 'Room 101',
      status: 'Active',
    });

    const classPreK = await Class.create({
      name: 'Pre-K Sunshine',
      section: 'B',
      capacity: 20,
      roomNumber: 'Room 102',
      status: 'Active',
    });

    // 3. Create Teacher profile
    const teacherProfile = await Teacher.create({
      user: teacherUser._id,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'teacher@preschool.test',
      phone: '555-0102',
      assignedClasses: [classNursery._id],
      status: 'Active',
    });

    // 4. Create Students
    const student1 = await Student.create({
      firstName: 'Leo',
      lastName: 'Smith',
      studentId: 'STU-1001',
      gender: 'Male',
      dateOfBirth: new Date('2021-04-12'),
      class: classNursery._id,
      status: 'Active',
      allergies: 'Peanuts',
    });

    const student2 = await Student.create({
      firstName: 'Mia',
      lastName: 'Smith',
      studentId: 'STU-1002',
      gender: 'Female',
      dateOfBirth: new Date('2022-01-20'),
      class: classNursery._id,
      status: 'Active',
      allergies: 'None',
    });

    const student3 = await Student.create({
      firstName: 'Noah',
      lastName: 'Davis',
      studentId: 'STU-1003',
      gender: 'Male',
      dateOfBirth: new Date('2021-08-15'),
      class: classPreK._id,
      status: 'Active',
      allergies: 'Dairy',
    });

    // 5. Create Parent profile
    const parentProfile = await Parent.create({
      user: parentUser._id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'parent@preschool.test',
      phone: '555-0103',
      relationship: 'Father',
      children: [student1._id, student2._id],
    });

    // 6. Create Attendance for today & historical days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Today's attendance
    await Attendance.create({
      student: student1._id,
      class: classNursery._id,
      date: today,
      dateString: todayStr,
      status: 'PRESENT',
      markedBy: teacherUser._id,
    });

    await Attendance.create({
      student: student2._id,
      class: classNursery._id,
      date: today,
      dateString: todayStr,
      status: 'LATE',
      markedBy: teacherUser._id,
    });

    await Attendance.create({
      student: student3._id,
      class: classPreK._id,
      date: today,
      dateString: todayStr,
      status: 'ABSENT',
      markedBy: adminUser._id,
    });

    // 7. Create Fees and Payments
    const fee1 = await Fee.create({
      student: student1._id,
      feeType: 'Tuition Fee',
      amount: 1000,
      dueDate: new Date(Date.now() + 86400000 * 10), // Future due
      academicYear: '2026-2027',
      status: 'PARTIAL',
      paidAmount: 400,
      remainingAmount: 600,
      description: 'Term 1 Tuition',
    });

    const fee2 = await Fee.create({
      student: student2._id,
      feeType: 'Activity Fee',
      amount: 300,
      dueDate: new Date(Date.now() - 86400000 * 5), // Past due -> Overdue
      academicYear: '2026-2027',
      status: 'OVERDUE',
      paidAmount: 0,
      remainingAmount: 300,
      description: 'Arts & Sports Supply Fee',
    });

    // Record real Payment
    await Payment.create({
      student: student1._id,
      fee: fee1._id,
      amount: 400,
      paymentMethod: 'Credit Card',
      paymentDate: new Date(),
      receivedBy: adminUser._id,
      notes: 'Initial installment',
    });

    // 8. Create Announcements & Events
    await Announcement.create({
      title: 'Spring Festival Parade Announcement',
      message: 'Join us next week for celebration!',
      targetRole: 'All',
      status: 'Published',
      priority: 'High',
      createdBy: adminUser._id,
      publishedAt: new Date(),
    });

    await Event.create({
      title: 'Annual Preschool Art Expo',
      description: 'Little artists exhibition of handcrafts',
      date: new Date(Date.now() + 86400000 * 3),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      location: 'Central Courtyard',
      category: 'Cultural',
      targetAudience: 'All',
      createdBy: adminUser._id,
    });

    // 9. Create Schedule for today's day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[today.getDay()];

    await Schedule.create({
      class: classNursery._id,
      dayOfWeek: currentDay,
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      activityName: 'Morning Circle & Phonics Play',
      activityType: 'Academic',
      room: 'Room 101',
    });

    // 10. Login
    const adminLogin = await request(port, { path: '/api/auth/login', method: 'POST' }, {
      email: 'admin@preschool.test', password: 'Password123!',
    });
    const adminToken = adminLogin.body?.data?.token || adminLogin.body?.token;

    const teacherLogin = await request(port, { path: '/api/auth/login', method: 'POST' }, {
      email: 'teacher@preschool.test', password: 'Password123!',
    });
    const teacherToken = teacherLogin.body?.data?.token || teacherLogin.body?.token;

    const parentLogin = await request(port, { path: '/api/auth/login', method: 'POST' }, {
      email: 'parent@preschool.test', password: 'Password123!',
    });
    const parentToken = parentLogin.body?.data?.token || parentLogin.body?.token;

    // --- TEST ADMIN DASHBOARD ---
    console.log('\n--- 1. Testing GET /api/dashboard/admin ---');
    const adminRes = await request(port, {
      path: '/api/dashboard/admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminRes.status === 200, 'GET /api/dashboard/admin returns 200');
    const ad = adminRes.body.data;
    assert(ad.counts.students === 3, 'Total Students is 3');
    assert(ad.counts.teachers === 1, 'Total Teachers is 1');
    assert(ad.counts.parents === 1, 'Total Parents is 1');
    assert(ad.attendanceToday.present === 1, 'Present Students count is 1');
    assert(ad.attendanceToday.absent === 1, 'Absent Students count is 1');
    assert(ad.attendanceToday.late === 1, 'Late Students count is 1');
    assert(ad.financials.pendingFees === 600, 'Pending fees calculated correctly (600)');
    assert(ad.financials.overdueFees === 300, 'Overdue fees calculated correctly (300)');
    assert(ad.financials.totalCollected === 400, 'Collected fees calculated correctly (400)');
    assert(ad.recentActivities.length > 0, 'Recent activities contains real MongoDB items');
    assert(ad.charts.attendanceOverview.length === 7, 'Attendance Overview chart provides 7 days');
    assert(ad.charts.studentEnrollment.length === 2, 'Student enrollment chart provides 2 classes');
    assert(ad.charts.feeCollection.totalExpected === 1300, 'Fee collection chart totalExpected is 1300');

    // --- TEST ADMIN CHARTS ENDPOINT ---
    console.log('\n--- 2. Testing GET /api/dashboard/admin/charts ---');
    const chartsRes = await request(port, {
      path: '/api/dashboard/admin/charts',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(chartsRes.status === 200, 'GET /api/dashboard/admin/charts returns 200');
    assert(chartsRes.body.data.attendanceOverview.length === 7, 'Charts endpoint returns attendanceOverview');
    assert(chartsRes.body.data.studentEnrollment.length === 2, 'Charts endpoint returns studentEnrollment');
    assert(chartsRes.body.data.feeCollection.totalCollected === 400, 'Charts endpoint returns feeCollection');

    // --- TEST TEACHER DASHBOARD ---
    console.log('\n--- 3. Testing GET /api/dashboard/teacher ---');
    const teacherRes = await request(port, {
      path: '/api/dashboard/teacher',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(teacherRes.status === 200, 'GET /api/dashboard/teacher returns 200');
    const td = teacherRes.body.data;
    assert(td.totalAssignedStudents === 2, 'Assigned Students for Teacher Sarah is 2');
    assert(td.todayAttendance.present === 1, 'Teacher today attendance present is 1');
    assert(td.todayAttendance.late === 1, 'Teacher today attendance late is 1');
    assert(td.todaySchedule.length === 1, 'Teacher has 1 schedule slot today');
    assert(td.announcements.length === 1, 'Teacher has 1 announcement');
    assert(td.upcomingEvents.length === 1, 'Teacher has 1 upcoming event');

    // --- TEST PARENT DASHBOARD ---
    console.log('\n--- 4. Testing GET /api/dashboard/parent ---');
    const parentRes = await request(port, {
      path: '/api/dashboard/parent',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    assert(parentRes.status === 200, 'GET /api/dashboard/parent returns 200');
    const pd = parentRes.body.data;
    assert(pd.children.length === 2, 'Parent has 2 children profiles');
    assert(pd.children[0].todayAttendance === 'Present', 'Child 1 today attendance is Present');
    assert(pd.children[1].todayAttendance === 'Late', 'Child 2 today attendance is Late');
    assert(pd.children[0].attendanceRate === 100, 'Child 1 attendance rate is 100%');
    assert(pd.pendingTotal === 900, 'Parent pending fee total is 900 (600 pending + 300 overdue)');
    assert(pd.schedule.length === 1, 'Parent child class has 1 schedule slot today');
    assert(pd.announcements.length === 1, 'Parent has 1 announcement');
    assert(pd.upcomingEvents.length === 1, 'Parent has 1 upcoming event');

    console.log('\n=== Dashboard System Test Suite Results ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
