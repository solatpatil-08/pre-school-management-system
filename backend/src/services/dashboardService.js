const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Schedule = require('../models/Schedule');

class DashboardService {
  /**
   * Admin Dashboard Comprehensive KPIs, Charts, and Activity Feed
   */
  async getAdminDashboardStats() {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));

    // 1. Core Counts & Queries
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      fees,
      attendanceToday,
      recentAnnouncements,
      upcomingEvents,
      recentStudents,
      classes,
      recentPayments,
      recentAnnouncementsForFeed,
    ] = await Promise.all([
      Student.countDocuments({ status: 'Active' }),
      Teacher.countDocuments({ status: 'Active' }),
      Parent.countDocuments(),
      Class.countDocuments({ status: 'Active' }),
      Fee.find({ status: { $ne: 'Cancelled' } }).populate('student', 'firstName lastName studentId'),
      Attendance.find({ dateString: todayDateString }),
      Announcement.find()
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .limit(5),
      Event.find({
        $or: [{ date: { $gte: todayMidnight } }, { eventDate: { $gte: todayMidnight } }],
      })
        .sort({ date: 1, eventDate: 1 })
        .limit(5),
      Student.find({ status: 'Active' })
        .populate('class', 'name section')
        .sort({ createdAt: -1 })
        .limit(5),
      Class.find({ status: 'Active' }).sort({ name: 1 }),
      Payment.find()
        .populate('student', 'firstName lastName')
        .sort({ createdAt: -1, paymentDate: -1 })
        .limit(5),
      Announcement.find()
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // 2. Attendance Stats for Today (Case-insensitive)
    const totalMarked = attendanceToday.length;
    const presentToday = attendanceToday.filter((a) =>
      ['PRESENT', 'Present'].includes(a.status)
    ).length;
    const absentToday = attendanceToday.filter((a) =>
      ['ABSENT', 'Absent'].includes(a.status)
    ).length;
    const lateToday = attendanceToday.filter((a) =>
      ['LATE', 'Late'].includes(a.status)
    ).length;
    const leaveToday = attendanceToday.filter((a) =>
      ['LEAVE', 'Leave'].includes(a.status)
    ).length;

    const attendanceRate =
      totalMarked > 0 ? Math.round(((presentToday + lateToday) / totalMarked) * 100) : 0;

    // 3. Financial Metrics (Pending, Overdue, Paid)
    let totalFeesExpected = 0;
    let totalFeesCollected = 0;
    let totalPendingAmount = 0;
    let totalOverdueAmount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    const feeStatusBreakdown = {
      PAID: { count: 0, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      PARTIAL: { count: 0, amount: 0 },
      OVERDUE: { count: 0, amount: 0 },
    };

    fees.forEach((f) => {
      const amount = f.amount !== undefined ? f.amount : (f.totalAmount || 0);
      const paid = f.paidAmount || 0;
      const remaining = f.remainingAmount !== undefined ? f.remainingAmount : Math.max(0, amount - paid);
      const isOverdue =
        ['OVERDUE', 'Overdue'].includes(f.status) ||
        (f.dueDate && new Date(f.dueDate) < todayMidnight && remaining > 0);

      totalFeesExpected += amount;
      totalFeesCollected += paid;

      const normStatus = (f.status || 'PENDING').toUpperCase();
      if (feeStatusBreakdown[normStatus]) {
        feeStatusBreakdown[normStatus].count += 1;
        feeStatusBreakdown[normStatus].amount += amount;
      }

      if (normStatus === 'PAID') {
        paidCount++;
      } else if (isOverdue) {
        overdueCount++;
        totalOverdueAmount += remaining;
      } else {
        pendingCount++;
        totalPendingAmount += remaining;
      }
    });

    const collectionRate =
      totalFeesExpected > 0 ? Math.round((totalFeesCollected / totalFeesExpected) * 100) : 0;

    // 4. CHART 1: Attendance Overview (Last 7 Days)
    const last7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7DateStrings = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7DateStrings.push(dateStr);
      last7Days.push({
        date: dateStr,
        day: dayNames[d.getDay()],
        label: `${dayNames[d.getDay()]} ${d.getDate()}`,
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
        rate: 0,
      });
    }

    const pastWeekAttendance = await Attendance.find({
      dateString: { $in: last7DateStrings },
    });

    pastWeekAttendance.forEach((rec) => {
      const dayObj = last7Days.find((item) => item.date === rec.dateString);
      if (dayObj) {
        dayObj.total += 1;
        const norm = (rec.status || '').toUpperCase();
        if (norm === 'PRESENT') dayObj.present += 1;
        else if (norm === 'ABSENT') dayObj.absent += 1;
        else if (norm === 'LATE') dayObj.late += 1;
      }
    });

    last7Days.forEach((dayObj) => {
      dayObj.rate =
        dayObj.total > 0
          ? Math.round(((dayObj.present + dayObj.late) / dayObj.total) * 100)
          : 0;
    });

    // 5. CHART 2: Student Enrollment Statistics by Class
    const classStudentCounts = await Promise.all(
      classes.map(async (c) => {
        const count = await Student.countDocuments({ class: c._id, status: 'Active' });
        const cap = c.capacity || 20;
        return {
          id: c._id,
          name: c.name,
          section: c.section || 'A',
          capacity: cap,
          count,
          enrolled: count,
          occupancyRate: Math.min(100, Math.round((count / cap) * 100)),
        };
      })
    );

    // 6. CHART 3: Fee Collection Overview
    // Method breakdown from Payment collection
    const paymentMethodStats = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const feeCollectionChart = {
      totalExpected: totalFeesExpected,
      totalCollected: totalFeesCollected,
      totalPending: totalPendingAmount,
      totalOverdue: totalOverdueAmount,
      collectionRate,
      statusBreakdown: feeStatusBreakdown,
      paymentMethods: paymentMethodStats.map((p) => ({
        method: p._id || 'Cash',
        amount: p.totalAmount,
        count: p.count,
      })),
    };

    // 7. Recent Activities Feed (Merged Real MongoDB Data)
    const activities = [];

    // From recent payments
    recentPayments.forEach((p) => {
      activities.push({
        id: `pay-${p._id}`,
        type: 'payment',
        title: 'Fee Payment Received',
        description: `$${p.amount} received via ${p.paymentMethod} for ${
          p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Student'
        }`,
        timestamp: p.createdAt || p.paymentDate,
        timeAgo: p.createdAt,
      });
    });

    // From recent student admissions
    recentStudents.forEach((st) => {
      activities.push({
        id: `adm-${st._id}`,
        type: 'admission',
        title: 'New Student Admission',
        description: `${st.firstName} ${st.lastName} admitted into ${st.class?.name || 'Classroom'}`,
        timestamp: st.createdAt,
        timeAgo: st.createdAt,
      });
    });

    // From recent announcements
    recentAnnouncementsForFeed.forEach((a) => {
      activities.push({
        id: `ann-${a._id}`,
        type: 'announcement',
        title: 'Announcement Broadcasted',
        description: `"${a.title}" posted for ${a.targetRole} (${a.status})`,
        timestamp: a.publishedAt || a.createdAt,
        timeAgo: a.publishedAt || a.createdAt,
      });
    });

    // Sort descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = activities.slice(0, 8);

    // Standardized Payload with all required keys and aliases
    return {
      counts: {
        students: totalStudents,
        teachers: totalTeachers,
        parents: totalParents,
        classes: totalClasses,
      },
      stats: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalClasses,
        attendanceToday: {
          totalMarked,
          present: presentToday,
          absent: absentToday,
          late: lateToday,
          leave: leaveToday,
          rate: attendanceRate,
        },
        financials: {
          totalExpected: totalFeesExpected,
          totalCollected: totalFeesCollected,
          totalPending: totalPendingAmount,
          totalOverdue: totalOverdueAmount,
          pendingFees: totalPendingAmount,
          overdueFees: totalOverdueAmount,
          pendingCount,
          overdueCount,
          paidCount,
          collectionRate,
        },
      },
      attendanceToday: {
        totalMarked,
        present: presentToday,
        absent: absentToday,
        late: lateToday,
        leave: leaveToday,
        rate: attendanceRate,
      },
      financials: {
        totalExpected: totalFeesExpected,
        totalCollected: totalFeesCollected,
        totalPending: totalPendingAmount,
        totalOverdue: totalOverdueAmount,
        pendingFees: totalPendingAmount,
        overdueFees: totalOverdueAmount,
        pendingCount,
        overdueCount,
        paidCount,
        collectionRate,
      },
      charts: {
        attendanceOverview: last7Days,
        studentEnrollment: classStudentCounts,
        feeCollection: feeCollectionChart,
      },
      classDistribution: classStudentCounts,
      recentAnnouncements,
      announcements: recentAnnouncements,
      upcomingEvents,
      events: upcomingEvents,
      recentStudents,
      recentAdmissions: recentStudents,
      recentActivities,
    };
  }

  /**
   * Teacher Dashboard Metrics
   */
  async getTeacherDashboardStats(userId) {
    const teacherDoc = await Teacher.findOne({ user: userId })
      .populate('assignedClasses')
      .populate('user', 'name email avatar');
    if (!teacherDoc) {
      return null;
    }

    const teacher = teacherDoc.toObject();
    teacher.name = teacher.name || `${teacher.firstName} ${teacher.lastName}`;

    const classIds = (teacher.assignedClasses || []).map((c) => c._id);
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayOfWeek = days[today.getDay()];
    const tYear = today.getFullYear();
    const tMonth = String(today.getMonth() + 1).padStart(2, '0');
    const tDay = String(today.getDate()).padStart(2, '0');
    const todayDateString = `${tYear}-${tMonth}-${tDay}`;
    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));

    const [students, todaySchedules, attendanceToday, announcements, events] = await Promise.all([
      Student.find({ class: { $in: classIds }, status: 'Active' })
        .populate('class', 'name section')
        .sort({ firstName: 1 }),
      Schedule.find({ class: { $in: classIds }, dayOfWeek: currentDayOfWeek })
        .populate('class', 'name section roomNumber')
        .sort({ startTime: 1 }),
      Attendance.find({ class: { $in: classIds }, dateString: todayDateString }),
      Announcement.find({ targetRole: { $in: ['All', 'Teacher'] }, status: { $ne: 'Draft' } })
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .limit(5),
      Event.find({
        targetAudience: { $in: ['All', 'Teacher'] },
        $or: [{ date: { $gte: todayMidnight } }, { eventDate: { $gte: todayMidnight } }],
      })
        .sort({ date: 1, eventDate: 1 })
        .limit(5),
    ]);

    const markedCount = attendanceToday.length;
    const present = attendanceToday.filter((a) => ['PRESENT', 'Present'].includes(a.status)).length;
    const absent = attendanceToday.filter((a) => ['ABSENT', 'Absent'].includes(a.status)).length;
    const late = attendanceToday.filter((a) => ['LATE', 'Late'].includes(a.status)).length;
    const leave = attendanceToday.filter((a) => ['LEAVE', 'Leave'].includes(a.status)).length;
    const rate = markedCount > 0 ? Math.round(((present + late) / markedCount) * 100) : 0;

    return {
      teacher,
      teacherInfo: teacher,
      assignedClasses: teacher.assignedClasses,
      totalAssignedStudents: students.length,
      studentsCount: students.length,
      students,
      currentDay: currentDayOfWeek,
      todaySchedule: todaySchedules,
      todaySchedules,
      attendanceToday: {
        totalStudents: students.length,
        markedCount,
        present,
        absent,
        late,
        leave,
        rate,
      },
      todayAttendance: {
        totalStudents: students.length,
        markedCount,
        present,
        absent,
        late,
        leave,
        rate,
      },
      attendanceStats: {
        totalClassStudents: students.length,
        markedCount,
        present,
        absent,
        late,
        leave,
        attendanceRate: rate,
      },
      announcements,
      recentAnnouncements: announcements,
      events,
      upcomingEvents: events,
    };
  }

  /**
   * Parent Dashboard Metrics
   */
  async getParentDashboardStats(userId) {
    const parentDoc = await Parent.findOne({ user: userId })
      .populate('user', 'name email avatar')
      .populate({
        path: 'children',
        populate: { path: 'class', select: 'name section roomNumber teacher' },
      });

    if (!parentDoc || !parentDoc.children || parentDoc.children.length === 0) {
      const parentObj = parentDoc ? parentDoc.toObject() : {};
      if (parentDoc) {
        parentObj.name = parentObj.name || `${parentObj.firstName} ${parentObj.lastName}`;
      }
      return {
        parent: parentObj,
        children: [],
        schedule: [],
        fees: [],
        pendingTotal: 0,
        recentAnnouncements: [],
        announcements: [],
        upcomingEvents: [],
        events: [],
      };
    }

    const parent = parentDoc.toObject();
    parent.name = parent.name || `${parent.firstName} ${parent.lastName}`;

    const childIds = parent.children.map((c) => c._id);
    const classIds = parent.children.map((c) => c.class?._id).filter(Boolean);
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayOfWeek = days[today.getDay()];
    const pYear = today.getFullYear();
    const pMonth = String(today.getMonth() + 1).padStart(2, '0');
    const pDay = String(today.getDate()).padStart(2, '0');
    const todayDateString = `${pYear}-${pMonth}-${pDay}`;
    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));

    const [fees, announcements, events, todayAttendanceRecords, todaySchedules] = await Promise.all([
      Fee.find({ student: { $in: childIds } }).populate('student', 'firstName lastName studentId'),
      Announcement.find({ targetRole: { $in: ['All', 'Parent'] }, status: { $ne: 'Draft' } })
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .limit(5),
      Event.find({
        targetAudience: { $in: ['All', 'Parent', 'Student'] },
        $or: [{ date: { $gte: todayMidnight } }, { eventDate: { $gte: todayMidnight } }],
      })
        .sort({ date: 1, eventDate: 1 })
        .limit(5),
      Attendance.find({ student: { $in: childIds }, dateString: todayDateString }),
      Schedule.find({ class: { $in: classIds }, dayOfWeek: currentDayOfWeek })
        .populate('class', 'name section roomNumber')
        .sort({ startTime: 1 }),
    ]);

    // Calculate total pending fee across children
    let pendingTotal = 0;
    fees.forEach((f) => {
      const amount = f.amount !== undefined ? f.amount : (f.totalAmount || 0);
      const paid = f.paidAmount || 0;
      const remaining = f.remainingAmount !== undefined ? f.remainingAmount : Math.max(0, amount - paid);
      if (['PENDING', 'Pending', 'PARTIAL', 'Partial', 'OVERDUE', 'Overdue'].includes(f.status)) {
        pendingTotal += remaining;
      }
    });

    // Populate each child with today's attendance, historical attendance breakdown, and pending fee
    const childrenWithStats = await Promise.all(
      parent.children.map(async (child) => {
        const attendances = await Attendance.find({ student: child._id }).sort({ date: -1, createdAt: -1 });
        const total = attendances.length;
        const presentDays = attendances.filter((a) =>
          ['PRESENT', 'Present'].includes(a.status)
        ).length;
        const lateDays = attendances.filter((a) =>
          ['LATE', 'Late'].includes(a.status)
        ).length;
        const absentDays = attendances.filter((a) =>
          ['ABSENT', 'Absent'].includes(a.status)
        ).length;
        const leaveDays = attendances.filter((a) =>
          ['LEAVE', 'Leave'].includes(a.status)
        ).length;
        const rate = total > 0 ? Math.round(((presentDays + lateDays) / total) * 100) : 100;

        const recentHistory = attendances.slice(0, 5).map((a) => ({
          dateString: a.dateString,
          status: (a.status || 'PRESENT').toUpperCase(),
          remarks: a.remarks || '',
        }));

        // Today's attendance status
        const todayRec = todayAttendanceRecords.find(
          (a) => a.student?.toString() === child._id.toString()
        );
        let todayStatus = 'Unmarked';
        if (todayRec) {
          const norm = todayRec.status.toUpperCase();
          if (norm === 'PRESENT') todayStatus = 'Present';
          else if (norm === 'ABSENT') todayStatus = 'Absent';
          else if (norm === 'LATE') todayStatus = 'Late';
          else if (norm === 'LEAVE') todayStatus = 'Leave';
        }

        // Child's specific pending fees
        const childFees = fees.filter(
          (f) => f.student?._id?.toString() === child._id.toString()
        );
        const childPendingFee = childFees.reduce((sum, f) => {
          const amount = f.amount !== undefined ? f.amount : (f.totalAmount || 0);
          const paid = f.paidAmount || 0;
          const rem = f.remainingAmount !== undefined ? f.remainingAmount : Math.max(0, amount - paid);
          return ['PENDING', 'Pending', 'PARTIAL', 'Partial', 'OVERDUE', 'Overdue'].includes(f.status)
            ? sum + rem
            : sum;
        }, 0);

        const childObj = typeof child.toObject === 'function' ? child.toObject() : { ...child };
        childObj.name = `${child.firstName} ${child.lastName}`;
        childObj.totalAttendanceDays = total;
        childObj.presentDays = presentDays;
        childObj.lateDays = lateDays;
        childObj.absentDays = absentDays;
        childObj.leaveDays = leaveDays;
        childObj.attendanceRate = rate;
        childObj.todayAttendance = todayStatus;
        childObj.recentAttendance = recentHistory;
        childObj.pendingFee = childPendingFee;
        return childObj;
      })
    );

    return {
      parent,
      children: childrenWithStats,
      currentDay: currentDayOfWeek,
      schedule: todaySchedules,
      todaySchedule: todaySchedules,
      fees,
      pendingTotal,
      announcements,
      recentAnnouncements: announcements,
      events,
      upcomingEvents: events,
    };
  }
}

module.exports = new DashboardService();
