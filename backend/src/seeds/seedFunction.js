const User = require('../models/User');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Setting = require('../models/Setting');

const runSeed = async () => {
  try {
    // Idempotency check: Never drop DB and never delete existing data automatically.
    // If seed users already exist, development data is already initialized.
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Development data ready');
      return true;
    }

    console.log('[Seed] Database is unpopulated. Seeding initial development data...');

    // 1. Create Default School Settings
    await Setting.create({
      schoolName: 'Sunshine Kids Academy & Pre-School',
      schoolEmail: 'contact@sunshinekids.edu',
      schoolPhone: '+1 (555) 345-6789',
      schoolAddress: '742 Evergreen Terrace, Sunnyvale, CA 94086',
      academicYear: '2026-2027',
      currentTerm: 'Fall Term',
      currency: 'USD ($)',
      admissionPrefix: 'SKA-',
      systemNotifications: true,
    });

    // 2. Create Development Seed Users
    // NOTE: THESE ARE DEVELOPMENT CREDENTIALS FOR TESTING & DEMO ENVIRONMENT
    const adminUser = await User.create({
      name: 'Eleanor Vance (Principal)',
      email: 'admin@preschool.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (555) 100-0001',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    const teacherUser1 = await User.create({
      name: 'Sarah Jenkins',
      email: 'teacher@preschool.com',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+1 (555) 200-0001',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    });

    const teacherUser2 = await User.create({
      name: 'David Wilson',
      email: 'david.wilson@preschool.com',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+1 (555) 200-0002',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const teacherUser3 = await User.create({
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@preschool.com',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+1 (555) 200-0003',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    });

    const parentUser1 = await User.create({
      name: 'John Doe',
      email: 'parent@preschool.com',
      password: 'Parent@123',
      role: 'parent',
      phone: '+1 (555) 300-0001',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    const parentUser2 = await User.create({
      name: 'Emily Smith',
      email: 'emily.smith@parent.com',
      password: 'Parent@123',
      role: 'parent',
      phone: '+1 (555) 300-0002',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const parentUser3 = await User.create({
      name: 'Robert Chang',
      email: 'robert.chang@parent.com',
      password: 'Parent@123',
      role: 'parent',
      phone: '+1 (555) 300-0003',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    });

    // 3. Create Classes
    const classToddler = await Class.create({
      name: 'Toddler Playgroup',
      section: 'A',
      roomNumber: 'Room 101 - Sunshine Room',
      capacity: 15,
      academicYear: '2026-2027',
      description: 'Foundational sensory development, early vocabulary, and motor skills (Ages 1.5 - 2.5)',
    });

    const classNursery = await Class.create({
      name: 'Pre-K Nursery Blossoms',
      section: 'A',
      roomNumber: 'Room 102 - Blossom Hall',
      capacity: 18,
      academicYear: '2026-2027',
      description: 'Socialization, interactive play, shapes, and early phonetics (Ages 2.5 - 3.5)',
    });

    const classLKG = await Class.create({
      name: 'Junior KG Explorers',
      section: 'B',
      roomNumber: 'Room 103 - Explorer Lab',
      capacity: 20,
      academicYear: '2026-2027',
      description: 'Early reading, number concepts, science curiosity, and cooperative games (Ages 3.5 - 4.5)',
    });

    const classUKG = await Class.create({
      name: 'Senior KG Champions',
      section: 'A',
      roomNumber: 'Room 104 - Champions Arena',
      capacity: 22,
      academicYear: '2026-2027',
      description: 'Kindergarten readiness, primary phonics, numeracy, writing, and STEM fundamentals (Ages 4.5 - 6)',
    });

    // 4. Create Teacher Profiles
    const teacher1 = await Teacher.create({
      user: teacherUser1._id,
      employeeId: 'TCH-1001',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: teacherUser1.email,
      phone: teacherUser1.phone,
      gender: 'Female',
      qualification: "Master's in Early Childhood Education",
      specialization: 'Montessori Method & Sensory Development',
      joiningDate: new Date('2024-08-15'),
      assignedClasses: [classToddler._id, classNursery._id],
      address: '45 Willow Drive, Sunnyvale, CA',
      emergencyContact: { name: 'Mark Jenkins', phone: '+1 (555) 999-1001', relationship: 'Spouse' },
    });

    const teacher2 = await Teacher.create({
      user: teacherUser2._id,
      employeeId: 'TCH-1002',
      firstName: 'David',
      lastName: 'Wilson',
      email: teacherUser2.email,
      phone: teacherUser2.phone,
      gender: 'Male',
      qualification: 'B.Ed in Primary Education',
      specialization: 'Early STEM & Gross Motor Play',
      joiningDate: new Date('2024-09-01'),
      assignedClasses: [classLKG._id],
      address: '88 Oak Avenue, Mountain View, CA',
      emergencyContact: { name: 'Susan Wilson', phone: '+1 (555) 999-1002', relationship: 'Sister' },
    });

    const teacher3 = await Teacher.create({
      user: teacherUser3._id,
      employeeId: 'TCH-1003',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      email: teacherUser3.email,
      phone: teacherUser3.phone,
      gender: 'Female',
      qualification: 'Diploma in Child Psychology & Arts',
      specialization: 'Creative Arts, Music & Phonics',
      joiningDate: new Date('2025-01-10'),
      assignedClasses: [classUKG._id],
      address: '12 Marina Blvd, San Jose, CA',
      emergencyContact: { name: 'Carlos Rodriguez', phone: '+1 (555) 999-1003', relationship: 'Father' },
    });

    await Class.findByIdAndUpdate(classToddler._id, { teacher: teacher1._id });
    await Class.findByIdAndUpdate(classNursery._id, { teacher: teacher1._id });
    await Class.findByIdAndUpdate(classLKG._id, { teacher: teacher2._id });
    await Class.findByIdAndUpdate(classUKG._id, { teacher: teacher3._id });

    // 5. Create Parent Profiles
    const parent1 = await Parent.create({
      user: parentUser1._id,
      firstName: 'John',
      lastName: 'Doe',
      email: parentUser1.email,
      phone: parentUser1.phone,
      relationship: 'Father',
      occupation: 'Software Architect',
      address: '320 Maple Court, Sunnyvale, CA',
      emergencyPhone: '+1 (555) 300-9991',
      children: [],
    });

    const parent2 = await Parent.create({
      user: parentUser2._id,
      firstName: 'Emily',
      lastName: 'Smith',
      email: parentUser2.email,
      phone: parentUser2.phone,
      relationship: 'Mother',
      occupation: 'Pediatric Nurse',
      address: '512 Cedar Lane, Mountain View, CA',
      emergencyPhone: '+1 (555) 300-9992',
      children: [],
    });

    const parent3 = await Parent.create({
      user: parentUser3._id,
      firstName: 'Robert',
      lastName: 'Chang',
      email: parentUser3.email,
      phone: parentUser3.phone,
      relationship: 'Father',
      occupation: 'Civil Engineer',
      address: '77 Birch Road, Cupertino, CA',
      emergencyPhone: '+1 (555) 300-9993',
      children: [],
    });

    // 6. Create Students
    const studentData = [
      {
        studentId: 'SKA-2026-001',
        firstName: 'Leo',
        lastName: 'Doe',
        dateOfBirth: new Date('2023-04-12'),
        gender: 'Male',
        class: classNursery._id,
        parent: parent1._id,
        contactNumber: parent1.phone,
        address: parent1.address,
        emergencyContact: { name: 'John Doe', phone: parent1.phone, relationship: 'Father' },
        medicalNotes: 'Mild asthma, carries pediatric inhaler in backpack',
        allergies: 'Peanuts',
        bloodGroup: 'O+',
        profilePhoto: 'https://images.unsplash.com/photo-1519456264917-42d0aa2e0625?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-002',
        firstName: 'Mia',
        lastName: 'Doe',
        dateOfBirth: new Date('2024-06-20'),
        gender: 'Female',
        class: classToddler._id,
        parent: parent1._id,
        contactNumber: parent1.phone,
        address: parent1.address,
        emergencyContact: { name: 'John Doe', phone: parent1.phone, relationship: 'Father' },
        medicalNotes: 'None, fully vaccinated',
        allergies: 'None',
        bloodGroup: 'A+',
        profilePhoto: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-003',
        firstName: 'Lucas',
        lastName: 'Smith',
        dateOfBirth: new Date('2022-09-15'),
        gender: 'Male',
        class: classLKG._id,
        parent: parent2._id,
        contactNumber: parent2.phone,
        address: parent2.address,
        emergencyContact: { name: 'Emily Smith', phone: parent2.phone, relationship: 'Mother' },
        medicalNotes: 'Wears corrective glasses for reading',
        allergies: 'Lactose intolerant (almond milk provided)',
        bloodGroup: 'B+',
        profilePhoto: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-004',
        firstName: 'Sophia',
        lastName: 'Chang',
        dateOfBirth: new Date('2021-11-05'),
        gender: 'Female',
        class: classUKG._id,
        parent: parent3._id,
        contactNumber: parent3.phone,
        address: parent3.address,
        emergencyContact: { name: 'Robert Chang', phone: parent3.phone, relationship: 'Father' },
        medicalNotes: 'No medical conditions',
        allergies: 'None',
        bloodGroup: 'AB+',
        profilePhoto: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-005',
        firstName: 'Oliver',
        lastName: 'Baker',
        dateOfBirth: new Date('2023-01-22'),
        gender: 'Male',
        class: classNursery._id,
        parent: parent2._id,
        contactNumber: '+1 (555) 400-0005',
        address: '101 Pine St, Sunnyvale, CA',
        emergencyContact: { name: 'Sarah Baker', phone: '+1 (555) 400-0005', relationship: 'Mother' },
        medicalNotes: 'None',
        allergies: 'Strawberries',
        bloodGroup: 'O-',
        profilePhoto: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-006',
        firstName: 'Emma',
        lastName: 'Johnson',
        dateOfBirth: new Date('2022-03-30'),
        gender: 'Female',
        class: classLKG._id,
        parent: parent3._id,
        contactNumber: '+1 (555) 400-0006',
        address: '22 Elm St, Mountain View, CA',
        emergencyContact: { name: 'Grace Johnson', phone: '+1 (555) 400-0006', relationship: 'Mother' },
        medicalNotes: 'None',
        allergies: 'None',
        bloodGroup: 'A-',
        profilePhoto: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-007',
        firstName: 'Ethan',
        lastName: 'Martinez',
        dateOfBirth: new Date('2021-08-14'),
        gender: 'Male',
        class: classUKG._id,
        parent: parent1._id,
        contactNumber: '+1 (555) 400-0007',
        address: '89 Rose Way, Sunnyvale, CA',
        emergencyContact: { name: 'Elena Martinez', phone: '+1 (555) 400-0007', relationship: 'Aunt' },
        medicalNotes: 'None',
        allergies: 'None',
        bloodGroup: 'O+',
        profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-008',
        firstName: 'Chloe',
        lastName: 'Taylor',
        dateOfBirth: new Date('2024-02-18'),
        gender: 'Female',
        class: classToddler._id,
        parent: parent2._id,
        contactNumber: '+1 (555) 400-0008',
        address: '15 Lilac Court, Santa Clara, CA',
        emergencyContact: { name: 'James Taylor', phone: '+1 (555) 400-0008', relationship: 'Father' },
        medicalNotes: 'Sensitive skin, hypoallergenic lotion provided',
        allergies: 'Egg yolk',
        bloodGroup: 'B-',
        profilePhoto: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=150',
        status: 'Active',
      },
    ];

    const createdStudents = await Student.create(studentData);

    await Parent.findByIdAndUpdate(parent1._id, {
      $set: { children: [createdStudents[0]._id, createdStudents[1]._id, createdStudents[6]._id] },
    });
    await Parent.findByIdAndUpdate(parent2._id, {
      $set: { children: [createdStudents[2]._id, createdStudents[4]._id, createdStudents[7]._id] },
    });
    await Parent.findByIdAndUpdate(parent3._id, {
      $set: { children: [createdStudents[3]._id, createdStudents[5]._id] },
    });

    // 7. Create Timetables
    const scheduleSlots = [
      { class: classToddler._id, dayOfWeek: 'Monday', activityName: 'Morning Circle & Rhymes', activityType: 'Music & Movement', teacher: teacher1._id, startTime: '09:00 AM', endTime: '09:30 AM', room: 'Room 101' },
      { class: classToddler._id, dayOfWeek: 'Monday', activityName: 'Sensory Play & Blocks', activityType: 'Play', teacher: teacher1._id, startTime: '09:30 AM', endTime: '10:15 AM', room: 'Room 101' },
      { class: classToddler._id, dayOfWeek: 'Monday', activityName: 'Nutritional Fruit Snack', activityType: 'Meal', teacher: teacher1._id, startTime: '10:15 AM', endTime: '10:45 AM', room: 'Dining Hall' },
      { class: classToddler._id, dayOfWeek: 'Monday', activityName: 'Outdoor Playground Fun', activityType: 'Outdoor', teacher: teacher1._id, startTime: '10:45 AM', endTime: '11:30 AM', room: 'Garden Play Area' },
      { class: classToddler._id, dayOfWeek: 'Monday', activityName: 'Puppet Story & Nap Time', activityType: 'Nap/Rest', teacher: teacher1._id, startTime: '11:30 AM', endTime: '01:00 PM', room: 'Nap Suite' },

      { class: classNursery._id, dayOfWeek: 'Monday', activityName: 'Welcome Circle & Calendar', activityType: 'Academic', teacher: teacher1._id, startTime: '09:00 AM', endTime: '09:30 AM', room: 'Room 102' },
      { class: classNursery._id, dayOfWeek: 'Monday', activityName: 'Phonics & Letter Sounds (A-M)', activityType: 'Academic', teacher: teacher1._id, startTime: '09:30 AM', endTime: '10:15 AM', room: 'Room 102' },
      { class: classNursery._id, dayOfWeek: 'Monday', activityName: 'Finger Painting & Crafts', activityType: 'Arts & Craft', teacher: teacher1._id, startTime: '10:30 AM', endTime: '11:15 AM', room: 'Art Studio' },
      { class: classNursery._id, dayOfWeek: 'Monday', activityName: 'Sandpit & Tricycle Track', activityType: 'Outdoor', teacher: teacher1._id, startTime: '11:15 AM', endTime: '12:00 PM', room: 'Courtyard' },

      { class: classLKG._id, dayOfWeek: 'Tuesday', activityName: 'Numbers & Counting Beads', activityType: 'Academic', teacher: teacher2._id, startTime: '09:00 AM', endTime: '09:45 AM', room: 'Room 103' },
      { class: classLKG._id, dayOfWeek: 'Tuesday', activityName: 'Junior STEM Discovery', activityType: 'Academic', teacher: teacher2._id, startTime: '10:00 AM', endTime: '10:45 AM', room: 'Room 103' },
      { class: classLKG._id, dayOfWeek: 'Tuesday', activityName: 'Kids Yoga & Balance Exercises', activityType: 'Music & Movement', teacher: teacher2._id, startTime: '11:00 AM', endTime: '11:45 AM', room: 'Gymnasium' },

      { class: classUKG._id, dayOfWeek: 'Wednesday', activityName: 'Sight Words & Sentence Building', activityType: 'Academic', teacher: teacher3._id, startTime: '09:00 AM', endTime: '09:45 AM', room: 'Room 104' },
      { class: classUKG._id, dayOfWeek: 'Wednesday', activityName: 'Basic Addition & Shapes', activityType: 'Academic', teacher: teacher3._id, startTime: '10:00 AM', endTime: '10:45 AM', room: 'Room 104' },
      { class: classUKG._id, dayOfWeek: 'Wednesday', activityName: 'Music, Rhythm & Keyboard', activityType: 'Music & Movement', teacher: teacher3._id, startTime: '11:00 AM', endTime: '11:45 AM', room: 'Music Room' },
      { class: classUKG._id, dayOfWeek: 'Wednesday', activityName: 'Water Play & Science Garden', activityType: 'Outdoor', teacher: teacher3._id, startTime: '01:00 PM', endTime: '01:45 PM', room: 'Eco Garden' },
    ];

    await Schedule.create(scheduleSlots);

    // 8. Create Attendance Records
    const attendanceStatuses = ['Present', 'Present', 'Present', 'Late', 'Present', 'Leave', 'Absent'];
    const today = new Date();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      for (const st of createdStudents) {
        const randIndex = Math.floor(Math.random() * attendanceStatuses.length);
        const status = i === 0 && st.firstName === 'Lucas' ? 'Late' : attendanceStatuses[randIndex];
        const remarks = status === 'Late' ? 'Arrived 15 mins late due to rain traffic' : status === 'Leave' ? 'Doctor appointment' : '';

        await Attendance.create({
          student: st._id,
          class: st.class,
          date: d,
          dateString,
          status,
          remarks,
          markedBy: adminUser._id,
        });
      }
    }

    // 9. Create Fees & Payments
    const fee1 = await Fee.create({
      student: createdStudents[0]._id,
      title: 'Fall Term 2026 Tuition Fee',
      feeType: 'Tuition',
      amount: 1200,
      paidAmount: 1200,
      dueDate: new Date('2026-10-15'),
      academicYear: '2026-2027',
      status: 'PAID',
      description: 'Comprehensive preschool tuition and curriculum materials',
    });

    const fee2 = await Fee.create({
      student: createdStudents[1]._id,
      title: 'Toddler Care & Snack Fee',
      feeType: 'Meals',
      amount: 650,
      paidAmount: 300,
      dueDate: new Date('2026-10-20'),
      academicYear: '2026-2027',
      status: 'PARTIAL',
      description: 'Organic morning and afternoon snacks plus toddler diapers',
    });

    const fee3 = await Fee.create({
      student: createdStudents[2]._id,
      title: 'Annual Admission & Kit Fee',
      feeType: 'Admission',
      amount: 450,
      paidAmount: 450,
      dueDate: new Date('2026-09-01'),
      academicYear: '2026-2027',
      status: 'PAID',
      description: 'School backpack, uniform set, art apron and stationeries',
    });

    await Fee.create({
      student: createdStudents[3]._id,
      title: 'Fall Term 2026 Tuition Fee',
      feeType: 'Tuition',
      amount: 1350,
      paidAmount: 0,
      dueDate: new Date('2026-10-30'),
      academicYear: '2026-2027',
      status: 'PENDING',
      description: 'Senior KG Kindergarten readiness program and STEM lab pass',
    });

    const fee5 = await Fee.create({
      student: createdStudents[4]._id,
      title: 'Transport Service (Roundtrip)',
      feeType: 'Transport',
      amount: 350,
      paidAmount: 350,
      dueDate: new Date('2026-10-05'),
      academicYear: '2026-2027',
      status: 'PAID',
      description: 'Air-conditioned preschool bus route A (Door-to-door)',
    });

    await Payment.create({
      fee: fee1._id,
      student: createdStudents[0]._id,
      amount: 1200,
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-CARD-99214',
      receiptNumber: 'REC-2026-100291',
      notes: 'Paid in full via Parent Portal online checkout',
      receivedBy: adminUser._id,
    });

    await Payment.create({
      fee: fee2._id,
      student: createdStudents[1]._id,
      amount: 300,
      paymentMethod: 'UPI',
      transactionId: 'TXN-UPI-88412',
      receiptNumber: 'REC-2026-100292',
      notes: 'First installment received',
      receivedBy: adminUser._id,
    });

    await Payment.create({
      fee: fee3._id,
      student: createdStudents[2]._id,
      amount: 450,
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-ACH-77192',
      receiptNumber: 'REC-2026-100293',
      notes: 'Wire transfer confirmed by accounting',
      receivedBy: adminUser._id,
    });

    await Payment.create({
      fee: fee5._id,
      student: createdStudents[4]._id,
      amount: 350,
      paymentMethod: 'Online',
      transactionId: 'TXN-ONL-55102',
      receiptNumber: 'REC-2026-100294',
      notes: 'Direct online payment - Monthly bus fee cleared',
      receivedBy: adminUser._id,
    });

    // 10. Create Announcements
    await Announcement.create([
      {
        title: '🎉 Welcome to New Academic Term 2026-2027!',
        message: 'We are thrilled to welcome all children and families to Sunshine Kids Academy! Please make sure your emergency contacts and allergy notes are up to date.',
        targetRole: 'All',
        priority: 'High',
        isPinned: true,
        createdBy: adminUser._id,
      },
      {
        title: '🍎 Healthy Snack Week & Organic Tasting Station',
        message: 'Next week is Healthy Snack Week! Teachers and parents will introduce delicious fruits and veggies. Please check the cafeteria menu in the files section.',
        targetRole: 'Parent',
        priority: 'Normal',
        isPinned: false,
        createdBy: adminUser._id,
      },
      {
        title: '📋 Staff Curriculum Workshop this Friday at 3:30 PM',
        message: 'Reminder for all teaching staff: We will have an interactive Montessori materials review and sensory room safety session in Room 102.',
        targetRole: 'Teacher',
        priority: 'Urgent',
        isPinned: false,
        createdBy: adminUser._id,
      },
      {
        title: '🍂 Autumn Picture Day Reminder',
        message: 'School professional photo shoots will take place on Thursday. Please send your kids in their favorite formal or bright attire!',
        targetRole: 'Parent',
        priority: 'Normal',
        isPinned: false,
        createdBy: adminUser._id,
      },
    ]);

    // 11. Create Events
    const eventDate1 = new Date();
    eventDate1.setDate(today.getDate() + 7);

    const eventDate2 = new Date();
    eventDate2.setDate(today.getDate() + 14);

    const eventDate3 = new Date();
    eventDate3.setDate(today.getDate() + 21);

    await Event.create([
      {
        title: 'Little Picassos Annual Art Exhibition',
        description: 'Celebrate our little artists! Display of clay models, finger painting masterpieces, and canvas collages created throughout the semester.',
        eventDate: eventDate1,
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        location: 'Central Courtyard & Art Gallery',
        targetAudience: 'All',
        category: 'Cultural',
        createdBy: adminUser._id,
      },
      {
        title: 'Parent-Teacher Collaborative Conference (PTC)',
        description: 'One-on-one progress discussion with class educators regarding social milestones, motor skills development, and academic readiness.',
        eventDate: eventDate2,
        startTime: '08:30 AM',
        endTime: '04:00 PM',
        location: 'Individual Classrooms',
        targetAudience: 'Parent',
        category: 'Meeting',
        createdBy: adminUser._id,
      },
      {
        title: 'Annual Sunshine Sports & Fun Day',
        description: 'Obstacle courses, relay races, sack races, parachute play, and ribbon distribution for all preschool and kindergarten classes.',
        eventDate: eventDate3,
        startTime: '09:00 AM',
        endTime: '12:30 PM',
        location: 'Sunshine Sports Field',
        targetAudience: 'All',
        category: 'Sports',
        createdBy: adminUser._id,
      },
    ]);

    console.log('[Seed] Development data ready');
    return true;
  } catch (error) {
    console.error('[Seed Error]:', error.message || error);
    throw error;
  }
};

module.exports = runSeed;
