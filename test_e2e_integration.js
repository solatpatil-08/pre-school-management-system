const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING END-TO-END PRE-SCHOOL SYSTEM INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Helper fetch with JSON
  async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  try {
    // ----------------------------------------------------
    // TEST 1: AUTHENTICATION FOR ALL 3 ROLES
    // ----------------------------------------------------
    console.log('1. Testing Role Authentication & Password Verification:');

    // Admin Login
    const adminLogin = await apiCall('/auth/login', 'POST', {
      email: 'admin@preschool.demo',
      password: 'Admin@123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.data?.token, 'Admin login succeeded with correct JWT token');
    assert(adminLogin.data.data?.user?.role === 'admin', 'Admin user role is admin');
    const adminToken = adminLogin.data.data?.token;

    // Teacher Login
    const teacherLogin = await apiCall('/auth/login', 'POST', {
      email: 'sneha.teacher@preschool.demo',
      password: 'Teacher@123'
    });
    assert(teacherLogin.status === 200 && teacherLogin.data.data?.token, 'Teacher login succeeded with correct JWT token');
    assert(teacherLogin.data.data?.user?.role === 'teacher', 'Teacher user role is teacher');
    const teacherToken = teacherLogin.data.data?.token;

    // Parent Login
    const parentLogin = await apiCall('/auth/login', 'POST', {
      email: 'rahul.parent@preschool.demo',
      password: 'Parent@123'
    });
    assert(parentLogin.status === 200 && parentLogin.data.data?.token, 'Parent login succeeded with correct JWT token');
    assert(parentLogin.data.data?.user?.role === 'parent', 'Parent user role is parent');
    const parentToken = parentLogin.data.data?.token;

    // ----------------------------------------------------
    // TEST 2: DASHBOARDS & DYNAMIC PROFILES
    // ----------------------------------------------------
    console.log('\n2. Testing Dynamic Dashboard Stats & Profile Data:');

    // Admin Dashboard
    const adminDash = await apiCall('/dashboard/admin', 'GET', null, adminToken);
    assert(adminDash.status === 200 && adminDash.data.data?.counts?.students > 0, `Admin dashboard loaded (Students: ${adminDash.data.data?.counts?.students}, Teachers: ${adminDash.data.data?.counts?.teachers})`);

    // Teacher Dashboard
    const teacherDash = await apiCall('/dashboard/teacher', 'GET', null, teacherToken);
    assert(teacherDash.status === 200 && teacherDash.data.data?.teacher?.name, `Teacher dashboard dynamic profile name: "${teacherDash.data.data?.teacher?.name}"`);
    assert(teacherDash.data.data?.attendanceToday !== undefined, 'Teacher dashboard includes attendance breakdown (present, absent, late)');

    // Parent Dashboard
    const parentDash = await apiCall('/dashboard/parent', 'GET', null, parentToken);
    assert(parentDash.status === 200 && parentDash.data.data?.parent?.name, `Parent dashboard dynamic profile name: "${parentDash.data.data?.parent?.name}"`);
    assert(Array.isArray(parentDash.data.data?.children) && parentDash.data.data.children.length > 0, `Parent child record found: "${parentDash.data.data?.children[0]?.name}"`);
    assert(parentDash.data.data?.children[0]?.presentDays !== undefined, `Parent child attendance statistics verified (Present: ${parentDash.data.data?.children[0]?.presentDays}, Rate: ${parentDash.data.data?.children[0]?.attendanceRate}%)`);

    // ----------------------------------------------------
    // TEST 3: STUDENT ENROLLMENT WITH DEDICATED PARENT & ITEMIZED FEES
    // ----------------------------------------------------
    console.log('\n3. Testing Student Enrollment with Dedicated Parent & Itemized Fees:');

    // Fetch classes to get valid class ID
    const classesRes = await apiCall('/classes', 'GET', null, adminToken);
    const targetClass = classesRes.data.data?.classes?.[0] || classesRes.data.data?.[0];
    assert(targetClass && targetClass._id, `Found target class: ${targetClass?.name}`);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newStudentPayload = {
      firstName: 'Kabir',
      lastName: `Deshmukh${randomSuffix}`,
      dateOfBirth: '2021-04-10',
      gender: 'Male',
      bloodGroup: 'O+',
      class: targetClass._id,
      address: {
        street: 'Flat 402, Rohan Viti, Baner Road',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411045'
      },
      // DEDICATED PARENT INFO (NO DROPDOWN)
      fatherInfo: {
        name: `Ramesh Deshmukh ${randomSuffix}`,
        phone: `98220${randomSuffix}`,
        email: `ramesh.deshmukh${randomSuffix}@gmail.com`,
        occupation: 'IT Architect',
        address: 'Flat 402, Rohan Viti, Baner Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045'
      },
      motherInfo: {
        name: `Pooja Deshmukh ${randomSuffix}`,
        phone: `98221${randomSuffix}`,
        email: `pooja.deshmukh${randomSuffix}@gmail.com`,
        occupation: 'Graphic Designer'
      },
      // ITEMIZED FEES MANAGEMENT
      feeInfo: {
        annualFees: 30000,
        admissionFees: 5000,
        tuitionFees: 15000,
        otherFees: 2000,
        totalPayableFees: 52000,
        amountPaid: 20000,
        paymentMode: 'UPI',
        paymentStatus: 'Partially Paid',
        receiptNumber: `REC-E2E-${randomSuffix}`,
        transactionId: `UPI-TEST-${randomSuffix}`,
        nextPaymentDueDate: '2026-12-15',
        remarks: 'Admission confirmed with initial installment'
      }
    };

    const createStudentRes = await apiCall('/students', 'POST', newStudentPayload, adminToken);
    assert(createStudentRes.status === 201, `Student created successfully (Status 201)`);
    const createdStudent = createStudentRes.data.data;
    assert(createdStudent?._id, `Created student ID: ${createdStudent?._id}`);
    assert(createdStudent?.parent, `Parent automatically associated with student ID: ${createdStudent?.parent}`);

    // Verify parent user account was automatically provisioned
    const parentAuthTest = await apiCall('/auth/login', 'POST', {
      email: newStudentPayload.fatherInfo.email,
      password: `Parent@${newStudentPayload.fatherInfo.phone.slice(-4)}`
    });
    assert(parentAuthTest.status === 200, `Newly registered parent can log in with generated credentials`);

    // Verify fee record exists and math is correct: Pending = Total Payable - Amount Paid
    const studentFeesRes = await apiCall(`/fees/student/${createdStudent._id}`, 'GET', null, adminToken);
    const createdFee = studentFeesRes.data.data?.[0];
    assert(createdFee !== undefined, 'Fee record automatically created for enrolled student');
    assert(createdFee?.totalAmount === 52000, `Total payable fees is ₹52,000`);
    assert(createdFee?.paidAmount === 20000, `Amount paid is ₹20,000`);
    const expectedPending = 52000 - 20000;
    const actualPending = createdFee?.remainingAmount;
    assert(actualPending === expectedPending, `Pending amount automatically calculated: ₹${actualPending} (Expected ₹${expectedPending})`);
    assert(createdFee?.status === 'PARTIAL' || createdFee?.status === 'PARTIALLY_PAID', `Fee status is PARTIAL / PARTIALLY_PAID`);

    // ----------------------------------------------------
    // TEST 4: TIMETABLE CONFLICT PREVENTION (MON-SAT)
    // ----------------------------------------------------
    console.log('\n4. Testing Timetable Mon-Sat Scheduling & Conflict Prevention:');

    // Fetch teachers
    const teachersRes = await apiCall('/teachers', 'GET', null, adminToken);
    const teachersList = teachersRes.data.data?.teachers || teachersRes.data.data?.data || teachersRes.data.data || [];
    const targetTeacher = teachersList[0];
    assert(targetTeacher && targetTeacher._id, `Found teacher for timetable test: ${targetTeacher?.name || targetTeacher?.user?.name || targetTeacher?.firstName}`);

    // Clean up any test slots from previous runs
    const existingSchedRes = await apiCall(`/schedules?day=Wednesday`, 'GET', null, adminToken);
    const existingSlots = existingSchedRes.data.data?.schedules || existingSchedRes.data.data || [];
    for (const s of existingSlots) {
      if (s.subject === 'Story Craft' || s.startTime === '13:00') {
        await apiCall(`/schedules/${s._id}`, 'DELETE', null, adminToken);
      }
    }

    // Create schedule slot in an unassigned afternoon block
    const uniqueRoom = `Room-${randomSuffix}`;
    const slot1 = {
      class: targetClass._id,
      day: 'Wednesday',
      startTime: '13:00',
      endTime: '13:45',
      subject: 'Story Craft',
      teacher: targetTeacher._id,
      classroom: uniqueRoom,
      academicYear: '2026-2027'
    };

    const slot1Res = await apiCall('/schedules', 'POST', slot1, adminToken);
    assert(slot1Res.status === 201, `Timetable slot created successfully for Wednesday 13:00-13:45`);
    const slot1Id = slot1Res.data.data?._id;

    // Test Teacher Conflict: same teacher, overlapping time (13:15 - 14:00) on Wednesday
    const conflictTeacher = {
      class: targetClass._id,
      day: 'Wednesday',
      startTime: '13:15',
      endTime: '14:00',
      subject: 'Clay Modeling',
      teacher: targetTeacher._id,
      classroom: `DifferentRoom-${randomSuffix}`,
      academicYear: '2026-2027'
    };
    const conflictTeacherRes = await apiCall('/schedules', 'POST', conflictTeacher, adminToken);
    assert(conflictTeacherRes.status === 409, `Teacher conflict detected and rejected with HTTP 409 Conflict`);
    assert(conflictTeacherRes.data.message?.toLowerCase().includes('conflict'), `Clear validation message returned: "${conflictTeacherRes.data.message}"`);

    // Test Classroom Conflict: same classroom, overlapping time (13:30 - 14:15) on Wednesday
    const otherTeacher = teachersList[1] || targetTeacher;
    const conflictRoom = {
      class: targetClass._id,
      day: 'Wednesday',
      startTime: '13:30',
      endTime: '14:15',
      subject: 'Drawing',
      teacher: otherTeacher._id,
      classroom: uniqueRoom, // Same room
      academicYear: '2026-2027'
    };
    const conflictRoomRes = await apiCall('/schedules', 'POST', conflictRoom, adminToken);
    assert(conflictRoomRes.status === 409, `Classroom conflict detected and rejected with HTTP 409 Conflict`);
    assert(conflictRoomRes.data.message?.toLowerCase().includes('conflict'), `Clear validation message returned: "${conflictRoomRes.data.message}"`);

    // Clean up any existing Saturday test slots
    const existingSatSchedRes = await apiCall(`/schedules?day=Saturday`, 'GET', null, adminToken);
    const existingSatSlots = existingSatSchedRes.data.data?.schedules || existingSatSchedRes.data.data || [];
    for (const s of existingSatSlots) {
      if (s.subject === 'Sports & Yoga' || s.startTime === '12:30' || s.startTime === '13:30') {
        await apiCall(`/schedules/${s._id}`, 'DELETE', null, adminToken);
      }
    }

    // Test Saturday schedule support
    const saturdaySlot = {
      class: targetClass._id,
      day: 'Saturday',
      startTime: '12:30',
      endTime: '13:15',
      subject: 'Sports & Yoga',
      teacher: targetTeacher._id,
      classroom: `Playground-${randomSuffix}`,
      academicYear: '2026-2027'
    };
    const satRes = await apiCall('/schedules', 'POST', saturdaySlot, adminToken);
    assert(satRes.status === 201, `Saturday timetable slot created successfully (Saturday supported)`);

    // Clean up created schedule test slots
    if (slot1Id) await apiCall(`/schedules/${slot1Id}`, 'DELETE', null, adminToken);
    if (satRes.data.data?._id) await apiCall(`/schedules/${satRes.data.data._id}`, 'DELETE', null, adminToken);

    // ----------------------------------------------------
    // TEST 5: CLASS ATTENDANCE (CLASS + DIVISION, NO DUPLICATES)
    // ----------------------------------------------------
    console.log('\n5. Testing Daily Class Attendance & Duplicate Prevention:');

    const testDate = '2026-10-15';
    const attendancePayload1 = {
      classId: targetClass._id,
      date: testDate,
      attendanceData: [
        {
          studentId: createdStudent._id,
          status: 'Present',
          remarks: 'On time'
        }
      ]
    };

    const markAttRes1 = await apiCall('/attendance/bulk', 'POST', attendancePayload1, adminToken);
    assert(markAttRes1.status === 200 || markAttRes1.status === 201, `Attendance marked successfully for date ${testDate}`);

    // Update Attendance (Same student, same class, same date -> change status to 'Late')
    const attendancePayload2 = {
      classId: targetClass._id,
      date: testDate,
      attendanceData: [
        {
          studentId: createdStudent._id,
          status: 'Late',
          remarks: 'Traffic delay'
        }
      ]
    };

    const markAttRes2 = await apiCall('/attendance/bulk', 'POST', attendancePayload2, adminToken);
    assert(markAttRes2.status === 200 || markAttRes2.status === 201, `Attendance updated successfully without creating duplicate`);

    // Fetch attendance for that student and date to verify only 1 record exists with status 'Late'
    const studentAttQuery = await apiCall(`/attendance/student/${createdStudent._id}`, 'GET', null, adminToken);
    const recordsForDate = (studentAttQuery.data.data?.attendance || studentAttQuery.data.data?.records || []).filter(a => a.dateString === testDate);
    assert(recordsForDate.length === 1, `Verified exactly 1 attendance record exists for the date (No duplicates created)`);
    assert(recordsForDate[0]?.status === 'Late' || recordsForDate[0]?.status === 'LATE', `Attendance status updated properly to "Late"`);

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
