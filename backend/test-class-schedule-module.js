const http = require('http');

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

function extractToken(res) {
  return res.body?.token || res.body?.data?.token;
}

function extractClasses(res) {
  return res.body?.data?.classes || res.body?.classes || [];
}

function extractTeachers(res) {
  return res.body?.data?.teachers || res.body?.teachers || [];
}

function extractSchedules(res) {
  return res.body?.data?.schedules || res.body?.schedules || [];
}

async function runTests() {
  console.log('--- Starting Class & Schedule Management Integration Tests ---');
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

  // 1. Authenticate users
  console.log('\n1. Authenticating Admin, Teacher, and Parent...');
  const adminRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@preschool.com', password: 'Admin@123' }
  );
  const adminToken = extractToken(adminRes);
  assert(adminRes.status === 200 && adminToken, 'Admin login succeeded');

  const teacherRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'teacher@preschool.com', password: 'Teacher@123' }
  );
  const teacherToken = extractToken(teacherRes);
  assert(teacherRes.status === 200 && teacherToken, 'Teacher login succeeded');

  const parentRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'parent@preschool.com', password: 'Parent@123' }
  );
  const parentToken = extractToken(parentRes);
  assert(parentRes.status === 200 && parentToken, 'Parent login succeeded');

  // 2. Fetch existing classes and teachers
  console.log('\n2. Fetching pre-seeded classes and teachers...');
  const classesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/classes',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const existingClasses = extractClasses(classesRes);
  assert(classesRes.status === 200 && existingClasses.length > 0, `Fetched ${existingClasses.length} classes`);
  const targetClass1 = existingClasses[0];
  const targetClass2 = existingClasses[1] || existingClasses[0];

  const teachersRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/teachers',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const existingTeachers = extractTeachers(teachersRes);
  assert(teachersRes.status === 200 && existingTeachers.length > 0, `Fetched ${existingTeachers.length} teachers`);
  const teacher1 = existingTeachers[0];
  const teacher2 = existingTeachers[1] || existingTeachers[0];

  // 3. CLASS MODULE CRUD
  console.log('\n3. Testing Class Module CRUD...');
  let createdClassId = null;

  // 3a. Create new class with requested fields: className, section, academicYear, classTeacher, room, capacity, status
  const createClassRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/classes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      className: 'Kinder Explorers Lab',
      section: 'B',
      academicYear: '2026-2027',
      classTeacher: teacher1._id,
      room: 'Room 205',
      capacity: 18,
      status: 'Active',
    }
  );
  assert(createClassRes.status === 201, 'POST /api/classes created class successfully');
  const clsData = createClassRes.body.data?.class || createClassRes.body.class;
  if (clsData) {
    createdClassId = clsData._id;
    assert(clsData.className === 'Kinder Explorers Lab', 'Class has correct className');
    assert(clsData.section === 'B', 'Class has correct section');
    assert(clsData.academicYear === '2026-2027', 'Class has correct academicYear');
    assert(clsData.room === 'Room 205' || clsData.roomNumber === 'Room 205', 'Class has correct room');
    assert(clsData.capacity === 18, 'Class has correct capacity');
    assert(clsData.status === 'Active', 'Class has correct status');
  }

  // 3b. Duplicate class check
  const dupClassRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/classes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      className: 'Kinder Explorers Lab',
      section: 'B',
      academicYear: '2026-2027',
      room: 'Room 206',
      capacity: 20,
    }
  );
  assert(dupClassRes.status === 409, 'Duplicate class creation rejected with 409 Conflict');

  // 3c. GET /api/classes/:id
  const getClassRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/classes/${createdClassId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(getClassRes.status === 200, 'GET /api/classes/:id retrieved class details');
  const retrievedCls = getClassRes.body.data?.class || getClassRes.body.class;
  assert(Array.isArray(retrievedCls?.students), 'Class contains students array');

  // 3d. PUT /api/classes/:id
  const updateClassRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/classes/${createdClassId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      room: 'Room 210',
      capacity: 22,
      status: 'Active',
    }
  );
  assert(updateClassRes.status === 200, 'PUT /api/classes/:id updated successfully');
  const updatedCls = updateClassRes.body.data?.class || updateClassRes.body.class;
  assert(updatedCls?.capacity === 22, 'Updated capacity is 22');

  // 3e. Teacher and Parent read access to classes
  const teacherClassesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/classes',
    method: 'GET',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert(teacherClassesRes.status === 200, 'Teacher can view /api/classes');

  const parentClassesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/classes',
    method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(parentClassesRes.status === 200, 'Parent can view /api/classes');

  // 3f. Non-admin forbidden to mutate class
  const teacherPostClass = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/classes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
    },
    { className: 'Unauthorized Class', room: '100', capacity: 10 }
  );
  assert(teacherPostClass.status === 403, 'Teacher forbidden from POST /api/classes (403)');

  // 4. SCHEDULE MODULE CRUD & CONFLICTS
  console.log('\n4. Testing Schedule Module CRUD & Conflict Prevention...');
  let createdScheduleId = null;

  // 4a. POST /api/schedules
  const createSchedRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      class: createdClassId,
      teacher: teacher1._id,
      activity: 'Creative Arts & Finger Painting',
      day: 'Monday',
      startTime: '13:00',
      endTime: '13:45',
      room: 'Art Studio B',
      academicYear: '2026-2027',
    }
  );
  assert(createSchedRes.status === 201, 'POST /api/schedules created slot successfully');
  const schedData = createSchedRes.body.data?.schedule || createSchedRes.body.schedule;
  if (schedData) {
    createdScheduleId = schedData._id;
    assert(
      schedData.activity === 'Creative Arts & Finger Painting' || schedData.activityName === 'Creative Arts & Finger Painting',
      'Schedule has correct activity'
    );
    assert(schedData.day === 'Monday' || schedData.dayOfWeek === 'Monday', 'Schedule has correct day');
    assert(schedData.startTime === '13:00' && schedData.endTime === '13:45', 'Schedule has correct times');
    assert(schedData.room === 'Art Studio B', 'Schedule has correct room');
  }

  // 4b. GET /api/schedules/:id
  const getSchedRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/schedules/${createdScheduleId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(getSchedRes.status === 200, 'GET /api/schedules/:id retrieved slot successfully');

  // 4c. Conflict 1: Class overlap conflict
  // Attempting to schedule same class on Monday at 13:15 - 14:00 (overlaps with 13:00 - 13:45)
  const classConflictRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      class: createdClassId,
      teacher: teacher2._id,
      activity: 'Music & Rhythm',
      day: 'Monday',
      startTime: '13:15',
      endTime: '14:00',
      room: 'Music Room A',
      academicYear: '2026-2027',
    }
  );
  assert(
    classConflictRes.status === 409,
    `Class conflict correctly prevented with 409: "${classConflictRes.body.message}"`
  );

  // 4d. Conflict 2: Teacher overlap conflict
  // Attempting to schedule teacher1 in a different class on Monday at 13:30 - 14:15
  const teacherConflictRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      class: targetClass1._id,
      teacher: teacher1._id,
      activity: 'Storytime Reading',
      day: 'Monday',
      startTime: '13:30',
      endTime: '14:15',
      room: 'Library',
      academicYear: '2026-2027',
    }
  );
  assert(
    teacherConflictRes.status === 409,
    `Teacher conflict correctly prevented with 409: "${teacherConflictRes.body.message}"`
  );

  // 4e. Conflict 3: Room overlap conflict
  // Attempting to book 'Art Studio B' for a different class on Monday at 13:15 - 14:00
  const roomConflictRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      class: targetClass2._id,
      teacher: teacher2._id,
      activity: 'Clay Modeling',
      day: 'Monday',
      startTime: '13:15',
      endTime: '14:00',
      room: 'Art Studio B',
      academicYear: '2026-2027',
    }
  );
  assert(
    roomConflictRes.status === 409,
    `Room conflict correctly prevented with 409: "${roomConflictRes.body.message}"`
  );

  // 4f. Invalid time range check: endTime <= startTime
  const badTimeRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      class: createdClassId,
      teacher: teacher1._id,
      activity: 'Recess',
      day: 'Tuesday',
      startTime: '11:00',
      endTime: '10:30',
      room: 'Playground',
    }
  );
  assert(badTimeRes.status === 400, 'Invalid time range rejected with 400 Bad Request');

  // 4g. Adjacent time slots (No conflict)
  // Monday 13:45 - 14:30 right after 13:00 - 13:45
  const nonConflictRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      class: createdClassId,
      teacher: teacher1._id,
      activity: 'Outdoor Sensory Play',
      day: 'Monday',
      startTime: '13:45',
      endTime: '14:30',
      room: 'Outdoor Playground',
      academicYear: '2026-2027',
    }
  );
  assert(nonConflictRes.status === 201, 'Adjacent non-overlapping slot allowed (201 Created)');
  const nonConflictSlot = nonConflictRes.body.data?.schedule || nonConflictRes.body.schedule;
  const nonConflictSlotId = nonConflictSlot?._id;

  // 4h. PUT /api/schedules/:id
  const updateSchedRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/schedules/${createdScheduleId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      activity: 'Advanced Arts & Crafts Workshop',
      room: 'Art Studio B',
    }
  );
  assert(updateSchedRes.status === 200, 'PUT /api/schedules/:id updated slot successfully');
  const updatedSched = updateSchedRes.body.data?.schedule || updateSchedRes.body.schedule;
  assert(
    updatedSched?.activity === 'Advanced Arts & Crafts Workshop' || updatedSched?.activityName === 'Advanced Arts & Crafts Workshop',
    'Updated activity title confirmed'
  );

  // 4i. Role-based schedule visibility
  console.log('\n5. Testing Role-based Schedule Scoping...');
  const teacherSchedsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/schedules',
    method: 'GET',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert(teacherSchedsRes.status === 200, 'Teacher can GET /api/schedules');
  const teacherSchedules = extractSchedules(teacherSchedsRes);
  assert(Array.isArray(teacherSchedules), `Teacher receives list of schedules (${teacherSchedules.length})`);

  const parentSchedsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/schedules',
    method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(parentSchedsRes.status === 200, 'Parent can GET /api/schedules');
  const parentSchedules = extractSchedules(parentSchedsRes);
  assert(Array.isArray(parentSchedules), `Parent receives list of child class schedules (${parentSchedules.length})`);

  // Teacher cannot mutate schedules
  const teacherPostSched = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
    },
    {
      class: createdClassId,
      activity: 'Unauthorized Activity',
      day: 'Friday',
      startTime: '10:00',
      endTime: '11:00',
    }
  );
  assert(teacherPostSched.status === 403, 'Teacher forbidden from POST /api/schedules (403)');

  // 4j. DELETE /api/schedules/:id
  console.log('\n6. Testing DELETE /api/schedules/:id and clean up...');
  const deleteSched1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/schedules/${createdScheduleId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(deleteSched1.status === 200, 'DELETE /api/schedules/:id deleted slot 1');

  if (nonConflictSlotId) {
    await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/schedules/${nonConflictSlotId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // 4k. DELETE /api/classes/:id
  const deleteClassRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/classes/${createdClassId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(deleteClassRes.status === 200, 'DELETE /api/classes/:id deleted class successfully');

  console.log(`\n========================================`);
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
