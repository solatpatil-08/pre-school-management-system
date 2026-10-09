const Student = require('../models/Student');
const Parent = require('../models/Parent');
const User = require('../models/User');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');
const ApiError = require('../utils/apiError');

class StudentService {
  /**
   * Get all students with pagination, search, filtering, and role-based scoping
   * @param {Object} user - The authenticated req.user
   * @param {Object} query - Express req.query parameters
   */
  async getAllStudents(user, query = {}) {
    const {
      classId,
      class: classParam,
      status,
      gender,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter = {};
    const andConditions = [];

    // 1. Role-Based Scoping
    if (user && user.role) {
      const role = user.role.toLowerCase();

      if (role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        if (!teacher) {
          return {
            students: [],
            total: 0,
            page: Number(page),
            currentPage: Number(page),
            pages: 0,
            totalPages: 0,
            limit: Number(limit),
          };
        }

        const assignedClasses = (teacher.assignedClasses || []).map(String);
        const leadClasses = (await Class.find({ teacher: teacher._id }).distinct('_id')).map(String);
        const teacherClassIds = [...new Set([...assignedClasses, ...leadClasses])];

        if (teacherClassIds.length === 0) {
          return {
            students: [],
            total: 0,
            page: Number(page),
            currentPage: Number(page),
            pages: 0,
            totalPages: 0,
            limit: Number(limit),
          };
        }

        // Restrict to teacher's classes
        andConditions.push({ class: { $in: teacherClassIds } });
      } else if (role === 'parent') {
        const parent = await Parent.findOne({ user: user._id });
        if (!parent) {
          return {
            students: [],
            total: 0,
            page: Number(page),
            currentPage: Number(page),
            pages: 0,
            totalPages: 0,
            limit: Number(limit),
          };
        }

        // Restrict to parent's children
        andConditions.push({
          $or: [
            { parent: parent._id },
            { _id: { $in: parent.children || [] } },
          ],
        });
      }
      // 'admin' role has full visibility - no scoping condition needed
    }

    // 2. Class Filtering
    const targetClass = classId || classParam;
    if (targetClass && targetClass !== 'all') {
      andConditions.push({ class: targetClass });
    }

    // 3. Gender Filtering
    if (gender && gender !== 'all') {
      andConditions.push({ gender: { $regex: `^${gender}$`, $options: 'i' } });
    }

    // 4. Status Filtering
    if (status && status !== 'all') {
      andConditions.push({ status: { $regex: `^${status}$`, $options: 'i' } });
    }

    // 5. Search (Student Name, Student ID, Parent Name)
    if (search && search.trim() !== '') {
      const trimmed = search.trim();
      const searchRegex = { $regex: trimmed, $options: 'i' };

      // Subquery: Find parents whose names match the search term
      const matchedParents = await Parent.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      }).select('_id');
      const parentIds = matchedParents.map((p) => p._id);

      // Support multi-word searches (e.g., "John Doe")
      const nameParts = trimmed.split(/\s+/);
      let parentIdsFromFullName = [];
      if (nameParts.length > 1) {
        const matchedParentsFullName = await Parent.find({
          $and: [
            { firstName: { $regex: nameParts[0], $options: 'i' } },
            { lastName: { $regex: nameParts.slice(1).join(' '), $options: 'i' } },
          ],
        }).select('_id');
        parentIdsFromFullName = matchedParentsFullName.map((p) => p._id);
      }

      const allMatchedParentIds = [
        ...new Set([...parentIds.map(String), ...parentIdsFromFullName.map(String)]),
      ];

      const searchOr = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { studentId: searchRegex },
      ];

      if (allMatchedParentIds.length > 0) {
        searchOr.push({ parent: { $in: allMatchedParentIds } });
      }

      if (nameParts.length > 1) {
        searchOr.push({
          $and: [
            { firstName: { $regex: nameParts[0], $options: 'i' } },
            { lastName: { $regex: nameParts.slice(1).join(' '), $options: 'i' } },
          ],
        });
      }

