const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Parent = require('./src/models/Parent');
const Class = require('./src/models/Class');
const Fee = require('./src/models/Fee');
const Payment = require('./src/models/Payment');

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

function extractFee(res) {
  return res.body?.fee || res.body?.data?.fee || res.body?.data;
}

function extractFees(res) {
  return res.body?.fees || res.body?.data?.fees || res.body?.data || [];
}

function extractPayment(res) {
  return res.body?.payment || res.body?.data?.payment || res.body?.data;
}

function extractPayments(res) {
  return res.body?.payments || res.body?.data?.payments || res.body?.data || [];
}

function extractMetrics(res) {
  return res.body?.metrics || res.body?.data?.metrics || {};
}

async function runTests() {
  console.log('=== Starting Fee & Payment Management Module Tests ===');
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

    console.log(`Test server running on port ${port}`);

    // 1. Create Users (Admin & Parent)
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@preschool.test',
      password: 'Password123!',
      role: 'admin',
    });

    const parentUser1 = await User.create({
      name: 'Parent One',
      email: 'parent1@preschool.test',
      password: 'Password123!',
      role: 'parent',
    });

    const parentUser2 = await User.create({
      name: 'Parent Two',
      email: 'parent2@preschool.test',
      password: 'Password123!',
      role: 'parent',
    });

    // 2. Create Class & Students
    const testClass = await Class.create({
      name: 'Preschool Starters',
      section: 'A',
      roomNumber: 'Room 101',
      capacity: 20,
    });

    const student1 = await Student.create({
      firstName: 'Leo',
      lastName: 'Miller',
      dateOfBirth: new Date('2022-04-10'),
      gender: 'Male',
      class: testClass._id,
      studentId: 'STU-1001',
    });

    const student2 = await Student.create({
      firstName: 'Mia',
      lastName: 'Wong',
      dateOfBirth: new Date('2022-06-15'),
      gender: 'Female',
      class: testClass._id,
      studentId: 'STU-1002',
    });

    // Link parents to students
    await Parent.create({
      user: parentUser1._id,
      firstName: 'Parent',
      lastName: 'One',
      email: parentUser1.email,
      phone: '1234567890',
      children: [student1._id],
    });

    await Parent.create({
      user: parentUser2._id,
      firstName: 'Parent',
      lastName: 'Two',
      email: parentUser2.email,
      phone: '0987654321',
      children: [student2._id],
    });

    // 3. Login users to get JWT tokens
    const adminLoginRes = await request(port, {
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'admin@preschool.test',
      password: 'Password123!',
    });
    const adminToken = adminLoginRes.body?.data?.token || adminLoginRes.body?.token;
    assert(adminToken, 'Admin logged in and received token');

    const parentLoginRes = await request(port, {
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'parent1@preschool.test',
      password: 'Password123!',
    });
    const parentToken = parentLoginRes.body?.data?.token || parentLoginRes.body?.token;
    assert(parentToken, 'Parent 1 logged in and received token');

    const parent2LoginRes = await request(port, {
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'parent2@preschool.test',
      password: 'Password123!',
    });
    const parent2Token = parent2LoginRes.body?.data?.token || parent2LoginRes.body?.token;
    assert(parent2Token, 'Parent 2 logged in and received token');

    // 4. Test POST /api/fees (Admin)
    console.log('\n--- Testing POST /api/fees ---');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const createFeeRes = await request(port, {
      path: '/api/fees',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      student: student1._id.toString(),
      feeType: 'Tuition',
      amount: 1000,
      dueDate: futureDate.toISOString(),
      academicYear: '2026-2027',
      description: 'Term 1 Tuition fee',
    });

    assert(createFeeRes.status === 201, 'POST /api/fees responded with 201 Created');
    const createdFee = extractFee(createFeeRes);
    assert(createdFee?.amount === 1000, 'Fee amount is 1000');
    assert(createdFee?.paidAmount === 0, 'Fee initial paidAmount is 0');
    assert(createdFee?.remainingAmount === 1000, 'Fee automatically calculated remainingAmount as 1000');
    assert(createdFee?.status === 'PENDING', 'Fee automatically assigned status PENDING');

    // 5. Test Overdue calculation on creation
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const createOverdueFeeRes = await request(port, {
      path: '/api/fees',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      student: student2._id.toString(),
      feeType: 'Transport',
      amount: 400,
      dueDate: pastDate.toISOString(),
      academicYear: '2026-2027',
      description: 'Past overdue transport fee',
    });

    const overdueFee = extractFee(createOverdueFeeRes);
    assert(overdueFee?.status === 'OVERDUE', 'Past due date automatically set status to OVERDUE');
    assert(overdueFee?.remainingAmount === 400, 'Overdue fee remainingAmount is 400');

    // 6. Test GET /api/fees (Admin)
    console.log('\n--- Testing GET /api/fees (Admin) ---');
    const getFeesAdminRes = await request(port, {
      path: '/api/fees',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(getFeesAdminRes.status === 200, 'GET /api/fees returned 200 OK');
    const adminFeesList = extractFees(getFeesAdminRes);
    assert(adminFeesList.length >= 2, `Admin received ${adminFeesList.length} fees`);
    const metrics = extractMetrics(getFeesAdminRes);
    assert(metrics.totalBilled === 1400, 'Metrics totalBilled is 1400');
    assert(metrics.overdueCount === 1, 'Metrics overdueCount is 1');
    assert(metrics.pendingCount === 1, 'Metrics pendingCount is 1');

    // 7. Test Filters on GET /api/fees
    const filterOverdueRes = await request(port, {
      path: '/api/fees?overdue=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const overdueList = extractFees(filterOverdueRes);
    assert(overdueList.length === 1 && overdueList[0].status === 'OVERDUE', 'Filter overdue=true works');

    // 8. Test GET /api/fees (Parent Scoping)
    console.log('\n--- Testing GET /api/fees (Parent Scoping) ---');
    const getFeesParent1Res = await request(port, {
      path: '/api/fees',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` },
    });

    assert(getFeesParent1Res.status === 200, 'Parent 1 can call GET /api/fees');
    const parent1Fees = extractFees(getFeesParent1Res);
    assert(parent1Fees.length === 1, 'Parent 1 only sees their child (Leo)');
    assert(parent1Fees[0]._id === createdFee._id, 'Parent 1 sees fee belonging to their child');

    // 9. Test GET /api/fees/:id
    console.log('\n--- Testing GET /api/fees/:id ---');
    const getSingleFeeRes = await request(port, {
      path: `/api/fees/${createdFee._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getSingleFeeRes.status === 200, 'GET /api/fees/:id returned 200 OK');
    const fetchedSingleFee = extractFee(getSingleFeeRes);
    assert(fetchedSingleFee?._id === createdFee._id, 'Fee ID matches');

    // Parent 2 should NOT have access to Parent 1's child fee
    const unauthorizedFeeRes = await request(port, {
      path: `/api/fees/${createdFee._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parent2Token}` },
    });
    assert(unauthorizedFeeRes.status === 403, 'Parent 2 receives 403 Forbidden for Parent 1 child fee');

    // 10. Test PUT /api/fees/:id (Admin edit fee)
    console.log('\n--- Testing PUT /api/fees/:id ---');
    const updateFeeRes = await request(port, {
      path: `/api/fees/${createdFee._id}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      amount: 1200,
      description: 'Updated fee amount to 1200',
    });

    assert(updateFeeRes.status === 200, 'PUT /api/fees/:id returned 200 OK');
    const updatedFee = extractFee(updateFeeRes);
    assert(updatedFee.amount === 1200, 'Updated fee amount is 1200');
    assert(updatedFee.remainingAmount === 1200, 'Recalculated remainingAmount is 1200');

    // 11. Test POST /api/payments (Partial Payment)
    console.log('\n--- Testing POST /api/payments (Partial Payment) ---');
    const partialPaymentRes = await request(port, {
      path: '/api/payments',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      fee: createdFee._id,
      amount: 500,
      paymentMethod: 'Credit Card',
      notes: 'First installment of 500 paid',
    });

    assert(partialPaymentRes.status === 201, 'POST /api/payments returned 201 Created');
    const payment1 = extractPayment(partialPaymentRes);
    assert(payment1?.amount === 500, 'Recorded payment amount is 500');
    assert(payment1?.transactionId?.startsWith('TXN-'), 'Generated transactionId');
    assert(payment1?.receiptNumber?.startsWith('REC-'), 'Generated receiptNumber');

    // Check updated Fee
    const feeAfterPartial = await Fee.findById(createdFee._id);
    assert(feeAfterPartial.paidAmount === 500, 'Fee paidAmount is now 500');
    assert(feeAfterPartial.remainingAmount === 700, 'Fee remainingAmount automatically recalculated to 700');
    assert(feeAfterPartial.status === 'PARTIAL', 'Fee status automatically updated to PARTIAL');

    // 12. Test POST /api/payments (Remaining Full Payment / Settlement)
    console.log('\n--- Testing POST /api/payments (Full Payment / Settlement) ---');
    const finalPaymentRes = await request(port, {
      path: '/api/payments',
      method: 'POST',
      headers: { Authorization: `Bearer ${parentToken}` },
    }, {
      fee: createdFee._id,
      amount: 700,
      paymentMethod: 'UPI',
      notes: 'Cleared remaining balance',
    });

    assert(finalPaymentRes.status === 201, 'Parent settled fee with 201 Created');
    const feeAfterFinal = await Fee.findById(createdFee._id);
    assert(feeAfterFinal.paidAmount === 1200, 'Fee paidAmount is now 1200');
    assert(feeAfterFinal.remainingAmount === 0, 'Fee remainingAmount automatically calculated as 0');
    assert(feeAfterFinal.status === 'PAID', 'Fee status automatically updated to PAID');

    // 13. Test Overpayment rejection
    const overpaymentRes = await request(port, {
      path: '/api/payments',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      fee: createdFee._id,
      amount: 100,
      paymentMethod: 'Cash',
    });
    assert(overpaymentRes.status === 400, 'Overpayment rejected with 400 Bad Request');

    // 14. Test GET /api/payments
    console.log('\n--- Testing GET /api/payments ---');
    const getPaymentsAdminRes = await request(port, {
      path: '/api/payments',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(getPaymentsAdminRes.status === 200, 'GET /api/payments returned 200 OK');
    const paymentsList = extractPayments(getPaymentsAdminRes);
    assert(paymentsList.length === 2, `Admin received 2 recorded payments`);
    const paymentMetrics = extractMetrics(getPaymentsAdminRes);
    assert(paymentMetrics.totalAmountCollected === 1200, 'Metrics collected is 1200');

    // Parent 1 checking payments
    const getPaymentsParent1Res = await request(port, {
      path: '/api/payments',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    const parent1Payments = extractPayments(getPaymentsParent1Res);
    assert(parent1Payments.length === 2, 'Parent 1 sees payments for their child');

    // Parent 2 checking payments
    const getPaymentsParent2Res = await request(port, {
      path: '/api/payments',
      method: 'GET',
      headers: { Authorization: `Bearer ${parent2Token}` },
    });
    const parent2Payments = extractPayments(getPaymentsParent2Res);
    assert(parent2Payments.length === 0, 'Parent 2 sees 0 payments because their child has none');

    // 15. Test GET /api/payments/:id
    console.log('\n--- Testing GET /api/payments/:id ---');
    const singlePaymentRes = await request(port, {
      path: `/api/payments/${payment1._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(singlePaymentRes.status === 200, 'GET /api/payments/:id returned 200 OK');
    const fetchedSinglePayment = extractPayment(singlePaymentRes);
    assert(fetchedSinglePayment?.receiptNumber === payment1.receiptNumber, 'Receipt number matches');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }

  console.log(`\n=== Tests Complete ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runTests();
