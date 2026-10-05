const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return {
    status: res.status,
    ok: res.ok,
    data,
  };
}

async function runTeacherTests() {
  console.log('=== STARTING TEACHER / STAFF MODULE VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin and Teacher
    console.log('--- 1. Authenticating Roles ---');
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@preschool.com', password: 'Admin@123' },
    });
    const adminToken = adminLogin.data?.token || adminLogin.data?.data?.token;
    assert(adminToken, 'Admin logged in successfully');

    const teacherLogin = await req('/auth/login', {
      method: 'POST',
      body: { email: 'teacher@preschool.com', password: 'Teacher@123' },
    });
    const teacherToken = teacherLogin.data?.token || teacherLogin.data?.data?.token;
    assert(teacherToken, 'Teacher logged in successfully');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };

    // Fetch classes for assignment testing
    const classesRes = await req('/classes', { headers: adminHeaders });
    const classes = classesRes.data.classes || classesRes.data.data || [];
    assert(classes.length > 0, `Fetched ${classes.length} classes for assignment`);
    const testClass1 = classes[0];
    const testClass2 = classes[1] || classes[0];

    // 2. Admin: GET /api/teachers pagination
    console.log('\n--- 2. Pagination Testing ---');
    const page1Res = await req('/teachers?page=1&limit=2', { headers: adminHeaders });
    const teachersP1 = page1Res.data.teachers || page1Res.data.data || [];
    assert(teachersP1.length <= 2, `Pagination limit 2 returned ${teachersP1.length} teachers`);
    assert(page1Res.data.currentPage === 1 || page1Res.data.page === 1, 'Current page reported as 1');
    assert(page1Res.data.totalPages >= 1, `Total pages calculated (${page1Res.data.totalPages})`);

    // 3. Admin: Search Testing
    console.log('\n--- 3. Search Testing ---');
    // Search teacher by name
    const searchNameRes = await req('/teachers?search=Sarah', { headers: adminHeaders });
    const nameMatches = searchNameRes.data.teachers || searchNameRes.data.data || [];
    assert(
      nameMatches.some((t) => t.firstName.includes('Sarah') || t.lastName.includes('Jenkins')),
      'Search by teacher name (Sarah) matched successfully'
    );

    // Search teacher by ID
    const sampleTeacher = teachersP1[0];
    const sampleId = sampleTeacher.teacherId || sampleTeacher.employeeId;
    const searchIdRes = await req(`/teachers?search=${sampleId}`, { headers: adminHeaders });
    const idMatches = searchIdRes.data.teachers || searchIdRes.data.data || [];
    assert(
      idMatches.some((t) => (t.teacherId || t.employeeId) === sampleId),
      `Search by teacher ID (${sampleId}) matched successfully`
    );

    // Search by designation or qualification
    const searchDesigRes = await req('/teachers?search=Education', { headers: adminHeaders });
    const desigMatches = searchDesigRes.data.teachers || searchDesigRes.data.data || [];
    assert(desigMatches.length > 0, 'Search by qualification keyword matched');

    // 4. Admin: Filter Testing
    console.log('\n--- 4. Filtering Testing ---');
    const statusFilterRes = await req('/teachers?status=Active', { headers: adminHeaders });
    const activeTeachers = statusFilterRes.data.teachers || statusFilterRes.data.data || [];
    assert(
      activeTeachers.length > 0 && activeTeachers.every((t) => t.status === 'Active'),
      'Status filter (Active) returned only active educators'
    );

    const genderFilterRes = await req('/teachers?gender=Female', { headers: adminHeaders });
    const femaleTeachers = genderFilterRes.data.teachers || genderFilterRes.data.data || [];
    assert(
      femaleTeachers.length > 0 && femaleTeachers.every((t) => t.gender === 'Female'),
      'Gender filter (Female) returned only female educators'
    );

    // 5. Validation Testing
    console.log('\n--- 5. Validation Testing ---');
    const invalidRes = await req('/teachers', {
      method: 'POST',
      headers: adminHeaders,
      body: { firstName: '', email: 'notanemail' },
    });
    assert(invalidRes.status === 400, `Rejection with 400 Bad Request on invalid payload (status: ${invalidRes.status})`);
    assert(invalidRes.data?.errors?.length > 0 || invalidRes.data?.message, 'Validation error details returned');

    // 6. Admin: Create Teacher (POST /api/teachers)
    console.log('\n--- 6. Teacher Creation & Full CRUD ---');
    const uniqueEmail = `clara.barton.${Date.now()}@preschool.com`;
    const newTeacherPayload = {
      teacherId: `TCH-${Date.now().toString().slice(-4)}`,
      firstName: 'Clara',
      lastName: 'Barton',
      email: uniqueEmail,
      phone: '+1 (555) 999-4444',
      dateOfBirth: '1992-06-15',
      gender: 'Female',
      qualification: 'M.Ed in Early Childhood Education',
      joiningDate: '2026-08-01',
      designation: 'Lead Montessori Educator',
      assignedClasses: [testClass1._id],
      address: '240 Horizon Way, Sunnyvale, CA',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      status: 'Active',
    };

    const createRes = await req('/teachers', {
      method: 'POST',
      headers: adminHeaders,
      body: newTeacherPayload,
    });
    const createdTeacher = createRes.data?.teacher || createRes.data?.data;
    assert(createRes.status === 201, 'Teacher created with HTTP 201 Created');
    assert(createdTeacher?.firstName === 'Clara', 'Created teacher firstName matches');
    assert(createdTeacher?.designation === 'Lead Montessori Educator', 'Created teacher designation matches');
    assert(createdTeacher?.assignedClasses?.length > 0, 'Created teacher has assigned class');

    // 7. Admin: GET /api/teachers/:id
    console.log('\n--- 7. Single Teacher Retrieval ---');
    const getByIdRes = await req(`/teachers/${createdTeacher._id}`, { headers: adminHeaders });
    const fetchedTeacher = getByIdRes.data?.teacher || getByIdRes.data?.data;
    assert(fetchedTeacher?._id === createdTeacher._id, 'GET /api/teachers/:id returned correct teacher');
    assert(fetchedTeacher?.email === uniqueEmail, 'Teacher email matches');
    assert(fetchedTeacher?.user !== null, 'Teacher linked user account populated');

    // 8. Admin: PUT /api/teachers/:id
    console.log('\n--- 8. Teacher Update ---');
    const updateRes = await req(`/teachers/${createdTeacher._id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        designation: 'Senior Montessori Coordinator',
        phone: '+1 (555) 999-5555',
        status: 'Active',
      },
    });
    const updatedTeacher = updateRes.data?.teacher || updateRes.data?.data;
    assert(updatedTeacher?.designation === 'Senior Montessori Coordinator', 'PUT updated designation');
    assert(updatedTeacher?.phone === '+1 (555) 999-5555', 'PUT updated phone');

    // 9. Teacher Role Authorization & Scoping
    console.log('\n--- 9. Role-Based Scoping & Security Testing ---');

    // Teacher can view own profile via /me
    const teacherMeRes = await req('/teachers/me', { headers: teacherHeaders });
    assert(teacherMeRes.status === 200, 'Teacher can access own profile via GET /api/teachers/me (200)');
    const myTeacherProfile = teacherMeRes.data?.teacher || teacherMeRes.data?.data;
    assert(myTeacherProfile?.email === 'teacher@preschool.com', 'Teacher profile matches authenticated account');

    // Teacher can view own record via /api/teachers/:id
    const teacherOwnIdRes = await req(`/teachers/${myTeacherProfile._id}`, { headers: teacherHeaders });
    assert(teacherOwnIdRes.status === 200, 'Teacher can view own record via GET /api/teachers/:ownId (200)');

    // Teacher CANNOT view another teacher's profile
    const teacherOtherRes = await req(`/teachers/${createdTeacher._id}`, { headers: teacherHeaders });
    assert(teacherOtherRes.status === 403, `Teacher viewing other teacher forbidden (HTTP 403: ${teacherOtherRes.data?.message})`);

    // Teacher CANNOT create teacher
    const teacherCreateRes = await req('/teachers', {
      method: 'POST',
      headers: teacherHeaders,
      body: newTeacherPayload,
    });
    assert(teacherCreateRes.status === 403, 'Teacher creation forbidden for Teacher role (HTTP 403)');

    // Teacher CANNOT update teacher
    const teacherUpdateRes = await req(`/teachers/${createdTeacher._id}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: { designation: 'Director' },
    });
    assert(teacherUpdateRes.status === 403, 'Teacher update forbidden for Teacher role (HTTP 403)');

    // Teacher CANNOT delete teacher
    const teacherDeleteRes = await req(`/teachers/${createdTeacher._id}`, {
      method: 'DELETE',
      headers: teacherHeaders,
    });
    assert(teacherDeleteRes.status === 403, 'Teacher delete forbidden for Teacher role (HTTP 403)');

    // 10. Admin: DELETE /api/teachers/:id
    console.log('\n--- 10. Delete Testing ---');
    const deleteRes = await req(`/teachers/${createdTeacher._id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(deleteRes.status === 200, 'Teacher deleted by Admin (HTTP 200)');

    const verifyDeleteRes = await req(`/teachers/${createdTeacher._id}`, { headers: adminHeaders });
    assert(verifyDeleteRes.status === 404, 'Deleted teacher properly returns 404 Not Found');

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected test error:', error);
    process.exit(1);
  }
}

runTeacherTests();
