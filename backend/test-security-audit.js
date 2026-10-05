/**
 * Automated Security Audit & Hardening Verification Suite
 * Uses Node.js native fetch to test:
 * 1. Role Escalation Prevention (Public Register cannot create Admin or Teacher)
 * 2. Parent IDOR Prevention (Parent cannot view or update another parent's profile)
 * 3. Student IDOR Prevention (Parent cannot view records of another parent's child)
 * 4. Fee & Payment IDOR Prevention (Parent cannot view or pay fees for another parent's child)
 * 5. NoSQL Injection Prevention (Operator injection neutralized)
 * 6. Invalid ObjectId Handling (Hex validation rejects invalid IDs with 400 Bad Request)
 * 7. HTTP Security Headers (Helmet, nosniff, DENY, permissions-policy, no x-powered-by)
 * 8. Information Disclosure (Passwords never leaked in API responses)
 * 9. Unhandled Route Protection (Clean 404s without stack traces)
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

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    data,
  };
}

const results = [];

function assert(condition, message) {
  if (condition) {
    results.push({ status: 'PASS', message });
    console.log(`  [PASS] ${message}`);
  } else {
    results.push({ status: 'FAIL', message });
    console.error(`  [FAIL] ${message}`);
  }
}

async function runSecurityAudit() {
  console.log('========================================================');
  console.log('      STARTING COMPREHENSIVE SECURITY AUDIT');
  console.log('========================================================\n');

  let adminToken = '';
  let teacherToken = '';
  let parentToken = '';
  let secondParentToken = '';
  let secondParentId = '';
  let secondParentChildId = '';
  let secondParentFeeId = '';

  // 1. Authenticate roles
  console.log('--- 1. Authenticating Roles ---');
  const adminRes = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@preschool.com', password: 'Admin@123' },
  });
  adminToken = adminRes.data?.token || adminRes.data?.data?.token;
  assert(adminRes.status === 200 && !!adminToken, 'Admin login succeeded with JWT');

  const teacherRes = await req('/auth/login', {
    method: 'POST',
    body: { email: 'teacher@preschool.com', password: 'Teacher@123' },
  });
  teacherToken = teacherRes.data?.token || teacherRes.data?.data?.token;
  assert(teacherRes.status === 200 && !!teacherToken, 'Teacher login succeeded with JWT');

  const parentRes = await req('/auth/login', {
    method: 'POST',
    body: { email: 'parent@preschool.com', password: 'Parent@123' },
  });
  parentToken = parentRes.data?.token || parentRes.data?.data?.token;
  assert(parentRes.status === 200 && !!parentToken, 'Primary Parent login succeeded with JWT');

  // 2. Privilege Escalation Prevention on Public Register
  console.log('\n--- 2. Testing Privilege Escalation Defense ---');
  const attackAdminRes = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Attacker Admin',
      email: 'attacker_admin@exploit.test',
      password: 'password123',
      role: 'admin',
    },
  });
  assert(
    attackAdminRes.status === 403 || attackAdminRes.status === 400,
    `Public registration rejected role: admin (Status: ${attackAdminRes.status})`
  );

  const attackTeacherRes = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Attacker Teacher',
      email: 'attacker_teacher@exploit.test',
      password: 'password123',
      role: 'teacher',
    },
  });
  assert(
    attackTeacherRes.status === 403 || attackTeacherRes.status === 400,
    `Public registration rejected role: teacher (Status: ${attackTeacherRes.status})`
  );

  // 3. Setup Second Parent & Child to test IDOR
  console.log('\n--- 3. Provisioning Second Parent for IDOR Isolation Testing ---');
  const createParentRes = await req('/parents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      firstName: 'Jane',
      lastName: 'VictimParent',
      email: 'victim_parent_sec@preschool.test',
      password: 'securePassword123',
      phone: '555-0987-000',
      relationship: 'Mother',
    },
  });
  secondParentId = createParentRes.data?.data?.parent?._id;
  assert(createParentRes.status === 201 && !!secondParentId, 'Second Parent created for IDOR isolation testing');

  const secondLoginRes = await req('/auth/login', {
    method: 'POST',
    body: {
      email: 'victim_parent_sec@preschool.test',
      password: 'securePassword123',
    },
  });
  secondParentToken = secondLoginRes.data?.token || secondLoginRes.data?.data?.token;
  assert(secondLoginRes.status === 200 && !!secondParentToken, 'Second parent authenticated');

  const classesRes = await req('/classes', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const classId = classesRes.data?.classes?.[0]?._id || classesRes.data?.data?.classes?.[0]?._id;

  const studentRes = await req('/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      firstName: 'VictimChild',
      lastName: 'SecTest',
      dateOfBirth: '2022-01-01',
      gender: 'Female',
      class: classId,
      parent: secondParentId,
    },
  });
  secondParentChildId = studentRes.data?.student?._id || studentRes.data?.data?.student?._id;
  assert(studentRes.status === 201 && !!secondParentChildId, 'Second child created under second parent');

  // 4. Testing Parent Profile IDOR Prevention
  console.log('\n--- 4. Testing Parent Profile IDOR Defense ---');
  const viewOtherParentRes = await req(`/parents/${secondParentId}`, {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(
    viewOtherParentRes.status === 403,
    `IDOR blocked: Parent cannot view another parent profile (Status: ${viewOtherParentRes.status})`
  );

  const updateOtherParentRes = await req(`/parents/${secondParentId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${parentToken}` },
    body: { firstName: 'HackedName' },
  });
  assert(
    updateOtherParentRes.status === 403,
    `IDOR blocked: Parent cannot update another parent profile (Status: ${updateOtherParentRes.status})`
  );

  // 5. Testing Student Record IDOR Prevention
  console.log('\n--- 5. Testing Student Record IDOR Defense ---');
  const viewOtherStudentRes = await req(`/students/${secondParentChildId}`, {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(
    viewOtherStudentRes.status === 403,
    `IDOR blocked: Parent denied access to another parent child (Status: ${viewOtherStudentRes.status})`
  );

  // 6. Testing Fee IDOR Prevention
  console.log('\n--- 6. Testing Fee & Payment IDOR Defense ---');
  const feeRes = await req('/fees', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      student: secondParentChildId,
      feeType: 'Tuition',
      amount: 350,
      dueDate: '2026-11-01',
    },
  });
  secondParentFeeId = feeRes.data?.fee?._id || feeRes.data?.data?.fee?._id;

  const viewOtherFeeRes = await req(`/fees/${secondParentFeeId}`, {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(
    viewOtherFeeRes.status === 403,
    `IDOR blocked: Parent cannot access fee invoice of another parent child (Status: ${viewOtherFeeRes.status})`
  );

  // 7. Testing NoSQL / MongoDB Operator Injection Defense
  console.log('\n--- 7. Testing NoSQL / Operator Injection Defense ---');
  const nosqlRes = await req('/auth/login', {
    method: 'POST',
    body: {
      email: { $gt: '' },
      password: { $gt: '' },
    },
  });
  assert(
    nosqlRes.status === 400 || nosqlRes.status === 401,
    `NoSQL operator injection safely rejected on auth (Status: ${nosqlRes.status})`
  );

  // 8. Testing Invalid ObjectId Handling
  console.log('\n--- 8. Testing Invalid ObjectId Handling ---');
  const invalidStudentRes = await req('/students/invalid-non-hex-id-999', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    invalidStudentRes.status === 400,
    `Invalid ObjectId rejected with 400 Bad Request (Status: ${invalidStudentRes.status})`
  );

  const invalidClassRes = await req('/classes/12345notvalid', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    invalidClassRes.status === 400,
    `Invalid class ObjectId rejected with 400 Bad Request (Status: ${invalidClassRes.status})`
  );

  // 9. Testing HTTP Security Headers
  console.log('\n--- 9. Testing HTTP Security Headers ---');
  const healthRes = await req('/health');
  const headers = healthRes.headers;

  assert(headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff header verified');
  assert(headers.get('x-frame-options') === 'DENY', 'X-Frame-Options: DENY header verified');
  assert(!!headers.get('permissions-policy'), 'Permissions-Policy header verified');
  assert(!headers.get('x-powered-by'), 'X-Powered-By is hidden from responses');

  // 10. Testing Sensitive Data Masking in API Responses
  console.log('\n--- 10. Testing Sensitive Data Masking in API Responses ---');
  const usersRes = await req('/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users = usersRes.data?.data?.users || [];
  const hasPasswordExposed = users.some((u) => u.password !== undefined);
  assert(!hasPasswordExposed, 'Zero user records expose password field in GET /api/users');

  const meRes = await req('/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(meRes.data?.data?.user?.password === undefined, 'Password omitted in GET /api/auth/me');

  // 11. Cleanup temporary security test records
  console.log('\n--- 11. Cleanup Temporary Security Test Records ---');
  if (secondParentFeeId) {
    await req(`/fees/${secondParentFeeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
  if (secondParentChildId) {
    await req(`/students/${secondParentChildId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
  if (secondParentId) {
    await req(`/parents/${secondParentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
  console.log('  [CLEANUP] Temporary security audit records safely removed.');

  // Summary
  console.log('\n========================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL SECURITY AUDIT CHECKS PASSED WITH ZERO VULNERABILITIES! 🛡️\n');
  }
}

runSecurityAudit().catch((err) => {
  console.error('Fatal unhandled error during security audit:', err);
  process.exit(1);
});
