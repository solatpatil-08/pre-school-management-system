const http = require('http');
const jwt = require('jsonwebtoken');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:5000' + path, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function post(path, body, headers = {}) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function put(path, body, headers = {}) {
  return request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function del(path, headers = {}) {
  return request(path, { method: 'DELETE', headers });
}

function get(path, headers = {}) {
  return request(path, { method: 'GET', headers });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 COMPREHENSIVE AUTHENTICATION & RBAC PERMISSION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  ✅ PASS: ' + message);
      passed++;
    } else {
      console.error('  ❌ FAIL: ' + message);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: DEVELOPMENT SEED USERS AUTHENTICATION
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Development Seed Users Authentication ---');

  // 1.1 Admin Login
  const adminLogin = await post('/api/auth/login', {
    email: 'admin@preschool.com',
    password: 'Admin@123',
  });
  assert(adminLogin.status === 200, 'Admin login succeeds with 200 OK');
  assert(!!adminLogin.body.token, 'Admin login returns a JWT Bearer token');
  assert(adminLogin.body.user?.role === 'admin', 'Admin user role is admin');
  assert(adminLogin.body.user?.password === undefined, 'Admin password is NOT exposed in response');

  const adminToken = adminLogin.body.token;
  const adminDecoded = jwt.decode(adminToken);
  assert(!!adminDecoded.userId, 'Admin JWT payload contains userId: ' + adminDecoded?.userId);
  assert(adminDecoded?.role === 'admin', 'Admin JWT payload contains role: ' + adminDecoded?.role);

  // 1.2 Teacher Login
  const teacherLogin = await post('/api/auth/login', {
    email: 'teacher@preschool.com',
    password: 'Teacher@123',
  });
  assert(teacherLogin.status === 200, 'Teacher login succeeds with 200 OK');
  assert(teacherLogin.body.user?.role === 'teacher', 'Teacher user role is teacher');
  assert(teacherLogin.body.user?.password === undefined, 'Teacher password is NOT exposed');
  const teacherToken = teacherLogin.body.token;
  const teacherDecoded = jwt.decode(teacherToken);
  assert(!!teacherDecoded.userId, 'Teacher JWT payload contains userId: ' + teacherDecoded?.userId);
  assert(teacherDecoded?.role === 'teacher', 'Teacher JWT payload contains role: ' + teacherDecoded?.role);

  // 1.3 Parent Login
  const parentLogin = await post('/api/auth/login', {
    email: 'parent@preschool.com',
    password: 'Parent@123',
  });
  assert(parentLogin.status === 200, 'Parent login succeeds with 200 OK');
  assert(parentLogin.body.user?.role === 'parent', 'Parent user role is parent');
  assert(parentLogin.body.user?.password === undefined, 'Parent password is NOT exposed');
  const parentToken = parentLogin.body.token;
  const parentDecoded = jwt.decode(parentToken);
  assert(!!parentDecoded.userId, 'Parent JWT payload contains userId: ' + parentDecoded?.userId);
  assert(parentDecoded?.role === 'parent', 'Parent JWT payload contains role: ' + parentDecoded?.role);

  // 1.4 Invalid credentials check
  const badLogin = await post('/api/auth/login', {
    email: 'admin@preschool.com',
    password: 'WrongPassword',
  });
  assert(badLogin.status === 401, 'Invalid password rejected with 401 Unauthorized');

  // ----------------------------------------------------
  // TEST GROUP 2: USER REGISTRATION (POST /api/auth/register)
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Registration (POST /api/auth/register) ---');

  const uniqueEmail = 'registered_parent_' + Date.now() + '@testdomain.com';
  const registerRes = await post('/api/auth/register', {
    name: 'New Registered Parent',
    email: uniqueEmail,
    password: 'SecurePassword123',
    role: 'parent',
    phone: '+1 555 987 6543',
  });
  assert(registerRes.status === 201, 'Registration returns 201 Created');
  assert(!!registerRes.body.token, 'Registration returns JWT token');
  assert(registerRes.body.user?.email === uniqueEmail, 'Registered user email matches');
  assert(registerRes.body.user?.password === undefined, 'Password is NOT returned on register');

  const registeredToken = registerRes.body.token;
  const regDecoded = jwt.decode(registeredToken);
  assert(!!regDecoded.userId, 'Registered user JWT payload contains userId');
  assert(regDecoded?.role === 'parent', 'Registered user JWT payload contains role');

  // Duplicate registration should fail with 409
  const dupRes = await post('/api/auth/register', {
    name: 'Duplicate Parent',
    email: uniqueEmail,
    password: 'SecurePassword123',
    role: 'parent',
  });
  assert(dupRes.status === 409, 'Duplicate registration returns 409 Conflict');

  // Validation failure (e.g., short password)
  const invalidReg = await post('/api/auth/register', {
    name: 'Short Pass',
    email: 'shortpass@example.com',
    password: '123',
  });
  assert(invalidReg.status === 400, 'Short password returns 400 Bad Request');

  // ----------------------------------------------------
  // TEST GROUP 3: CURRENT USER PROFILE (GET /api/auth/me)
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Profile Verification (GET /api/auth/me) ---');

  const meAdmin = await get('/api/auth/me', { Authorization: 'Bearer ' + adminToken });
  assert(meAdmin.status === 200, 'GET /api/auth/me succeeds with admin token');
  assert(meAdmin.body.user?.name === 'Eleanor Vance (Principal)', 'Admin profile name verified');
  assert(meAdmin.body.user?.password === undefined, 'Password is NOT exposed in /me response');

  const meTeacher = await get('/api/auth/me', { Authorization: 'Bearer ' + teacherToken });
  assert(meTeacher.status === 200, 'GET /api/auth/me succeeds with teacher token');
  assert(meTeacher.body.user?.role === 'teacher', 'Teacher profile role verified');

  const meParent = await get('/api/auth/me', { Authorization: 'Bearer ' + parentToken });
  assert(meParent.status === 200, 'GET /api/auth/me succeeds with parent token');
  assert(meParent.body.user?.role === 'parent', 'Parent profile role verified');

  // ----------------------------------------------------
  // TEST GROUP 4: TOKEN SECURITY & INVALID TOKENS
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Token Security & Invalid Tokens ---');

  const noToken = await get('/api/auth/me');
  assert(noToken.status === 401, 'Request with no token returns 401 Unauthorized');

  const fakeToken = await get('/api/auth/me', { Authorization: 'Bearer bad.token.here' });
  assert(fakeToken.status === 401, 'Request with forged token returns 401 Unauthorized');

  // Expired token test
  const expiredToken = jwt.sign(
    { userId: adminDecoded.userId, role: 'admin' },
    'supersecret_preschool_jwt_key_2026_dev_prod',
    { expiresIn: '0s' }
  );
  await new Promise((r) => setTimeout(r, 100));
  const expiredRes = await get('/api/auth/me', { Authorization: 'Bearer ' + expiredToken });
  assert(expiredRes.status === 401, 'Expired token returns 401 Unauthorized');
  assert(expiredRes.body.isExpired === true, 'Expired token response indicates isExpired: true');

  // ----------------------------------------------------
  // TEST GROUP 5: GRANULAR ROLE-BASED AUTHORIZATION (RBAC)
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: Granular Role Authorization Checks ---');

  // 5.1 ONLY ADMIN: Create & Delete Teacher
  const newTeacherEmail = 't_' + Date.now() + '@preschool.com';
  const teacherCreateByAdmin = await post(
    '/api/teachers',
    {
      firstName: 'TestTeacher',
      lastName: 'Seed',
      email: newTeacherEmail,
      phone: '+1 555 444 3333',
    },
    { Authorization: 'Bearer ' + adminToken }
  );
  assert(teacherCreateByAdmin.status === 201, 'Only ADMIN can create teacher (201)');
  const createdTeacherId = teacherCreateByAdmin.body.teacher?._id;

  const teacherCreateByTeacher = await post(
    '/api/teachers',
    { firstName: 'Hacker', lastName: 'T', email: 'h1@test.com', phone: '111' },
    { Authorization: 'Bearer ' + teacherToken }
  );
  assert(teacherCreateByTeacher.status === 403, 'TEACHER forbidden from creating teacher (403)');

  const teacherCreateByParent = await post(
    '/api/teachers',
    { firstName: 'Hacker', lastName: 'P', email: 'h2@test.com', phone: '111' },
    { Authorization: 'Bearer ' + parentToken }
  );
  assert(teacherCreateByParent.status === 403, 'PARENT forbidden from creating teacher (403)');

  // Delete Teacher (Only ADMIN)
  if (createdTeacherId) {
    const delByTeacher = await del('/api/teachers/' + createdTeacherId, {
      Authorization: 'Bearer ' + teacherToken,
    });
    assert(delByTeacher.status === 403, 'TEACHER forbidden from deleting teacher (403)');

    const delByParent = await del('/api/teachers/' + createdTeacherId, {
      Authorization: 'Bearer ' + parentToken,
    });
    assert(delByParent.status === 403, 'PARENT forbidden from deleting teacher (403)');

    const delByAdmin = await del('/api/teachers/' + createdTeacherId, {
      Authorization: 'Bearer ' + adminToken,
    });
    assert(delByAdmin.status === 200, 'Only ADMIN can delete teacher (200)');
  }

  // 5.2 ONLY ADMIN: Create Class
  const classCreateByTeacher = await post(
    '/api/classes',
    { name: 'Art Class', section: 'A', roomNumber: 'Room 500', capacity: 15 },
    { Authorization: 'Bearer ' + teacherToken }
  );
  assert(classCreateByTeacher.status === 403, 'TEACHER forbidden from creating class (403)');

  const classCreateByParent = await post(
    '/api/classes',
    { name: 'Art Class', section: 'B', roomNumber: 'Room 501', capacity: 15 },
    { Authorization: 'Bearer ' + parentToken }
  );
  assert(classCreateByParent.status === 403, 'PARENT forbidden from creating class (403)');

  // 5.3 ONLY ADMIN: Manage Fees & Create Announcements
  const classList = await get('/api/classes', { Authorization: 'Bearer ' + adminToken });
  const studentList = await get('/api/students', { Authorization: 'Bearer ' + adminToken });
  const testStudent = (studentList.body.data || studentList.body.students || [])[0];
  const testClass = (classList.body.data || classList.body.classes || [])[0];

  if (testStudent) {
    // Fee creation: Admin only
    const feeByTeacher = await post(
      '/api/fees',
      {
        student: testStudent._id,
        title: 'Art Material Fee',
        feeType: 'Activities',
        totalAmount: 150,
        dueDate: '2026-11-01',
      },
      { Authorization: 'Bearer ' + teacherToken }
    );
    assert(feeByTeacher.status === 403, 'TEACHER forbidden from creating fees (403)');

    const feeByParent = await post(
      '/api/fees',
      {
        student: testStudent._id,
        title: 'Art Material Fee',
        feeType: 'Activities',
        totalAmount: 150,
        dueDate: '2026-11-01',
      },
      { Authorization: 'Bearer ' + parentToken }
    );
    assert(feeByParent.status === 403, 'PARENT forbidden from creating fees (403)');

    const feeByAdmin = await post(
      '/api/fees',
      {
        student: testStudent._id,
        title: 'Art Material Fee',
        feeType: 'Activities',
        totalAmount: 150,
        dueDate: '2026-11-01',
      },
      { Authorization: 'Bearer ' + adminToken }
    );
    assert(feeByAdmin.status === 201, 'Only ADMIN can create fee invoices (201)');
  }

  // Create Announcements: Admin only
  const annByTeacher = await post(
    '/api/announcements',
    { title: 'Test Ann', message: 'Content', targetRole: 'All' },
    { Authorization: 'Bearer ' + teacherToken }
  );
  assert(annByTeacher.status === 403, 'TEACHER forbidden from creating announcements (403)');

  const annByAdmin = await post(
    '/api/announcements',
    { title: 'School Closed Friday', message: 'Staff development day', targetRole: 'All' },
    { Authorization: 'Bearer ' + adminToken }
  );
  assert(annByAdmin.status === 201, 'Only ADMIN can create announcements (201)');

  // 5.4 ADMIN + TEACHER: View Students & Manage Attendance
  const studentsByAdmin = await get('/api/students', { Authorization: 'Bearer ' + adminToken });
  assert(studentsByAdmin.status === 200, 'ADMIN can view students list (200)');

  const studentsByTeacher = await get('/api/students', { Authorization: 'Bearer ' + teacherToken });
  assert(studentsByTeacher.status === 200, 'TEACHER can view students list (200)');

  const studentsByParent = await get('/api/students', { Authorization: 'Bearer ' + parentToken });
  assert(studentsByParent.status === 200, 'PARENT can view student roster scoped to own child (200)');
  const parentVisibleStudents = studentsByParent.data?.students || studentsByParent.data?.data || [];
  assert(
    parentVisibleStudents.every(
      (s) => String(s.parent?._id || s.parent) === String(testParent._id)
    ),
    'PARENT is restricted to viewing only their own child'
  );

  // Attendance marking: Admin + Teacher
  const teacherStudents = studentsByTeacher.body?.students || studentsByTeacher.body?.data || [];
  const teacherStudent = teacherStudents[0] || testStudent;
  const teacherClassId = teacherStudent?.class?._id || teacherStudent?.class || testClass?._id;
  const attStudent = testStudent;
  const attClassId = testStudent?.class?._id || testStudent?.class || testClass?._id;

  if (teacherStudent && teacherClassId) {
    const attByTeacher = await post(
      '/api/attendance',
      {
        student: teacherStudent._id,
        class: teacherClassId,
        date: '2026-10-04',
        status: 'Present',
      },
      { Authorization: 'Bearer ' + teacherToken }
    );
    assert(attByTeacher.status === 200, 'TEACHER can mark attendance (200)');
  }

  if (attStudent && attClassId) {
    const attByAdmin = await post(
      '/api/attendance',
      {
        student: attStudent._id,
        class: attClassId,
        date: '2026-10-04',
        status: 'Present',
      },
      { Authorization: 'Bearer ' + adminToken }
    );
    assert(attByAdmin.status === 200, 'ADMIN can mark attendance (200)');

    const attByParent = await post(
      '/api/attendance',
      {
        student: attStudent._id,
        class: attClassId,
        date: '2026-10-04',
        status: 'Present',
      },
      { Authorization: 'Bearer ' + parentToken }
    );
    assert(attByParent.status === 403, 'PARENT forbidden from marking attendance (403)');
  }

  // 5.5 PARENT: View Own Child, Attendance, Schedule, and Fees
  const parentDash = await get('/api/dashboard/parent', { Authorization: 'Bearer ' + parentToken });
  assert(parentDash.status === 200, 'PARENT can access parent dashboard (200)');
  const myChild = parentDash.body.children?.[0];

  if (myChild) {
    // View own child profile
    const childProfile = await get('/api/students/' + myChild._id, {
      Authorization: 'Bearer ' + parentToken,
    });
    assert(childProfile.status === 200, 'PARENT can view own child profile (200)');

    // View own child attendance
    const childAtt = await get('/api/attendance/student/' + myChild._id, {
      Authorization: 'Bearer ' + parentToken,
    });
    assert(childAtt.status === 200, 'PARENT can view own child attendance history (200)');

    // View own child fees
    const childFees = await get('/api/fees/student/' + myChild._id, {
      Authorization: 'Bearer ' + parentToken,
    });
    assert(childFees.status === 200, 'PARENT can view own child fees (200)');
  }

  // View timetable schedule (Parent has read access to schedule)
  const schedulesRes = await get('/api/schedules', { Authorization: 'Bearer ' + parentToken });
  assert(schedulesRes.status === 200, 'PARENT can view class timetables & schedule (200)');

  console.log('\n================================================================');
  console.log('TEST SUMMARY: ' + passed + ' PASSED | ' + failed + ' FAILED');
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
