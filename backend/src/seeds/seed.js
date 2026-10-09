require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');

// Import all models
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

const seedData = async () => {
  try {
    console.log('--- Starting Indian Pre-School Management Database Seed ---');
    await connectDB();

    // Clear existing collections
    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Teacher.deleteMany({}),
      Parent.deleteMany({}),
      Student.deleteMany({}),
      Attendance.deleteMany({}),
      Schedule.deleteMany({}),
      Fee.deleteMany({}),
      Payment.deleteMany({}),
      Announcement.deleteMany({}),
      Event.deleteMany({}),
      Setting.deleteMany({}),
    ]);
    console.log('Collections cleared.');

    // 1. Create Default School Settings
    console.log('Seeding School Settings...');
    await Setting.create({
      schoolName: 'Sunshine Kids Academy & Pre-School',
      schoolEmail: 'contact@preschool.demo',
      schoolPhone: '+91 98220 12345',
      schoolAddress: 'Plot 42, Kothrud Green Road, Pune, Maharashtra 411038',
      academicYear: '2026-2027',
      currentTerm: 'Term 1',
      currency: 'INR (₹)',
      admissionPrefix: 'SKA-',
      systemNotifications: true,
    });

    // 2. Create Seed Users
    console.log('Seeding Users...');
    // Admins
    const adminUser1 = await User.create({
      name: 'Prakash Patil',
      email: 'admin@preschool.demo',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98220 10001',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    });

    // Alias for existing admin login compatibility
    await User.create({
      name: 'Anjali Kulkarni',
      email: 'admin@preschool.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98220 10002',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    // Teachers
    const teacherUser1 = await User.create({
      name: 'Sneha Kulkarni',
      email: 'sneha.teacher@preschool.demo',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20001',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    });

    // Alias for existing teacher login compatibility
    await User.create({
      name: 'Sneha Kulkarni',
      email: 'teacher@preschool.com',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20001',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    });

    const teacherUser2 = await User.create({
      name: 'Priya Joshi',
      email: 'priya.teacher@preschool.demo',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20002',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    });

    const teacherUser3 = await User.create({
      name: 'Neha Patil',
      email: 'neha.teacher@preschool.demo',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20003',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const teacherUser4 = await User.create({
      name: 'Amit Jadhav',
      email: 'amit.teacher@preschool.demo',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20004',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const teacherUser5 = await User.create({
      name: 'Pooja Sharma',
      email: 'pooja.teacher@preschool.demo',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20005',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    const teacherUser6 = await User.create({
      name: 'Rahul Deshmukh',
      email: 'rahul.teacher@preschool.demo',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98220 20006',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    // Parents
    const parentUser1 = await User.create({
      name: 'Rahul Patil',
      email: 'rahul.parent@preschool.demo',
      password: 'Parent@123',
      role: 'parent',
      phone: '+91 98220 30001',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    // Alias for existing parent login compatibility
    await User.create({
      name: 'Rahul Patil',
      email: 'parent@preschool.com',
      password: 'Parent@123',
      role: 'parent',
      phone: '+91 98220 30001',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    const parentUser2 = await User.create({
      name: 'Amit Kulkarni',
      email: 'amit.kulkarni@parent.demo',
      password: 'Parent@123',
      role: 'parent',
      phone: '+91 98220 30002',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    });

    const parentUser3 = await User.create({
      name: 'Sandeep Sharma',
      email: 'sandeep.sharma@parent.demo',
      password: 'Parent@123',
      role: 'parent',
      phone: '+91 98220 30003',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const parentUser4 = await User.create({
      name: 'Rohit Deshmukh',
      email: 'rohit.deshmukh@parent.demo',
      password: 'Parent@123',
      role: 'parent',
      phone: '+91 98220 30004',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    // 3. Create Teachers Profiles
    console.log('Seeding Teacher Profiles...');
    const teacherDoc1 = await Teacher.create({
      user: teacherUser1._id,
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      email: 'sneha.teacher@preschool.demo',
      phone: '+91 98220 20001',
      qualification: 'M.A. Early Childhood Education, B.Ed',
      subject: 'English & Phonics',
      designation: 'Lead Educator (Nursery A)',
      employeeId: 'TCH-2026-001',
      joiningDate: new Date('2023-06-01'),
      salary: 45000,
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    });

    const teacherDoc2 = await Teacher.create({
      user: teacherUser2._id,
      firstName: 'Priya',
      lastName: 'Joshi',
      email: 'priya.teacher@preschool.demo',
      phone: '+91 98220 20002',
      qualification: 'M.Sc, Montessori Certified',
      subject: 'Mathematics & Logic',
      designation: 'Class Teacher (Nursery B)',
      employeeId: 'TCH-2026-002',
      joiningDate: new Date('2023-06-15'),
      salary: 42000,
      profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    });

    const teacherDoc3 = await Teacher.create({
      user: teacherUser3._id,
      firstName: 'Neha',
      lastName: 'Patil',
      email: 'neha.teacher@preschool.demo',
      phone: '+91 98220 20003',
      qualification: 'B.A. Child Psychology, ECCEd',
      subject: 'Environmental Studies & Storytelling',
      designation: 'Class Teacher (LKG A)',
      employeeId: 'TCH-2026-003',
      joiningDate: new Date('2024-01-10'),
      salary: 40000,
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const teacherDoc4 = await Teacher.create({
      user: teacherUser4._id,
      firstName: 'Amit',
      lastName: 'Jadhav',
      email: 'amit.teacher@preschool.demo',
      phone: '+91 98220 20004',
      qualification: 'B.P.Ed, Fine Arts Diploma',
      subject: 'Physical Education & Arts',
      designation: 'Class Teacher (UKG A)',
      employeeId: 'TCH-2026-004',
      joiningDate: new Date('2024-02-01'),
      salary: 40000,
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const teacherDoc5 = await Teacher.create({
      user: teacherUser5._id,
      firstName: 'Pooja',
      lastName: 'Sharma',
      email: 'pooja.teacher@preschool.demo',
      phone: '+91 98220 20005',
      qualification: 'B.Ed, Music & Movement',
      subject: 'Music, Dance & Drama',
      designation: 'Activity Specialist',
      employeeId: 'TCH-2026-005',
      joiningDate: new Date('2024-04-15'),
      salary: 38000,
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    const teacherDoc6 = await Teacher.create({
      user: teacherUser6._id,
      firstName: 'Rahul',
      lastName: 'Deshmukh',
      email: 'rahul.teacher@preschool.demo',
      phone: '+91 98220 20006',
      qualification: 'M.Ed, Language Development',
      subject: 'Language & Numeracy',
      designation: 'Senior Co-Educator',
      employeeId: 'TCH-2026-006',
      joiningDate: new Date('2024-05-01'),
      salary: 41000,
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    // 4. Create Classes with Designated Class Teachers
    console.log('Seeding Classes with Class Teachers...');
    const classNurseryA = await Class.create({
      name: 'Nursery',
      className: 'Nursery',
      section: 'A',
      roomNumber: 'Room 101 - Ananda Hall',
      room: 'Room 101 - Ananda Hall',
      capacity: 20,
      classTeacher: teacherDoc1._id,
      teacher: teacherDoc1._id,
      academicYear: '2026-2027',
      description: 'Foundational sensory learning, rhymes, and socialization (Ages 2.5 - 3.5)',
    });

    const classNurseryB = await Class.create({
      name: 'Nursery',
      className: 'Nursery',
      section: 'B',
      roomNumber: 'Room 102 - Prerana Hall',
      room: 'Room 102 - Prerana Hall',
      capacity: 20,
      classTeacher: teacherDoc2._id,
      teacher: teacherDoc2._id,
      academicYear: '2026-2027',
      description: 'Interactive play, early phonetics, and gross motor skills (Ages 2.5 - 3.5)',
    });

    const classLKGA = await Class.create({
      name: 'LKG',
      className: 'LKG',
      section: 'A',
      roomNumber: 'Room 201 - Shanti Hall',
      room: 'Room 201 - Shanti Hall',
      capacity: 22,
      classTeacher: teacherDoc3._id,
      teacher: teacherDoc3._id,
      academicYear: '2026-2027',
      description: 'Pre-math, language vocabulary, science curiosity, and writing readiness (Ages 3.5 - 4.5)',
    });

    const classUKGA = await Class.create({
      name: 'UKG',
      className: 'UKG',
      section: 'A',
      roomNumber: 'Room 202 - Pragati Hall',
      room: 'Room 202 - Pragati Hall',
      capacity: 25,
      classTeacher: teacherDoc4._id,
      teacher: teacherDoc4._id,
      academicYear: '2026-2027',
      description: 'Advanced phonics, sentence formation, arithmetic, and school readiness (Ages 4.5 - 5.5)',
    });

    // Update teachers with assigned classes
    teacherDoc1.assignedClasses = [classNurseryA._id];
    await teacherDoc1.save();
    teacherDoc2.assignedClasses = [classNurseryB._id];
    await teacherDoc2.save();
    teacherDoc3.assignedClasses = [classLKGA._id];
    await teacherDoc3.save();
    teacherDoc4.assignedClasses = [classUKGA._id];
    await teacherDoc4.save();

    // 5. Create Parent Profiles
    console.log('Seeding Parent Profiles...');
    const parentDoc1 = await Parent.create({
      user: parentUser1._id,
      firstName: 'Rahul',
      lastName: 'Patil',
      email: 'rahul.parent@preschool.demo',
      phone: '+91 98220 30001',
      relationship: 'Father',
      occupation: 'Software Engineering Manager',
      address: 'Flat 402, Rohan Tarang, Shivajinagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      aadhaarNumber: 'XXXX-XXXX-4512',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      motherInfo: {
        name: 'Priya Patil',
        phone: '+91 98220 30011',
        email: 'priya.patil@example.com',
        occupation: 'Architect',
        address: 'Flat 402, Rohan Tarang, Shivajinagar, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      guardianInfo: {
        name: 'Suresh Patil',
        relationship: 'Grandfather',
        phone: '+91 98220 30021',
        email: '',
        address: 'Shivajinagar, Pune',
      },
      children: [],
    });

    const parentDoc2 = await Parent.create({
      user: parentUser2._id,
      firstName: 'Amit',
      lastName: 'Kulkarni',
      email: 'amit.kulkarni@parent.demo',
      phone: '+91 98220 30002',
      relationship: 'Father',
      occupation: 'Senior Civil Consultant',
      address: 'Bungalow 12, Kothrud Green Enclave',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      aadhaarNumber: 'XXXX-XXXX-8921',
      profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      motherInfo: {
        name: 'Sneha Kulkarni',
        phone: '+91 98220 30012',
        email: 'sneha.k@example.com',
        occupation: 'High School Teacher',
        address: 'Bungalow 12, Kothrud Green Enclave, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
      children: [],
    });

    const parentDoc3 = await Parent.create({
      user: parentUser3._id,
      firstName: 'Sandeep',
      lastName: 'Sharma',
      email: 'sandeep.sharma@parent.demo',
      phone: '+91 98220 30003',
      relationship: 'Father',
      occupation: 'Chartered Accountant',
      address: 'Flat 601, Baner Heights, Baner',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      aadhaarNumber: 'XXXX-XXXX-6743',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      motherInfo: {
        name: 'Neha Sharma',
        phone: '+91 98220 30013',
        email: 'neha.sharma@example.com',
        occupation: 'Banking Professional',
        address: 'Flat 601, Baner Heights, Baner, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
      },
      children: [],
    });

    const parentDoc4 = await Parent.create({
      user: parentUser4._id,
      firstName: 'Rohit',
      lastName: 'Deshmukh',
      email: 'rohit.deshmukh@parent.demo',
      phone: '+91 98220 30004',
      relationship: 'Father',
      occupation: 'Consultant Pediatrician',
      address: 'Plot 8, Goodwill Society, Aundh',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411007',
      aadhaarNumber: 'XXXX-XXXX-2154',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      motherInfo: {
        name: 'Pooja Deshmukh',
        phone: '+91 98220 30014',
        email: 'pooja.deshmukh@example.com',
        occupation: 'Dental Surgeon',
        address: 'Plot 8, Goodwill Society, Aundh, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411007',
      },
      children: [],
    });

    // 6. Create Students with Realistic Indian Names and Details
    console.log('Seeding Students...');
    const studentsData = [
      {
        studentId: 'SKA-2026-001',
        firstName: 'Aarav',
        lastName: 'Patil',
        dateOfBirth: new Date('2022-04-15'),
        gender: 'Male',
        class: classNurseryA._id,
        parent: parentDoc1._id,
        phone: '+91 98220 30001',
        email: 'rahul.parent@preschool.demo',
        address: 'Flat 402, Rohan Tarang, Shivajinagar, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
        bloodGroup: 'B+',
        allergies: 'None',
        medicalNotes: 'Fully vaccinated according to Indian pediatric schedule',
        profilePhoto: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-002',
        firstName: 'Anaya',
        lastName: 'Sharma',
        dateOfBirth: new Date('2022-07-20'),
        gender: 'Female',
        class: classNurseryA._id,
        parent: parentDoc3._id,
        phone: '+91 98220 30003',
        email: 'sandeep.sharma@parent.demo',
        address: 'Flat 601, Baner Heights, Baner, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        bloodGroup: 'O+',
        allergies: 'None',
        medicalNotes: 'No medical restrictions',
        profilePhoto: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-003',
        firstName: 'Advait',
        lastName: 'Kulkarni',
        dateOfBirth: new Date('2022-02-10'),
        gender: 'Male',
        class: classNurseryA._id,
        parent: parentDoc2._id,
        phone: '+91 98220 30002',
        email: 'amit.kulkarni@parent.demo',
        address: 'Bungalow 12, Kothrud Green Enclave, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        bloodGroup: 'A+',
        allergies: 'Peanuts',
        medicalNotes: 'Peanut allergy, emergency antihistamine stored with school nurse',
        profilePhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-004',
        firstName: 'Siya',
        lastName: 'Deshmukh',
        dateOfBirth: new Date('2022-09-05'),
        gender: 'Female',
        class: classNurseryB._id,
        parent: parentDoc4._id,
        phone: '+91 98220 30004',
        email: 'rohit.deshmukh@parent.demo',
        address: 'Plot 8, Goodwill Society, Aundh, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411007',
        bloodGroup: 'AB+',
        allergies: 'None',
        medicalNotes: 'Healthy, active child',
        profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-005',
        firstName: 'Vedant',
        lastName: 'Joshi',
        dateOfBirth: new Date('2022-11-12'),
        gender: 'Male',
        class: classNurseryB._id,
        parent: parentDoc1._id,
        phone: '+91 98220 30001',
        email: 'rahul.parent@preschool.demo',
        address: 'Flat 402, Shivajinagar, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
        bloodGroup: 'O+',
        allergies: 'Dust',
        medicalNotes: 'Mild seasonal rhinitis',
        profilePhoto: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-006',
        firstName: 'Aadhya',
        lastName: 'Shah',
        dateOfBirth: new Date('2021-05-18'),
        gender: 'Female',
        class: classLKGA._id,
        parent: parentDoc3._id,
        phone: '+91 98220 30003',
        email: 'sandeep.sharma@parent.demo',
        address: 'Model Colony, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411016',
        bloodGroup: 'B+',
        allergies: 'None',
        medicalNotes: 'None reported',
        profilePhoto: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-007',
        firstName: 'Ishaan',
        lastName: 'More',
        dateOfBirth: new Date('2021-08-25'),
        gender: 'Male',
        class: classLKGA._id,
        parent: parentDoc2._id,
        phone: '+91 98220 30002',
        email: 'amit.kulkarni@parent.demo',
        address: 'Bavdhan, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411021',
        bloodGroup: 'A+',
        allergies: 'None',
        medicalNotes: 'Regular pediatric checkup completed',
        profilePhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-008',
        firstName: 'Myra',
        lastName: 'Pawar',
        dateOfBirth: new Date('2021-03-30'),
        gender: 'Female',
        class: classLKGA._id,
        parent: parentDoc4._id,
        phone: '+91 98220 30004',
        email: 'rohit.deshmukh@parent.demo',
        address: 'Prabhat Road, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
        bloodGroup: 'O-',
        allergies: 'Dairy',
        medicalNotes: 'Lactose intolerant, school serves oat/almond milk snack alternatives',
        profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-009',
        firstName: 'Arjun',
        lastName: 'Jadhav',
        dateOfBirth: new Date('2020-06-14'),
        gender: 'Male',
        class: classUKGA._id,
        parent: parentDoc1._id,
        phone: '+91 98220 30001',
        email: 'rahul.parent@preschool.demo',
        address: 'Viman Nagar, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411014',
        bloodGroup: 'B+',
        allergies: 'None',
        medicalNotes: 'None',
        profilePhoto: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150',
        status: 'Active',
      },
      {
        studentId: 'SKA-2026-010',
        firstName: 'Kavya',
        lastName: 'Shinde',
        dateOfBirth: new Date('2020-10-08'),
        gender: 'Female',
        class: classUKGA._id,
        parent: parentDoc2._id,
        phone: '+91 98220 30002',
        email: 'amit.kulkarni@parent.demo',
        address: 'Kalyani Nagar, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411006',
        bloodGroup: 'AB-',
        allergies: 'None',
        medicalNotes: 'None',
        profilePhoto: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=150',
        status: 'Active',
      },
    ];

    const createdStudents = [];
    for (const s of studentsData) {
      const student = await Student.create(s);
      createdStudents.push(student);
      // Link child to parent
      await Parent.findByIdAndUpdate(s.parent, {
        $addToSet: { children: student._id },
      });
    }

    // 7. Create Complete Weekly Timetable (Monday to Saturday) - Conflict Free
    console.log('Seeding Weekly Timetable (Monday to Saturday)...');
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Schedule matrix:
    // Slot 1: 08:30 - 09:00 (Assembly)
    // Slot 2: 09:00 - 09:45 (Subject 1)
    // Slot 3: 09:45 - 10:30 (Subject 2)
    // Slot 4: 10:30 - 11:00 (Snack Break)
    // Slot 5: 11:00 - 11:45 (Subject 3)
    // Slot 6: 11:45 - 12:30 (Activity / Outdoor)

    for (const day of daysOfWeek) {
      // Nursery A
      await Schedule.create({
        class: classNurseryA._id,
        teacher: teacherDoc1._id,
        activity: 'Morning Assembly & Prayer',
        activityName: 'Morning Assembly & Prayer',
        day,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '09:00',
        room: classNurseryA.roomNumber,
        activityType: 'Academic',
        notes: 'Shloka chanting, morning greetings, and news sharing',
      });
      await Schedule.create({
        class: classNurseryA._id,
        teacher: teacherDoc1._id,
        activity: 'English Rhymes & Phonics',
        activityName: 'English Rhymes & Phonics',
        day,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '09:45',
        room: classNurseryA.roomNumber,
        activityType: 'Academic',
        notes: 'Phonics sounds A to Z with sensory flashcards',
      });
      await Schedule.create({
        class: classNurseryA._id,
        teacher: teacherDoc5._id,
        activity: 'Music & Movement',
        activityName: 'Music & Movement',
        day,
        dayOfWeek: day,
        startTime: '09:45',
        endTime: '10:30',
        room: classNurseryA.roomNumber,
        activityType: 'Music & Movement',
        notes: 'Action songs and rhythmic coordination',
      });
      await Schedule.create({
        class: classNurseryA._id,
        teacher: null,
        activity: 'Nutritious Snack Break',
        activityName: 'Nutritious Snack Break',
        day,
        dayOfWeek: day,
        startTime: '10:30',
        endTime: '11:00',
        room: classNurseryA.roomNumber,
        activityType: 'Meal',
        notes: 'Table manners, washing hands, and fresh fruits/idli snack',
      });
      await Schedule.create({
        class: classNurseryA._id,
        teacher: teacherDoc3._id,
        activity: 'Storytelling & Puppet Play',
        activityName: 'Storytelling & Puppet Play',
        day,
        dayOfWeek: day,
        startTime: '11:00',
        endTime: '11:45',
        room: classNurseryA.roomNumber,
        activityType: 'Play',
        notes: 'Panchatantra tales and moral stories',
      });
      await Schedule.create({
        class: classNurseryA._id,
        teacher: teacherDoc4._id,
        activity: 'Sandpit & Outdoor Play',
        activityName: 'Sandpit & Outdoor Play',
        day,
        dayOfWeek: day,
        startTime: '11:45',
        endTime: '12:30',
        room: classNurseryA.roomNumber,
        activityType: 'Outdoor',
        notes: 'Motor skills, slides, and sensory play',
      });

      // Nursery B
      await Schedule.create({
        class: classNurseryB._id,
        teacher: teacherDoc2._id,
        activity: 'Morning Assembly & Prayer',
        activityName: 'Morning Assembly & Prayer',
        day,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '09:00',
        room: classNurseryB.roomNumber,
        activityType: 'Academic',
        notes: 'Morning routine and attendance song',
      });
      await Schedule.create({
        class: classNurseryB._id,
        teacher: teacherDoc2._id,
        activity: 'Numbers & Counting Play',
        activityName: 'Numbers & Counting Play',
        day,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '09:45',
        room: classNurseryB.roomNumber,
        activityType: 'Academic',
        notes: 'Counting 1-20 with abacus beads',
      });
      await Schedule.create({
        class: classNurseryB._id,
        teacher: teacherDoc1._id,
        activity: 'English Rhymes & Phonics',
        activityName: 'English Rhymes & Phonics',
        day,
        dayOfWeek: day,
        startTime: '09:45',
        endTime: '10:30',
        room: classNurseryB.roomNumber,
        activityType: 'Academic',
        notes: 'Interactive letter sounds',
      });
      await Schedule.create({
        class: classNurseryB._id,
        teacher: null,
        activity: 'Nutritious Snack Break',
        activityName: 'Nutritious Snack Break',
        day,
        dayOfWeek: day,
        startTime: '10:30',
        endTime: '11:00',
        room: classNurseryB.roomNumber,
        activityType: 'Meal',
        notes: 'Healthy snack time and water hydration check',
      });
      await Schedule.create({
        class: classNurseryB._id,
        teacher: teacherDoc4._id,
        activity: 'Drawing & Finger Painting',
        activityName: 'Drawing & Finger Painting',
        day,
        dayOfWeek: day,
        startTime: '11:00',
        endTime: '11:45',
        room: classNurseryB.roomNumber,
        activityType: 'Arts & Craft',
        notes: 'Primary color exploration on craft sheets',
      });
      await Schedule.create({
        class: classNurseryB._id,
        teacher: teacherDoc2._id,
        activity: 'Rest & Guided Storytelling',
        activityName: 'Rest & Guided Storytelling',
        day,
        dayOfWeek: day,
        startTime: '11:45',
        endTime: '12:30',
        room: classNurseryB.roomNumber,
        activityType: 'Play',
        notes: 'Relaxing story session before dispersal',
      });

      // LKG A
      await Schedule.create({
        class: classLKGA._id,
        teacher: teacherDoc3._id,
        activity: 'Assembly & Indian National Anthem',
        activityName: 'Assembly & Indian National Anthem',
        day,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '09:00',
        room: classLKGA.roomNumber,
        activityType: 'Academic',
        notes: 'National anthem, pledge, and daily yoga stretch',
      });
      await Schedule.create({
        class: classLKGA._id,
        teacher: teacherDoc3._id,
        activity: 'Environmental Studies (Nature & Animals)',
        activityName: 'Environmental Studies (Nature & Animals)',
        day,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '09:45',
        room: classLKGA.roomNumber,
        activityType: 'Academic',
        notes: 'Plants, seasons, and domestic animals awareness',
      });
      await Schedule.create({
        class: classLKGA._id,
        teacher: teacherDoc6._id,
        activity: 'Mathematics & Patterns',
        activityName: 'Mathematics & Patterns',
        day,
        dayOfWeek: day,
        startTime: '09:45',
        endTime: '10:30',
        room: classLKGA.roomNumber,
        activityType: 'Academic',
        notes: 'Shapes, big/small concepts, patterns',
      });
      await Schedule.create({
        class: classLKGA._id,
        teacher: null,
        activity: 'Snack & Refreshment Break',
        activityName: 'Snack & Refreshment Break',
        day,
        dayOfWeek: day,
        startTime: '10:30',
        endTime: '11:00',
        room: classLKGA.roomNumber,
        activityType: 'Meal',
        notes: 'Cleanliness routine and wholesome lunch/snack',
      });
      await Schedule.create({
        class: classLKGA._id,
        teacher: teacherDoc5._id,
        activity: 'Music, Drama & Expression',
        activityName: 'Music, Drama & Expression',
        day,
        dayOfWeek: day,
        startTime: '11:00',
        endTime: '11:45',
        room: classLKGA.roomNumber,
        activityType: 'Music & Movement',
        notes: 'Indian classical rhythm & kids folk songs',
      });
      await Schedule.create({
        class: classLKGA._id,
        teacher: teacherDoc3._id,
        activity: 'Clay Modeling & Fine Motor Skills',
        activityName: 'Clay Modeling & Fine Motor Skills',
        day,
        dayOfWeek: day,
        startTime: '11:45',
        endTime: '12:30',
        room: classLKGA.roomNumber,
        activityType: 'Arts & Craft',
        notes: 'Playdough fruit and animal creations',
      });

      // UKG A
      await Schedule.create({
        class: classUKGA._id,
        teacher: teacherDoc4._id,
        activity: 'Morning Assembly & Thought of the Day',
        activityName: 'Morning Assembly & Thought of the Day',
        day,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '09:00',
        room: classUKGA.roomNumber,
        activityType: 'Academic',
        notes: 'Student presentation & moral thoughts',
      });
      await Schedule.create({
        class: classUKGA._id,
        teacher: teacherDoc6._id,
        activity: 'English CVC Words & Early Reading',
        activityName: 'English CVC Words & Early Reading',
        day,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '09:45',
        room: classUKGA.roomNumber,
        activityType: 'Academic',
        notes: 'Blending phonemes, 3-letter words reading',
      });
      await Schedule.create({
        class: classUKGA._id,
        teacher: teacherDoc4._id,
        activity: 'Mathematics: Addition & Subtraction',
        activityName: 'Mathematics: Addition & Subtraction',
        day,
        dayOfWeek: day,
        startTime: '09:45',
        endTime: '10:30',
        room: classUKGA.roomNumber,
        activityType: 'Academic',
        notes: 'Hands-on counting rods and simple sums',
      });
      await Schedule.create({
        class: classUKGA._id,
        teacher: null,
        activity: 'Lunch & Social Hour',
        activityName: 'Lunch & Social Hour',
        day,
        dayOfWeek: day,
        startTime: '10:30',
        endTime: '11:00',
        room: classUKGA.roomNumber,
        activityType: 'Meal',
        notes: 'Conversational skills and etiquette',
      });
      await Schedule.create({
        class: classUKGA._id,
        teacher: teacherDoc2._id,
        activity: 'Hindi / Regional Language Rhymes',
        activityName: 'Hindi / Regional Language Rhymes',
        day,
        dayOfWeek: day,
        startTime: '11:00',
        endTime: '11:45',
        room: classUKGA.roomNumber,
        activityType: 'Academic',
        notes: 'Varnamala introduction and festive songs',
      });
      await Schedule.create({
        class: classUKGA._id,
        teacher: teacherDoc4._id,
        activity: 'Physical Education & Team Sports',
        activityName: 'Physical Education & Team Sports',
        day,
        dayOfWeek: day,
        startTime: '11:45',
        endTime: '12:30',
        room: classUKGA.roomNumber,
        activityType: 'Outdoor',
        notes: 'Ball coordination, obstacle relays, and fun games',
      });
    }

    // 8. Create Attendance Records for Past 7 Days
    console.log('Seeding Attendance logs...');
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      // Mark for each student
      for (const st of createdStudents) {
        // Vary status realistically: most present, occasional late or absent
        const rand = (st.firstName.charCodeAt(0) + i) % 10;
        let status = 'PRESENT';
        let remarks = 'Attended all sessions on time';

        if (rand === 7) {
          status = 'LATE';
          remarks = 'Arrived 15 minutes late due to traffic';
        } else if (rand === 8) {
          status = 'ABSENT';
          remarks = 'Informed leave due to mild fever';
        } else if (rand === 9 && i === 2) {
          status = 'LEAVE';
          remarks = 'Prior approved family function';
        }

        await Attendance.create({
          student: st._id,
          class: st.class,
          date: new Date(dateString + 'T00:00:00.000Z'),
          dateString,
          status,
          remarks,
          markedBy: adminUser1._id,
        });
      }
    }

    // 9. Create Fees and Payments for Each Student
    console.log('Seeding Fees & Payments...');
    const feePlans = [
      { annual: 48000, admission: 12000, tuition: 30000, other: 6000, paid: 48000, mode: 'UPI' },
      { annual: 48000, admission: 12000, tuition: 30000, other: 6000, paid: 25000, mode: 'Bank Transfer' },
      { annual: 52000, admission: 12000, tuition: 34000, other: 6000, paid: 52000, mode: 'Card' },
      { annual: 52000, admission: 12000, tuition: 34000, other: 6000, paid: 0, mode: 'Cash' },
      { annual: 55000, admission: 15000, tuition: 34000, other: 6000, paid: 30000, mode: 'UPI' },
      { annual: 55000, admission: 15000, tuition: 34000, other: 6000, paid: 55000, mode: 'Online' },
    ];

    for (let idx = 0; idx < createdStudents.length; idx++) {
      const st = createdStudents[idx];
      const plan = feePlans[idx % feePlans.length];
      const totalPayable = plan.annual;
      const amountPaid = plan.paid;
      const remainingAmount = Math.max(0, totalPayable - amountPaid);

      let feeStatus = 'PENDING';
      if (amountPaid >= totalPayable) feeStatus = 'PAID';
      else if (amountPaid > 0) feeStatus = 'PARTIAL';

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + (feeStatus === 'PAID' ? 90 : 15));

      const receiptNum = `REC-2026-${String(100100 + idx)}`;
      const txnId = amountPaid > 0 ? `TXN-PUN-${Date.now()}-${idx + 100}` : '';

      const feeDoc = await Fee.create({
        student: st._id,
        feeType: 'Annual Comprehensive Fee',
        title: `Annual Tuition & Admission Fees - ${st.firstName} ${st.lastName}`,
        amount: totalPayable,
        annualFees: plan.annual,
        admissionFees: plan.admission,
        tuitionFees: plan.tuition,
        otherFees: plan.other,
        totalPayableFees: totalPayable,
        paidAmount: amountPaid,
        remainingAmount,
        dueDate: nextDueDate,
        nextPaymentDueDate: remainingAmount > 0 ? nextDueDate : null,
        paymentDate: amountPaid > 0 ? new Date() : null,
        paymentMode: plan.mode,
        receiptNumber: receiptNum,
        transactionId: txnId,
        remarks: feeStatus === 'PAID' ? 'Full annual fees cleared with early bird discount' : 'Term 1 installment paid',
        status: feeStatus,
        academicYear: '2026-2027',
        description: `Admission ₹${plan.admission}, Tuition ₹${plan.tuition}, Activity & Care ₹${plan.other}`,
      });

      if (amountPaid > 0) {
        await Payment.create({
          student: st._id,
          fee: feeDoc._id,
          amount: amountPaid,
          paymentDate: new Date(),
          paymentMethod: plan.mode,
          receiptNumber: receiptNum,
          transactionId: txnId,
          receivedBy: adminUser1._id,
          notes: `Receipt issued for ${st.firstName} ${st.lastName}`,
        });
      }
    }

    // 10. Create Realistic Indian Announcements & Events
    console.log('Seeding Announcements and Events...');
    await Announcement.create([
      {
        title: 'Diwali & Festive Cultural Week Celebration',
        message: 'Dear Parents, we are organizing a festive cultural week with traditional dress, diya painting, and sweet distribution from next Monday.',
        content: 'Dear Parents, we are organizing a festive cultural week with traditional dress, diya painting, and sweet distribution from next Monday.',
        targetRole: 'All',
        priority: 'High',
        isPinned: true,
        createdBy: adminUser1._id,
        author: adminUser1._id,
        status: 'Published',
        publishedAt: new Date(),
      },
      {
        title: 'Monthly Parent-Teacher Interaction (PTM) Schedule',
        message: 'Individual 1-on-1 development meetings between parents and class teachers are scheduled this Saturday from 9:00 AM to 1:00 PM.',
        content: 'Individual 1-on-1 development meetings between parents and class teachers are scheduled this Saturday from 9:00 AM to 1:00 PM.',
        targetRole: 'Parent',
        priority: 'Normal',
        isPinned: false,
        createdBy: adminUser1._id,
        author: adminUser1._id,
        status: 'Published',
        publishedAt: new Date(),
      },
      {
        title: 'Annual Health, Vision & Dental Checkup Camp',
        message: 'Dr. Rohit Deshmukh and visiting pediatric dentists will conduct a free developmental health inspection for all students on Thursday.',
        content: 'Dr. Rohit Deshmukh and visiting pediatric dentists will conduct a free developmental health inspection for all students on Thursday.',
        targetRole: 'All',
        priority: 'Normal',
        isPinned: false,
        createdBy: adminUser1._id,
        author: adminUser1._id,
        status: 'Published',
        publishedAt: new Date(),
      },
    ]);

    const eventDate1 = new Date();
    eventDate1.setDate(eventDate1.getDate() + 5);
    const eventDate2 = new Date();
    eventDate2.setDate(eventDate2.getDate() + 12);
    const eventDate3 = new Date();
    eventDate3.setDate(eventDate3.getDate() + 20);

    await Event.create([
      {
        title: 'Pre-School Annual Sports & Activity Day',
        description: 'Exciting obstacle courses, lemon-and-spoon races, and parent-child fun runs at the sports ground.',
        date: eventDate1,
        startTime: '09:00',
        endTime: '12:30',
        location: 'School Play Arena & Green Turf',
        targetAudience: 'All',
        category: 'Sports',
        status: 'Upcoming',
        createdBy: adminUser1._id,
      },
      {
        title: 'Clay Art & Creative Craft Exhibition',
        description: 'Showcasing wonderful clay sculptures, thumb paintings, and paper craft prepared by our young learners.',
        date: eventDate2,
        startTime: '10:00',
        endTime: '13:00',
        location: 'School Exhibition Hall',
        targetAudience: 'Parent',
        category: 'Cultural',
        status: 'Upcoming',
        createdBy: adminUser1._id,
      },
      {
        title: 'Children’s Day Joy & Science Wonder Fair',
        description: 'Interactive sensory booths, bubble shows, magic numbers, and fun story puppets for all students.',
        date: eventDate3,
        startTime: '09:30',
        endTime: '12:00',
        location: 'Auditorium',
        targetAudience: 'Student',
        category: 'Cultural',
        status: 'Upcoming',
        createdBy: adminUser1._id,
      },
    ]);

    console.log('--- Database Seeding Completed Successfully ---');
    console.log('Demo Login Accounts:');
    console.log('Admin:   admin@preschool.demo / Admin@123 (or admin@preschool.com)');
    console.log('Teacher: sneha.teacher@preschool.demo / Teacher@123 (or teacher@preschool.com)');
    console.log('Parent:  rahul.parent@preschool.demo / Parent@123 (or parent@preschool.com)');
    return true;
  } catch (error) {
    console.error('Database seeding failed with error:', error);
    throw error;
  }
};

// Execute if run directly
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedData;
