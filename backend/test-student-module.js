const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
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

async function runTests() {
  console.log('=== STARTING STUDENT MODULE VERIFICATION TESTS ===\n');
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
    // 1. Authenticate users
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

    const parentLogin = await req('/auth/login', {
      method: 'POST',
      body: { email: 'parent@preschool.com', password: 'Parent@123' },
    });
    const parentToken = parentLogin.data?.token || parentLogin.data?.data?.token;
    assert(parentToken, 'Parent logged in successfully');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };
    const parentHeaders = { Authorization: `Bearer ${parentToken}` };

    // 2. Fetch classes and parents for reference
    const classesRes = await req('/classes', { headers: adminHeaders });
    const classes = classesRes.data.classes || classesRes.data.data;
    assert(classes && classes.length > 0, `Fetched ${classes.length} classes`);
    const testClass = classes[0];

    const parentsRes = await req('/parents', { headers: adminHeaders });
    const parents = parentsRes.data.parents || parentsRes.data.data;
    assert(parents && parents.length > 0, `Fetched ${parents.length} parents`);
    const testParent = parents[0];

    // 3. Admin: GET /api/students pagination
    console.log('\n--- 2. Pagination Testing ---');
    const page1Res = await req('/students?page=1&limit=2', { headers: adminHeaders });
    const page1Data = page1Res.data;
    const studentsP1 = page1Data.students || page1Data.data;
    assert(studentsP1.length === 2, `Pagination limit 2 returned 2 students (got ${studentsP1.length})`);
    assert(page1Data.currentPage === 1 || page1Data.page === 1, 'Current page reported as 1');
    assert(page1Data.totalPages > 1 || page1Data.pages > 1, `Total pages calculated correctly (${page1Data.totalPages})`);

    // 4. Admin: Search Testing
    console.log('\n--- 3. Search Testing ---');
    // Search student name
    const searchNameRes = await req('/students?search=Leo', { headers: adminHeaders });
    const nameMatches = searchNameRes.data.students || searchNameRes.data.data;
    assert(
      nameMatches.some((s) => s.firstName.toLowerCase().includes('leo') || s.lastName.toLowerCase().includes('leo')),
      'Search by student name (Leo) matched successfully'
    );

    // Search student ID
    const sampleStudent = studentsP1[0];
    const searchIdRes = await req(`/students?search=${sampleStudent.studentId}`, { headers: adminHeaders });
    const idMatches = searchIdRes.data.students || searchIdRes.data.data;
    assert(idMatches.some((s) => s.studentId === sampleStudent.studentId), `Search by student ID (${sampleStudent.studentId}) matched`);

    // Search parent name
    const searchParentRes = await req('/students?search=John', { headers: adminHeaders });
    const parentMatches = searchParentRes.data.students || searchParentRes.data.data;
    assert(
      parentMatches.length > 0 && parentMatches.some((s) => s.parent?.firstName === 'John' || s.parent?.lastName === 'Doe'),
      'Search by parent name (John) matched linked student(s)'
    );

    // 5. Admin: Filtering Testing
    console.log('\n--- 4. Filtering Testing ---');
    // Class filter
    const classFilterRes = await req(`/students?classId=${testClass._id}`, { headers: adminHeaders });
    const classStudents = classFilterRes.data.students || classFilterRes.data.data;
    assert(
      classStudents.every((s) => String(s.class._id || s.class) === String(testClass._id)),
      `Class filter returned only students in class ${testClass.name}`
    );

    // Gender filter
    const genderFilterRes = await req('/students?gender=Female', { headers: adminHeaders });
    const femaleStudents = genderFilterRes.data.students || genderFilterRes.data.data;
    assert(
      femaleStudents.length > 0 && femaleStudents.every((s) => s.gender === 'Female'),
      'Gender filter (Female) returned only female students'
    );

    // Status filter
    const statusFilterRes = await req('/students?status=Active', { headers: adminHeaders });
    const activeStudents = statusFilterRes.data.students || statusFilterRes.data.data;
    assert(
      activeStudents.length > 0 && activeStudents.every((s) => s.status === 'Active'),
      'Status filter (Active) returned only active students'
    );

    // 6. Admin: Sorting Testing
    console.log('\n--- 5. Sorting Testing ---');
    const sortAscRes = await req('/students?sortBy=firstName&sortOrder=asc', { headers: adminHeaders });
    const ascStudents = sortAscRes.data.students || sortAscRes.data.data;
    const names = ascStudents.map((s) => s.firstName.toLowerCase());
    const isSorted = names.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(isSorted, `Sorting by firstName asc verified (${names.slice(0, 3).join(', ')})`);

    // 7. Validation Testing (POST /api/students)
    console.log('\n--- 6. Validation Testing ---');
    const invalidRes = await req('/students', {
      method: 'POST',
      headers: adminHeaders,
      body: { firstName: '' },
    });
    assert(invalidRes.status === 400, `Rejection with 400 Bad Request on missing fields (status: ${invalidRes.status})`);
    assert(invalidRes.data?.errors?.length > 0 || invalidRes.data?.message, 'Validation error details returned');

    // 8. Admin: Create Student (POST /api/students)
    console.log('\n--- 7. Student Creation & Full CRUD ---');
    const newStudentPayload = {
      studentId: `SKA-TEST-${Date.now().toString().slice(-4)}`,
      firstName: 'Benjamin',
      lastName: 'Franklin',
      dateOfBirth: '2022-05-15',
      gender: 'Male',
      admissionDate: '2026-09-01',
      class: testClass._id,
      parent: testParent._id,
      phone: '+1 (555) 777-8888',
      email: 'benjamin.test@example.com',
      address: '100 Constitution Way, Sunnyvale, CA',
      emergencyContact: {
        name: 'Martha Franklin',
        phone: '+1 (555) 777-9999',
        relationship: 'Aunt',
      },
      medicalNotes: 'No allergies or special dietary needs',
      allergies: 'None',
      bloodGroup: 'O+',
      profilePhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'Active',
    };

    const createRes = await req('/students', {
      method: 'POST',
      headers: adminHeaders,
      body: newStudentPayload,
    });
    const createdStudent = createRes.data?.student || createRes.data?.data;
    assert(createRes.status === 201, 'Student created with HTTP 201');
    assert(createdStudent?.firstName === 'Benjamin', 'Created student firstName matches');
    assert(createdStudent?.email === 'benjamin.test@example.com', 'Created student email matches');
    assert(createdStudent?.phone === '+1 (555) 777-8888', 'Created student phone matches');

    // 9. Admin: GET /api/students/:id
    const getByIdRes = await req(`/students/${createdStudent._id}`, { headers: adminHeaders });
    const fetchedStudent = getByIdRes.data?.student || getByIdRes.data?.data;
    assert(fetchedStudent?._id === createdStudent._id, 'GET /api/students/:id retrieved correct student');
    assert(fetchedStudent?.class?.name === testClass.name, 'Retrieved student class populated');

    // 10. Admin: PUT /api/students/:id
    const updateRes = await req(`/students/${createdStudent._id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        firstName: 'Benjamin Updated',
        medicalNotes: 'Slight seasonal pollen allergy',
        allergies: 'Pollen',
      },
    });
    const updatedStudent = updateRes.data?.student || updateRes.data?.data;
    assert(updatedStudent?.firstName === 'Benjamin Updated', 'PUT /api/students/:id updated firstName');
    assert(updatedStudent?.allergies === 'Pollen', 'PUT /api/students/:id updated allergies');

    // 11. Role-Based Scoping & Security Testing
    console.log('\n--- 8. Role-Based Scoping & Security Testing ---');

    // Teacher Scoping
    const teacherStudentsRes = await req('/students', { headers: teacherHeaders });
    const teacherStudents = teacherStudentsRes.data.students || teacherStudentsRes.data.data;
    assert(
      teacherStudents.length > 0,
      `Teacher can view assigned students (${teacherStudents.length} students retrieved)`
    );

    // Teacher cannot create student
    const teacherCreateRes = await req('/students', {
      method: 'POST',
      headers: teacherHeaders,
      body: newStudentPayload,
    });
    assert(teacherCreateRes.status === 403, `Teacher creation forbidden (HTTP 403, message: ${teacherCreateRes.data?.message})`);

    // Teacher cannot update student
    const teacherUpdateRes = await req(`/students/${createdStudent._id}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: { firstName: 'Hacked' },
    });
    assert(teacherUpdateRes.status === 403, `Teacher update forbidden (HTTP 403)`);

    // Teacher cannot delete student
    const teacherDeleteRes = await req(`/students/${createdStudent._id}`, {
      method: 'DELETE',
      headers: teacherHeaders,
    });
    assert(teacherDeleteRes.status === 403, `Teacher delete forbidden (HTTP 403)`);

    // Parent Scoping
    const parentStudentsRes = await req('/students', { headers: parentHeaders });
    const parentStudents = parentStudentsRes.data?.students || parentStudentsRes.data?.data;
    assert(
      parentStudents && parentStudents.length > 0,
      `Parent can view their child roster (${parentStudents?.length} child/children)`
    );

    // Parent can view their own child's detail
    const ownChildId = parentStudents[0]._id;
    const parentGetOwnRes = await req(`/students/${ownChildId}`, { headers: parentHeaders });
    assert(parentGetOwnRes.status === 200, `Parent can view own child record`);

    // Parent CANNOT view another child's detail
    const parentGetOtherRes = await req(`/students/${createdStudent._id}`, { headers: parentHeaders });
    assert(parentGetOtherRes.status === 403, `Parent access to another child forbidden (HTTP 403: ${parentGetOtherRes.data?.message})`);

    // Parent cannot create, edit, or delete
    const parentCreateRes = await req('/students', {
      method: 'POST',
      headers: parentHeaders,
      body: newStudentPayload,
    });
    assert(parentCreateRes.status === 403, `Parent create forbidden (HTTP 403)`);

    // 12. Admin: DELETE /api/students/:id
    console.log('\n--- 9. Delete Testing ---');
    const deleteRes = await req(`/students/${createdStudent._id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(deleteRes.status === 200, 'Student deleted by Admin (HTTP 200)');

    // Verify deletion
    const verifyDeleteRes = await req(`/students/${createdStudent._id}`, { headers: adminHeaders });
    assert(verifyDeleteRes.status === 404, 'Deleted student properly returns 404 Not Found');

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

runTests();