      andConditions.push({ $or: searchOr });
    }

    // Construct final filter query
    const finalFilter = andConditions.length > 0 ? { $and: andConditions } : filter;

    // 6. Sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection =
      sortOrder === 'asc' || sortOrder === '1' || sortOrder === 1 ? 1 : -1;
    const sortOption = { [sortField]: sortDirection };

    // 7. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // 8. Execute Database Query
    const [students, total] = await Promise.all([
      Student.find(finalFilter)
        .populate('class', 'name section roomNumber capacity')
        .populate('parent', 'firstName lastName phone email relationship')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Student.countDocuments(finalFilter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    // Fetch fee statuses for students
    const studentIds = students.map((s) => s._id);
    const feesList = await Fee.find({ student: { $in: studentIds } }).sort({ createdAt: -1 });

    const studentsWithFees = students.map((s) => {
      const sObj = s.toObject();
      const studentFees = feesList.filter((f) => String(f.student) === String(s._id));
      sObj.fees = studentFees;
      const latestFee = studentFees[0];
      if (latestFee) {
        sObj.feeStatus = latestFee.status;
        sObj.feePending = latestFee.remainingAmount;
        sObj.feeTotal = latestFee.amount || latestFee.totalPayableFees;
        sObj.feePaid = latestFee.paidAmount;
      } else {
        sObj.feeStatus = 'NONE';
        sObj.feePending = 0;
        sObj.feeTotal = 0;
        sObj.feePaid = 0;
      }
      return sObj;
    });

    return {
      students: studentsWithFees,
      total,
      currentPage: pageNum,
      page: pageNum,
      totalPages,
      pages: totalPages,
      limit: limitNum,
    };
  }

  /**
   * Get student details by ID with role-based permission verification
   * @param {string} id - Student document ID
   * @param {Object} user - The authenticated req.user
   */
  async getStudentById(id, user) {
    const student = await Student.findById(id)
      .populate('class')
      .populate('parent');

    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }

    // Role-based access verification
    if (user && user.role) {
      const role = user.role.toLowerCase();

      if (role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        if (!teacher) {
          throw ApiError.forbidden('You are not authorized to view this student');
        }
        const leadClasses = (await Class.find({ teacher: teacher._id }).distinct('_id')).map(String);
        const assignedClasses = [
          ...(teacher.assignedClasses || []).map(String),
          ...leadClasses,
        ];
        const studentClassId = student.class?._id
          ? String(student.class._id)
          : String(student.class);

        if (!assignedClasses.includes(studentClassId)) {
          throw ApiError.forbidden('You are not assigned to this student\'s class');
        }
      } else if (role === 'parent') {
        const parent = await Parent.findOne({ user: user._id });
        if (!parent) {
          throw ApiError.forbidden('You are not authorized to view this student');
        }

        const isLinkedParent =
          student.parent &&
          String(student.parent._id || student.parent) === String(parent._id);
        const isChildInList = (parent.children || []).some(
          (cId) => String(cId) === String(student._id)
        );

        if (!isLinkedParent && !isChildInList) {
          throw ApiError.forbidden('You can only view records for your own child');
        }
      }
    }

    const fees = await Fee.find({ student: id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ student: id }).sort({ paymentDate: -1 });

    const studentObj = student.toObject();
    studentObj.fees = fees;
    studentObj.payments = payments;

    return studentObj;
  }

  /**
   * Register a new student (Admin only)
   * Automatically handles Parent account creation and Fee allocation
   * @param {Object} studentData
   */
  async createStudent(studentData) {
    // 1. Verify class exists
    const classExists = await Class.findById(studentData.class);
    if (!classExists) {
      throw ApiError.badRequest('Assigned class does not exist');
    }

    // 2. Generate or verify unique studentId
    if (!studentData.studentId || studentData.studentId.trim() === '') {
      const setting = await Setting.findOne();
      const prefix = setting?.admissionPrefix || 'SKA-';
      const year = new Date().getFullYear();
      const count = await Student.countDocuments();
      const seq = String(count + 1).padStart(3, '0');
      studentData.studentId = `${prefix}${year}-${seq}`;
    } else {
      const existingId = await Student.findOne({ studentId: studentData.studentId });
      if (existingId) {
        throw ApiError.conflict(`Student ID '${studentData.studentId}' already exists`);
      }
    }

    // 3. Process Parent / Guardian Information (No dropdown needed - create/link dynamically)
    let parentId = studentData.parent;
    let parentData = studentData.parentData || studentData.parentInfo;
    if (!parentData && (studentData.fatherInfo || studentData.motherInfo || studentData.guardianInfo)) {
      parentData = {
        fatherName: studentData.fatherInfo?.name,
        fatherPhone: studentData.fatherInfo?.phone,
        fatherEmail: studentData.fatherInfo?.email,
        fatherOccupation: studentData.fatherInfo?.occupation,
        fatherAddress: studentData.fatherInfo?.address,
        fatherCity: studentData.fatherInfo?.city,
        fatherState: studentData.fatherInfo?.state,
        fatherPincode: studentData.fatherInfo?.pincode,
        fatherProfilePhoto: studentData.fatherInfo?.profilePhoto,
        motherName: studentData.motherInfo?.name,
        motherPhone: studentData.motherInfo?.phone,
        motherEmail: studentData.motherInfo?.email,
        motherOccupation: studentData.motherInfo?.occupation,
        motherAddress: studentData.motherInfo?.address,
        guardianName: studentData.guardianInfo?.name,
        guardianRelationship: studentData.guardianInfo?.relationship,
        guardianPhone: studentData.guardianInfo?.phone,
        guardianEmail: studentData.guardianInfo?.email,
        password: studentData.fatherInfo?.password || studentData.parentPassword,
      };
    }

    if (parentData && (parentData.fatherName || parentData.motherName || parentData.guardianName || parentData.fullName || parentData.name || parentData.email || parentData.phone)) {
      const primaryName = (parentData.fatherName || parentData.fullName || parentData.name || parentData.motherName || parentData.guardianName || 'Parent').trim();
      const primaryEmail = (parentData.fatherEmail || parentData.email || parentData.motherEmail || parentData.guardianEmail || '').trim().toLowerCase();
      const primaryPhone = (parentData.fatherPhone || parentData.phone || parentData.motherPhone || parentData.guardianPhone || '').trim();
      const primaryOccupation = (parentData.fatherOccupation || parentData.occupation || parentData.motherOccupation || '').trim();
      const primaryAddress = (parentData.fatherAddress || parentData.address || parentData.motherAddress || studentData.address || '').trim();
      const primaryCity = parentData.fatherCity || parentData.city || studentData.city || 'Pune';
      const primaryState = parentData.fatherState || parentData.state || studentData.state || 'Maharashtra';
      const primaryPincode = parentData.fatherPincode || parentData.pincode || studentData.pincode || '';
      const primaryAadhaar = parentData.fatherAadhaar || parentData.aadhaarNumber || studentData.aadhaarNumber || '';
      const primaryAvatar = parentData.fatherProfilePhoto || parentData.profilePhoto || parentData.avatar || '';

      const nameParts = primaryName.split(/\s+/);
      const firstName = nameParts[0] || 'Parent';
      const lastName = nameParts.slice(1).join(' ') || 'Guardian';

      // Check if parent user already exists by email or phone to prevent duplicate accounts
      let user = null;
      if (primaryEmail) {
        user = await User.findOne({ email: primaryEmail });
      }
      if (!user && primaryPhone) {
        user = await User.findOne({ phone: primaryPhone, role: 'parent' });
      }

      if (!user) {
        const loginEmail = primaryEmail || `parent.${Date.now()}@preschool.demo`;
        const loginPassword = parentData.password || (primaryPhone ? `Parent@${primaryPhone.slice(-4)}` : 'Parent@123');
        user = await User.create({
          name: `${firstName} ${lastName}`,
          email: loginEmail,
          password: loginPassword,
          role: 'parent',
          phone: primaryPhone,
          avatar: primaryAvatar,
        });
      }

      let parentDoc = await Parent.findOne({
        $or: [{ user: user._id }, ...(primaryEmail ? [{ email: primaryEmail }] : [])],
      });

      const motherInfo = {
        name: parentData.motherName || '',
        phone: parentData.motherPhone || '',
        email: parentData.motherEmail || '',
        occupation: parentData.motherOccupation || '',
        address: parentData.motherAddress || primaryAddress,
        city: parentData.motherCity || primaryCity,
        state: parentData.motherState || primaryState,
        pincode: parentData.motherPincode || primaryPincode,
        profilePhoto: parentData.motherProfilePhoto || '',
      };

      const guardianInfo = {
        name: parentData.guardianName || '',
        relationship: parentData.guardianRelationship || 'Guardian',
        phone: parentData.guardianPhone || '',
        email: parentData.guardianEmail || '',
        address: parentData.guardianAddress || primaryAddress,
      };

      if (!parentDoc) {
        parentDoc = await Parent.create({
          user: user._id,
          firstName,
          lastName,
          email: user.email,
          phone: primaryPhone || user.phone || '9800000000',
          relationship: parentData.fatherName ? 'Father' : parentData.motherName ? 'Mother' : 'Guardian',
          occupation: primaryOccupation,
          address: primaryAddress,
          city: primaryCity,
          state: primaryState,
          pincode: primaryPincode,
          aadhaarNumber: primaryAadhaar,
          profilePhoto: primaryAvatar,
          motherInfo,
          guardianInfo,
          children: [],
        });
      } else {
        if (parentData.motherName && !parentDoc.motherInfo?.name) {
          parentDoc.motherInfo = motherInfo;
        }
        if (parentData.guardianName && !parentDoc.guardianInfo?.name) {
          parentDoc.guardianInfo = guardianInfo;
        }
        await parentDoc.save();
      }

      parentId = parentDoc._id;
      studentData.parent = parentId;
    }

    // 4. Create student record
    const student = await Student.create(studentData);

    // 5. Link student in Parent children list
    if (studentData.parent) {
      await Parent.findByIdAndUpdate(studentData.parent, {
        $addToSet: { children: student._id },
      });
    }

    // 6. Process Fee Information if provided
    const feeData = studentData.feeData || studentData.feeInfo || studentData.fee;
    if (feeData) {
      const admissionFees = Math.max(0, Number(feeData.admissionFees) || 0);
      const tuitionFees = Math.max(0, Number(feeData.tuitionFees) || 0);
      const otherFees = Math.max(0, Number(feeData.otherFees) || 0);
      const annualFees = Math.max(0, Number(feeData.annualFees) || (admissionFees + tuitionFees + otherFees));

      let totalPayableFees = Number(feeData.totalPayableFees);
      if (isNaN(totalPayableFees) || totalPayableFees <= 0) {
        totalPayableFees = annualFees > 0 ? annualFees : (admissionFees + tuitionFees + otherFees);
      }
      totalPayableFees = Math.max(0, totalPayableFees);

      let amountPaid = Math.max(0, Number(feeData.amountPaid !== undefined ? feeData.amountPaid : feeData.paidAmount) || 0);
      if (amountPaid > totalPayableFees && totalPayableFees > 0) {
        amountPaid = totalPayableFees;
      }

      const remainingAmount = Math.max(0, totalPayableFees - amountPaid);
      let status = 'PENDING';
      if (amountPaid >= totalPayableFees && totalPayableFees > 0) {
        status = 'PAID';
      } else if (amountPaid > 0) {
        status = 'PARTIAL';
      }

      const dueDate = feeData.nextPaymentDueDate || feeData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const paymentDate = feeData.paymentDate || new Date();
      const paymentMode = feeData.paymentMode || 'Cash';
      const receiptNumber = feeData.receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const transactionId = feeData.transactionId || (paymentMode !== 'Cash' ? `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}` : '');
      const remarks = feeData.remarks || feeData.description || 'Initial Enrollment Fees';

      const createdFee = await Fee.create({
        student: student._id,
        feeType: 'Admission & Tuition',
        title: `Annual Course & Admission Fees - ${student.firstName} ${student.lastName}`,
        amount: totalPayableFees,
        annualFees,
        admissionFees,
        tuitionFees,
        otherFees,
        totalPayableFees,
        paidAmount: amountPaid,
        remainingAmount,
        dueDate,
        nextPaymentDueDate: feeData.nextPaymentDueDate || (remainingAmount > 0 ? dueDate : null),
        paymentDate,
        paymentMode,
        receiptNumber,
        transactionId,
        remarks,
        status,
        academicYear: studentData.academicYear || '2026-2027',
        description: `Enrollment Fee Breakdown: Admission ₹${admissionFees}, Tuition ₹${tuitionFees}, Other ₹${otherFees}.`,
      });

      if (amountPaid > 0) {
        await Payment.create({
          student: student._id,
          fee: createdFee._id,
          amount: amountPaid,
          paymentDate,
          paymentMethod: paymentMode,
          receiptNumber,
          transactionId: transactionId || `TXN-${Date.now()}`,
          notes: remarks,
        });
      }
    }

    const populatedStudent = await Student.findById(student._id).populate(['class', 'parent']);
    const fees = await Fee.find({ student: student._id });
    const studentObj = populatedStudent.toObject();
    studentObj.fees = fees;
    return studentObj;
  }

  /**
   * Update student details (Admin only)
   * @param {string} id
   * @param {Object} updateData
   */
  async updateStudent(id, updateData) {
    const student = await Student.findById(id);
    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }

    // Check class existence if changed
    if (updateData.class && String(updateData.class) !== String(student.class)) {
      const classExists = await Class.findById(updateData.class);
      if (!classExists) {
        throw ApiError.badRequest('Assigned class does not exist');
      }
    }

    // Check studentId uniqueness if changed
    if (updateData.studentId && updateData.studentId !== student.studentId) {
      const existing = await Student.findOne({ studentId: updateData.studentId });
      if (existing) {
        throw ApiError.conflict(`Student ID '${updateData.studentId}' already in use`);
      }
    }

    // Handle parent relationship changes
    if (
      updateData.parent !== undefined &&
      String(updateData.parent || '') !== String(student.parent || '')
    ) {
      if (student.parent) {
        await Parent.findByIdAndUpdate(student.parent, {
          $pull: { children: student._id },
        });
      }
      if (updateData.parent) {
        await Parent.findByIdAndUpdate(updateData.parent, {
          $addToSet: { children: student._id },
        });
      }
    }

    // Update parent record details if parentData provided
    const parentData = updateData.parentData || updateData.parentInfo;
    if (parentData && student.parent) {
      const parentDoc = await Parent.findById(student.parent);
      if (parentDoc) {
        if (parentData.fatherName) {
          const parts = parentData.fatherName.trim().split(/\s+/);
          parentDoc.firstName = parts[0] || parentDoc.firstName;
          parentDoc.lastName = parts.slice(1).join(' ') || parentDoc.lastName;
        }
        if (parentData.fatherPhone) parentDoc.phone = parentData.fatherPhone.trim();
        if (parentData.fatherEmail) parentDoc.email = parentData.fatherEmail.trim().toLowerCase();
        if (parentData.fatherOccupation) parentDoc.occupation = parentData.fatherOccupation.trim();
        if (parentData.fatherAddress) parentDoc.address = parentData.fatherAddress.trim();
        if (parentData.fatherCity) parentDoc.city = parentData.fatherCity.trim();
        if (parentData.fatherState) parentDoc.state = parentData.fatherState.trim();
        if (parentData.fatherPincode) parentDoc.pincode = parentData.fatherPincode.trim();

        if (parentData.motherName || parentData.motherPhone || parentData.motherEmail) {
          parentDoc.motherInfo = {
            ...(parentDoc.motherInfo || {}),
            name: parentData.motherName || parentDoc.motherInfo?.name || '',
            phone: parentData.motherPhone || parentDoc.motherInfo?.phone || '',
            email: parentData.motherEmail || parentDoc.motherInfo?.email || '',
            occupation: parentData.motherOccupation || parentDoc.motherInfo?.occupation || '',
            address: parentData.motherAddress || parentDoc.address || '',
            city: parentData.motherCity || parentDoc.city || 'Pune',
            state: parentData.motherState || parentDoc.state || 'Maharashtra',
            pincode: parentData.motherPincode || parentDoc.pincode || '',
          };
        }

        if (parentData.guardianName || parentData.guardianPhone) {
          parentDoc.guardianInfo = {
            ...(parentDoc.guardianInfo || {}),
            name: parentData.guardianName || parentDoc.guardianInfo?.name || '',
            relationship: parentData.guardianRelationship || parentDoc.guardianInfo?.relationship || 'Guardian',
            phone: parentData.guardianPhone || parentDoc.guardianInfo?.phone || '',
            email: parentData.guardianEmail || parentDoc.guardianInfo?.email || '',
            address: parentData.guardianAddress || parentDoc.address || '',
          };
        }

        await parentDoc.save();

        // Also update linked user email/name if exists
        if (parentDoc.user) {
          await User.findByIdAndUpdate(parentDoc.user, {
            name: `${parentDoc.firstName} ${parentDoc.lastName}`,
            email: parentDoc.email,
            phone: parentDoc.phone,
          });
        }
      }
    }

    // Update fee record details if feeData provided
    const feeData = updateData.feeData || updateData.feeInfo;
    if (feeData) {
      const annualFees = Math.max(0, Number(feeData.annualFees) || 0);
      const admissionFees = Math.max(0, Number(feeData.admissionFees) || 0);
      const tuitionFees = Math.max(0, Number(feeData.tuitionFees) || 0);
      const otherFees = Math.max(0, Number(feeData.otherFees) || 0);
      let totalPayableFees = Number(feeData.totalPayableFees);
      if (isNaN(totalPayableFees) || totalPayableFees <= 0) {
        totalPayableFees = admissionFees + tuitionFees + otherFees + annualFees;
      }
      let amountPaid = Math.max(0, Number(feeData.amountPaid !== undefined ? feeData.amountPaid : feeData.paidAmount) || 0);
      if (amountPaid > totalPayableFees && totalPayableFees > 0) amountPaid = totalPayableFees;
      const remainingAmount = Math.max(0, totalPayableFees - amountPaid);

      let status = 'PENDING';
      if (amountPaid >= totalPayableFees && totalPayableFees > 0) status = 'PAID';
      else if (amountPaid > 0) status = 'PARTIAL';

      let existingFee = await Fee.findOne({ student: student._id }).sort({ createdAt: -1 });
      if (existingFee) {
        existingFee.annualFees = annualFees;
        existingFee.admissionFees = admissionFees;
        existingFee.tuitionFees = tuitionFees;
        existingFee.otherFees = otherFees;
        existingFee.totalPayableFees = totalPayableFees;
        existingFee.amount = totalPayableFees;
        existingFee.paidAmount = amountPaid;
        existingFee.remainingAmount = remainingAmount;
        existingFee.status = status;
        if (feeData.paymentMode) existingFee.paymentMode = feeData.paymentMode;
        if (feeData.receiptNumber) existingFee.receiptNumber = feeData.receiptNumber;
        if (feeData.transactionId) existingFee.transactionId = feeData.transactionId;
        if (feeData.nextPaymentDueDate) existingFee.nextPaymentDueDate = feeData.nextPaymentDueDate;
        if (feeData.remarks) existingFee.remarks = feeData.remarks;
        await existingFee.save();
      } else if (totalPayableFees > 0) {
        await Fee.create({
          student: student._id,
          feeType: 'Admission & Tuition',
          title: `Annual Course & Admission Fees - ${student.firstName} ${student.lastName}`,
          amount: totalPayableFees,
          annualFees,
          admissionFees,
          tuitionFees,
          otherFees,
          totalPayableFees,
          paidAmount,
          remainingAmount,
          status,
          dueDate: feeData.nextPaymentDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextPaymentDueDate: feeData.nextPaymentDueDate || null,
          paymentDate: feeData.paymentDate || new Date(),
          paymentMode: feeData.paymentMode || 'Cash',
          receiptNumber: feeData.receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          transactionId: feeData.transactionId || '',
          remarks: feeData.remarks || 'Enrollment Fees',
        });
      }
    }

    // Clean payload of nested sub-objects before updating Student doc
    const cleanStudentData = { ...updateData };
    delete cleanStudentData.parentData;
    delete cleanStudentData.parentInfo;
    delete cleanStudentData.feeData;
    delete cleanStudentData.feeInfo;
    delete cleanStudentData.fatherInfo;
    delete cleanStudentData.motherInfo;
    delete cleanStudentData.guardianInfo;

    Object.assign(student, cleanStudentData);
    await student.save();

    return await student.populate(['class', 'parent']);
  }

  /**
   * Delete student (Admin only)
   * @param {string} id
   */
  async deleteStudent(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }

    // Remove from linked parent
    if (student.parent) {
      await Parent.findByIdAndUpdate(student.parent, {
        $pull: { children: student._id },
      });
    }

    await Student.findByIdAndDelete(id);
    return { message: 'Student removed successfully' };
  }

  /**
   * Get students belonging to a specific class
   * @param {string} classId
   * @param {Object} user
   */
  async getStudentsByClass(classId, user) {
    const classExists = await Class.findById(classId);
    if (!classExists) {
      throw ApiError.notFound('Class not found');
    }

    if (user && user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user._id });
      if (!teacher) {
        throw ApiError.forbidden('You are not authorized to view students of this class');
      }
      const leadClasses = (await Class.find({ teacher: teacher._id }).distinct('_id')).map(String);
      const assigned = [
        ...(teacher.assignedClasses || []).map(String),
        ...leadClasses,
      ];
      if (!assigned.includes(String(classId))) {
        throw ApiError.forbidden('You are not assigned to this class');
      }
    }

    const students = await Student.find({ class: classId })
      .populate('parent', 'firstName lastName phone email relationship')
      .sort({ firstName: 1, lastName: 1 });

    return students;
  }
}

module.exports = new StudentService();
