const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');
const User = require('./src/models/User');
const Announcement = require('./src/models/Announcement');
const Event = require('./src/models/Event');

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

function extractData(res, key) {
  return res.body?.[key] || res.body?.data?.[key] || res.body?.data || [];
}

async function runTests() {
  console.log('=== Starting Announcements & Events Module Tests ===');
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
      name: 'Admin User',
      email: 'admin@preschool.test',
      password: 'Password123!',
      role: 'admin',
    });

    const teacherUser = await User.create({
      name: 'Teacher Sarah',
      email: 'teacher@preschool.test',
      password: 'Password123!',
      role: 'teacher',
    });

    const parentUser = await User.create({
      name: 'Parent John',
      email: 'parent@preschool.test',
      password: 'Password123!',
      role: 'parent',
    });

    // 2. Login users
    const adminLoginRes = await request(port, { path: '/api/auth/login', method: 'POST' }, {
      email: 'admin@preschool.test', password: 'Password123!',
    });
    const adminToken = adminLoginRes.body?.data?.token || adminLoginRes.body?.token;

    const teacherLoginRes = await request(port, { path: '/api/auth/login', method: 'POST' }, {
      email: 'teacher@preschool.test', password: 'Password123!',
    });
    const teacherToken = teacherLoginRes.body?.data?.token || teacherLoginRes.body?.token;

    const parentLoginRes = await request(port, { path: '/api/auth/login', method: 'POST' }, {
      email: 'parent@preschool.test', password: 'Password123!',
    });
    const parentToken = parentLoginRes.body?.data?.token || parentLoginRes.body?.token;

    // 3. Admin creates Published announcement
    console.log('\n--- 1. Admin creates Published Announcement ---');
    const pubRes = await request(port, {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Spring Festival Announcement',
      message: 'Join us for fun games and activities.',
      targetRole: 'All',
      status: 'Published',
    });
    assert(pubRes.status === 201, 'POST /api/announcements returns 201');
    const pubAnn = extractData(pubRes, 'announcement');
    assert(pubAnn.status === 'Published', 'Announcement status is Published');
    assert(pubAnn.publishedAt !== null, 'publishedAt is automatically set');

    // 4. Admin creates Draft announcement
    console.log('\n--- 2. Admin creates Draft Announcement ---');
    const draftRes = await request(port, {
      path: '/api/announcements',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Secret Staff Meeting (Draft)',
      message: 'Draft agenda for next month.',
      targetRole: 'Teacher',
      status: 'Draft',
    });
    assert(draftRes.status === 201, 'Draft announcement created');
    const draftAnn = extractData(draftRes, 'announcement');
    assert(draftAnn.status === 'Draft', 'Status is Draft');
    assert(!draftAnn.publishedAt, 'Draft publishedAt is null');

    // 5. Role-based visibility check on Announcements
    console.log('\n--- 3. Role-Based Visibility for Announcements ---');
    // Admin sees both Published and Draft
    const adminGetRes = await request(port, {
      path: '/api/announcements',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAnns = extractData(adminGetRes, 'announcements');
    assert(adminAnns.length === 2, 'Admin sees all 2 announcements (Draft + Published)');

    // Teacher only sees Published
    const teacherGetRes = await request(port, {
      path: '/api/announcements',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherAnns = extractData(teacherGetRes, 'announcements');
    assert(teacherAnns.length === 1, 'Teacher only sees 1 announcement (Published)');
    assert(teacherAnns[0].title === 'Spring Festival Announcement', 'Teacher sees Spring Festival');

    // Parent only sees Published All
    const parentGetRes = await request(port, {
      path: '/api/announcements',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    const parentAnns = extractData(parentGetRes, 'announcements');
    assert(parentAnns.length === 1, 'Parent only sees 1 announcement (Published)');

    // 6. Admin Publishes Draft Announcement
    console.log('\n--- 4. Admin publishes Draft Announcement ---');
    const publishRes = await request(port, {
      path: `/api/announcements/${draftAnn._id}/publish`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(publishRes.status === 200, 'PATCH /api/announcements/:id/publish returns 200');
    const nowPubAnn = extractData(publishRes, 'announcement');
    assert(nowPubAnn.status === 'Published', 'Status transitioned to Published');
    assert(nowPubAnn.publishedAt !== null, 'publishedAt timestamp is set');

    // Teacher now sees it because targetRole is Teacher
    const teacherAfterPublishRes = await request(port, {
      path: '/api/announcements',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherAfterAnns = extractData(teacherAfterPublishRes, 'announcements');
    assert(teacherAfterAnns.length === 2, 'Teacher now sees 2 announcements');

    // Parent still sees only 1 because draftAnn has targetRole: 'Teacher'
    const parentAfterPublishRes = await request(port, {
      path: '/api/announcements',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    const parentAfterAnns = extractData(parentAfterPublishRes, 'announcements');
    assert(parentAfterAnns.length === 1, 'Parent still sees only 1 announcement (role isolation)');

    // 7. Admin updates Announcement
    console.log('\n--- 5. Admin edits Announcement ---');
    const editAnnRes = await request(port, {
      path: `/api/announcements/${pubAnn._id}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Spring Festival 2027 (Updated)',
    });
    assert(editAnnRes.status === 200, 'PUT /api/announcements/:id returns 200');
    const updatedAnn = extractData(editAnnRes, 'announcement');
    assert(updatedAnn.title === 'Spring Festival 2027 (Updated)', 'Title updated successfully');

    // 8. Admin deletes Announcement
    console.log('\n--- 6. Admin deletes Announcement ---');
    const delAnnRes = await request(port, {
      path: `/api/announcements/${pubAnn._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delAnnRes.status === 200, 'DELETE /api/announcements/:id returns 200');

    // 9. Events: Admin creates Event
    console.log('\n--- 7. Events: Admin creates Event ---');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const createEvRes = await request(port, {
      path: '/api/events',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Annual Sports Day',
      description: 'Exciting outdoor games and relay race for pre-schoolers.',
      date: futureDate.toISOString(),
      startTime: '09:00 AM',
      endTime: '12:30 PM',
      location: 'School Playground',
      targetAudience: 'All',
      category: 'Sports',
    });
    assert(createEvRes.status === 201, 'POST /api/events returns 201');
    const createdEvent = extractData(createEvRes, 'event');
    assert(createdEvent.title === 'Annual Sports Day', 'Event title is Annual Sports Day');
    assert(createdEvent.date !== undefined, 'Event date is set');
    assert(createdEvent.eventDate !== undefined, 'Event eventDate alias works');

    // 10. Teacher-targeted Event
    const teacherEvRes = await request(port, {
      path: '/api/events',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Staff Teacher Training',
      description: 'Early childhood pedagogy workshop.',
      date: futureDate.toISOString(),
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      location: 'Conference Room',
      targetAudience: 'Teacher',
      category: 'Workshop',
    });
    const teacherEvent = extractData(teacherEvRes, 'event');

    // 11. Role-based visibility for Events
    console.log('\n--- 8. Role-Based Visibility for Events ---');
    const teacherEventsRes = await request(port, {
      path: '/api/events',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherEvents = extractData(teacherEventsRes, 'events');
    assert(teacherEvents.length === 2, 'Teacher sees both All and Teacher events');

    const parentEventsRes = await request(port, {
      path: '/api/events',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    const parentEvents = extractData(parentEventsRes, 'events');
    assert(parentEvents.length === 1, 'Parent only sees All events (1)');
    assert(parentEvents[0]._id === createdEvent._id, 'Parent sees Annual Sports Day');

    // 12. Admin edits Event
    console.log('\n--- 9. Admin edits Event ---');
    const editEvRes = await request(port, {
      path: `/api/events/${createdEvent._id}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      location: 'Grand Athletics Stadium',
    });
    assert(editEvRes.status === 200, 'PUT /api/events/:id returns 200');
    const updatedEv = extractData(editEvRes, 'event');
    assert(updatedEv.location === 'Grand Athletics Stadium', 'Location updated');

    // 13. Admin deletes Event
    console.log('\n--- 10. Admin deletes Event ---');
    const delEvRes = await request(port, {
      path: `/api/events/${teacherEvent._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delEvRes.status === 200, 'DELETE /api/events/:id returns 200');

  } catch (err) {
    console.error('Test error:', err);
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
