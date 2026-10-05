const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');

class ReportService {
  /**
   * Executive school summary report
   */
  async getSummaryReport() {
    const [totalStudents, totalClasses, activeFees, payments] = await Promise.all([
      Student.find({ status: 'Active' }).populate('class', 'name'),
      Class.find({ status: 'Active' }),
      Fee.find(),
      Payment.find(),
    ]);

    // Gender breakdown
    const genderStats = { Male: 0, Female: 0, Other: 0 };
    totalStudents.forEach((st) => {
      if (genderStats[st.gender] !== undefined) genderStats[st.gender]++;
      else genderStats.Other++;
    });

    // Class distribution
    const classDistribution = {};
    totalStudents.forEach((st) => {
      const className = st.class?.name || 'Unassigned';
      classDistribution[className] = (classDistribution[className] || 0) + 1;
    });

    // Financial totals
    const totalRevenueExpected = activeFees.reduce(
      (acc, f) => acc + (f.amount !== undefined ? f.amount : (f.totalAmount || 0)),
      0
    );
    const totalRevenueCollected = activeFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const totalOutstanding = Math.max(0, totalRevenueExpected - totalRevenueCollected);

    return {
      overview: {
        totalStudentsCount: totalStudents.length,
        totalClassesCount: totalClasses.length,
        totalPaymentsRecorded: payments.length,
      },
      genderStats,
      classDistribution,
      financials: {
        expected: totalRevenueExpected,
        collected: totalRevenueCollected,
        outstanding: totalOutstanding,
        collectionRate:
          totalRevenueExpected > 0
            ? Math.round((totalRevenueCollected / totalRevenueExpected) * 100)
            : 0,
      },
    };
  }

  /**
   * Attendance analytics report
   */
  async getAttendanceReport(query = {}) {
    const { days = 30 } = query;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - Number(days));

    const [records, classes] = await Promise.all([
      Attendance.find({ date: { $gte: pastDate } }).populate('class', 'name section'),
      Class.find({ status: 'Active' }),
    ]);

    const statusBreakdown = { Present: 0, Late: 0, Absent: 0, Leave: 0 };
    const classMap = {};

    classes.forEach((c) => {
      classMap[c._id.toString()] = {
        className: `${c.name} (${c.section || 'A'})`,
        Present: 0,
        Late: 0,
        Absent: 0,
        Leave: 0,
        total: 0,
      };
    });

    const dailyMap = {};

    records.forEach((r) => {
      const st = r.status || 'Present';
      if (statusBreakdown[st] !== undefined) {
        statusBreakdown[st]++;
      }

      // Class breakdown
      const cId = r.class?._id?.toString() || r.class?.toString();
      if (cId && classMap[cId]) {
        classMap[cId].total++;
        if (classMap[cId][st] !== undefined) classMap[cId][st]++;
      }

      // Daily trends
      if (!dailyMap[r.dateString]) {
        dailyMap[r.dateString] = { date: r.dateString, present: 0, absent: 0, late: 0, leave: 0, total: 0 };
      }
      dailyMap[r.dateString].total++;
      if (r.status === 'Present') dailyMap[r.dateString].present++;
      else if (r.status === 'Absent') dailyMap[r.dateString].absent++;
      else if (r.status === 'Late') dailyMap[r.dateString].late++;
      else if (r.status === 'Leave') dailyMap[r.dateString].leave++;
    });

    const totalRecords = records.length;
    const attended = statusBreakdown.Present + statusBreakdown.Late;
    const overallRate = totalRecords > 0 ? Math.round((attended / totalRecords) * 100) : 0;

    const classStats = Object.values(classMap).map((c) => {
      const classAttended = c.Present + c.Late;
      const rate = c.total > 0 ? Math.round((classAttended / c.total) * 100) : 0;
      return {
        ...c,
        rate,
      };
    });

    const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      overallRate,
      statusBreakdown,
      classStats,
      dailyTrends,
      totalRecordsAnalyzed: totalRecords,
      timeframeDays: Number(days),
    };
  }

  /**
   * Financial fee and revenue collection report
   */
  async getFeeReport(_query = {}) {
    const fees = await Fee.find().populate('student', 'firstName lastName studentId class');

    const categoryMap = {};
    let totalBilled = 0;
    let totalCollected = 0;

    fees.forEach((f) => {
      const billed = Number(f.amount !== undefined ? f.amount : f.totalAmount) || 0;
      const collected = Number(f.paidAmount) || 0;
      const pending = Math.max(0, billed - collected);

      totalBilled += billed;
      totalCollected += collected;

      const type = f.feeType || 'Tuition Fee';
      if (!categoryMap[type]) {
        categoryMap[type] = { type, count: 0, billed: 0, collected: 0, pending: 0 };
      }
      categoryMap[type].count++;
      categoryMap[type].billed += billed;
      categoryMap[type].collected += collected;
      categoryMap[type].pending += pending;
    });

    const pendingBalance = Math.max(0, totalBilled - totalCollected);
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    const feeTypeBreakdown = Object.values(categoryMap);

    return {
      summary: {
        totalBilled,
        totalCollected,
        pendingBalance,
        collectionRate,
        totalExpected: totalBilled,
        outstanding: pendingBalance,
        totalInvoices: fees.length,
      },
      feeTypeBreakdown,
      categoryBreakdown: categoryMap,
    };
  }

  /**
   * Student enrollment and classroom capacity report
   */
  async getEnrollmentReport() {
    const [students, classes] = await Promise.all([
      Student.find().populate('class', 'name section roomNumber capacity'),
      Class.find({ status: 'Active' }),
    ]);

    const total = students.length;
    let active = 0;
    let graduated = 0;
    const genderBreakdown = { Male: 0, Female: 0, Other: 0 };

    const classCountMap = {};
    classes.forEach((c) => {
      classCountMap[c._id.toString()] = {
        id: c._id,
        name: c.name,
        section: c.section,
        room: c.roomNumber || 'Main Campus',
        capacity: c.capacity || 20,
        enrolled: 0,
        occupancyRate: 0,
      };
    });

    students.forEach((st) => {
      if (st.status === 'Active') active++;
      else if (st.status === 'Graduated') graduated++;

      if (genderBreakdown[st.gender] !== undefined) genderBreakdown[st.gender]++;
      else genderBreakdown.Other++;

      const cId = st.class?._id?.toString() || st.class?.toString();
      if (cId && classCountMap[cId]) {
        classCountMap[cId].enrolled++;
      }
    });

    const classEnrollments = Object.values(classCountMap).map((c) => {
      const occupancyRate = c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0;
      return {
        ...c,
        occupancyRate,
      };
    });

    return {
      total,
      active,
      graduated,
      genderBreakdown,
      classEnrollments,
    };
  }
}

module.exports = new ReportService();
