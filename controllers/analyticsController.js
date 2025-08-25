const { User, Doctor, Patient, Appointment, Payment, Invoice } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard-stats
// @access  Private (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Get total counts
    const totalUsers = await User.count();
    const totalDoctors = await Doctor.count();
    const totalPatients = await Patient.count();
    const totalAppointments = await Appointment.count();

    // Get today's appointments
    const todaysAppointments = await Appointment.count({
      where: {
        appointment_date: {
          [Op.eq]: new Date().toISOString().split('T')[0]
        }
      }
    });

    // Get this month's appointments
    const monthlyAppointments = await Appointment.count({
      where: {
        appointment_date: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Get revenue this month
    const monthlyRevenue = await Payment.sum('amount', {
      where: {
        status: 'Completed',
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Get pending payments
    const pendingPayments = await Payment.sum('amount', {
      where: {
        status: 'Pending'
      }
    }) || 0;

    // Get appointment status breakdown
    const appointmentsByStatus = await Appointment.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', 'id'), 'count']
      ],
      group: ['status']
    });

    // Get recent activity (last 10 appointments)
    const recentAppointments = await Appointment.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Patient,
          include: [{
            model: User,
            attributes: ['first_name', 'last_name']
          }],
          attributes: ['id', 'patient_code']
        },
        {
          model: Doctor,
          include: [{
            model: User,
            attributes: ['first_name', 'last_name']
          }],
          attributes: ['id', 'specialization']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDoctors,
          totalPatients,
          totalAppointments,
          todaysAppointments,
          monthlyAppointments,
          monthlyRevenue,
          pendingPayments
        },
        appointmentsByStatus: appointmentsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        recentActivity: recentAppointments.map(apt => ({
          id: apt.id,
          type: 'appointment',
          description: `Appointment with Dr. ${apt.Doctor?.User?.first_name} ${apt.Doctor?.User?.last_name}`,
          patient: `${apt.Patient?.User?.first_name} ${apt.Patient?.User?.last_name}`,
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status,
          created_at: apt.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @desc    Get revenue trends
// @route   GET /api/analytics/revenue-trends
// @access  Private (Admin only)
const getRevenueTrends = asyncHandler(async (req, res) => {
  try {
    const { period = '6months' } = req.query;

    let dateFormat;
    let periods;

    if (period === '12months') {
      dateFormat = '%Y-%m';
      periods = 12;
    } else if (period === '30days') {
      dateFormat = '%Y-%m-%d';
      periods = 30;
    } else {
      dateFormat = '%Y-%m';
      periods = 6;
    }

    const revenueData = await Payment.findAll({
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('created_at'), dateFormat), 'period'],
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'revenue'],
        [require('sequelize').fn('COUNT', 'id'), 'transactions']
      ],
      where: {
        status: 'Completed',
        created_at: {
          [Op.gte]: new Date(Date.now() - periods * (period === '30days' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000))
        }
      },
      group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('created_at'), dateFormat)],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('created_at'), dateFormat), 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        trends: revenueData.map(item => ({
          period: item.dataValues.period,
          revenue: parseFloat(item.dataValues.revenue) || 0,
          transactions: parseInt(item.dataValues.transactions) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Revenue trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends'
    });
  }
});

// @desc    Get appointment trends
// @route   GET /api/analytics/appointment-trends
// @access  Private (Admin only)
const getAppointmentTrends = asyncHandler(async (req, res) => {
  try {
    const { period = '6months' } = req.query;

    let dateFormat;
    let periods;

    if (period === '12months') {
      dateFormat = '%Y-%m';
      periods = 12;
    } else if (period === '30days') {
      dateFormat = '%Y-%m-%d';
      periods = 30;
    } else {
      dateFormat = '%Y-%m';
      periods = 6;
    }

    const appointmentData = await Appointment.findAll({
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('appointment_date'), dateFormat), 'period'],
        [require('sequelize').fn('COUNT', 'id'), 'appointments'],
        'status'
      ],
      where: {
        appointment_date: {
          [Op.gte]: new Date(Date.now() - periods * (period === '30days' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000))
        }
      },
      group: [
        require('sequelize').fn('DATE_FORMAT', require('sequelize').col('appointment_date'), dateFormat),
        'status'
      ],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('appointment_date'), dateFormat), 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        trends: appointmentData.map(item => ({
          period: item.dataValues.period,
          appointments: parseInt(item.dataValues.appointments) || 0,
          status: item.status
        }))
      }
    });
  } catch (error) {
    console.error('Appointment trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment trends'
    });
  }
});

// @desc    Get doctor performance metrics
// @route   GET /api/analytics/doctor-performance
// @access  Private (Admin only)
const getDoctorPerformance = asyncHandler(async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    const startDate = new Date(Date.now() - (period === '30days' ? 30 : 90) * 24 * 60 * 60 * 1000);

    const doctorStats = await Doctor.findAll({
      attributes: [
        'id',
        'specialization'
      ],
      include: [
        {
          model: User,
          attributes: ['first_name', 'last_name']
        },
        {
          model: Appointment,
          attributes: [
            [require('sequelize').fn('COUNT', 'id'), 'total_appointments'],
            [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed_appointments'],
            [require('sequelize').fn('AVG', require('sequelize').literal("CASE WHEN status = 'Completed' THEN duration_minutes ELSE NULL END")), 'avg_duration']
          ],
          where: {
            appointment_date: {
              [Op.gte]: startDate
            }
          }
        }
      ],
      group: ['Doctor.id']
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        doctors: doctorStats.map(doctor => ({
          id: doctor.id,
          name: `${doctor.User?.first_name} ${doctor.User?.last_name}`,
          specialty: doctor.specialization,
          totalAppointments: parseInt(doctor.Appointments[0]?.dataValues.total_appointments) || 0,
          completedAppointments: parseInt(doctor.Appointments[0]?.dataValues.completed_appointments) || 0,
          averageDuration: parseFloat(doctor.Appointments[0]?.dataValues.avg_duration) || 0,
          completionRate: doctor.Appointments[0] ?
            ((parseInt(doctor.Appointments[0].dataValues.completed_appointments) || 0) /
             (parseInt(doctor.Appointments[0].dataValues.total_appointments) || 1)) * 100 : 0
        }))
      }
    });
  } catch (error) {
    console.error('Doctor performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor performance metrics'
    });
  }
});

// @desc    Get patient demographics
// @route   GET /api/analytics/patient-demographics
// @access  Private (Admin only)
const getPatientDemographics = asyncHandler(async (req, res) => {
  try {
    // Age groups - using User table for date_of_birth
    const ageGroups = await Patient.findAll({
      attributes: [
        [require('sequelize').literal(`
          CASE 
            WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) < 18 THEN 'Under 18'
            WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) BETWEEN 18 AND 30 THEN '18-30'
            WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) BETWEEN 31 AND 50 THEN '31-50'
            WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) BETWEEN 51 AND 70 THEN '51-70'
            ELSE 'Over 70'
          END
        `), 'age_group'],
        [require('sequelize').fn('COUNT', 'Patient.id'), 'count']
      ],
      include: [{
        model: User,
        attributes: [],
        where: {
          date_of_birth: {
            [Op.not]: null
          }
        }
      }],
      group: [require('sequelize').literal(`
        CASE 
          WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) < 18 THEN 'Under 18'
          WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) BETWEEN 18 AND 30 THEN '18-30'
          WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) BETWEEN 31 AND 50 THEN '31-50'
          WHEN YEAR(CURDATE()) - YEAR(User.date_of_birth) BETWEEN 51 AND 70 THEN '51-70'
          ELSE 'Over 70'
        END
      `)]
    });

    // Gender distribution - using User table for gender
    const genderDistribution = await Patient.findAll({
      attributes: [
        [require('sequelize').col('User.gender'), 'gender'],
        [require('sequelize').fn('COUNT', 'Patient.id'), 'count']
      ],
      include: [{
        model: User,
        attributes: [],
        where: {
          gender: {
            [Op.not]: null
          }
        }
      }],
      group: ['User.gender']
    });

    // New patients this month
    const newPatientsThisMonth = await Patient.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ageGroups: ageGroups.map(group => ({
          age_group: group.dataValues.age_group,
          count: parseInt(group.dataValues.count)
        })),
        genderDistribution: genderDistribution.map(gender => ({
          gender: gender.dataValues.gender,
          count: parseInt(gender.dataValues.count)
        })),
        newPatientsThisMonth,
        totalPatients: await Patient.count()
      }
    });
  } catch (error) {
    console.error('Patient demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient demographics'
    });
  }
});

// @desc    Get doctor-specific revenue statistics
// @route   GET /api/analytics/revenue-stats
// @access  Private (Doctor/Admin)
const getDoctorRevenueStats = asyncHandler(async (req, res) => {
  try {
    const { doctor_id } = req.query;
    const userRole = req.user.role;

    // If user is a doctor, they can only access their own data
    let targetDoctorId = doctor_id;
    if (userRole === 'Doctor') {
      targetDoctorId = req.user.doctor_id || req.user.id;
    }

    if (!targetDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get total earnings for this doctor through Invoice -> Appointment relationship
    const totalEarnings = await Payment.sum('amount', {
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed'
      }
    }) || 0;

    // Get this month's earnings
    const thisMonthEarnings = await Payment.sum('amount', {
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed',
        payment_date: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Get pending payments
    const pendingPayments = await Payment.sum('amount', {
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Pending'
      }
    }) || 0;

    // Get total consultations
    const totalConsultations = await Appointment.count({
      where: {
        doctor_id: targetDoctorId,
        status: 'Completed'
      }
    });

    // Get this year's monthly breakdown
    const monthlyBreakdown = await Payment.findAll({
      attributes: [
        [require('sequelize').fn('MONTH', require('sequelize').col('Payment.payment_date')), 'month'],
        [require('sequelize').fn('SUM', require('sequelize').col('Payment.amount')), 'revenue'],
        [require('sequelize').fn('COUNT', 'Payment.id'), 'transactions']
      ],
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed',
        payment_date: {
          [Op.gte]: startOfYear
        }
      },
      group: [require('sequelize').fn('MONTH', require('sequelize').col('Payment.payment_date'))],
      order: [[require('sequelize').fn('MONTH', require('sequelize').col('Payment.payment_date')), 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        total_earnings: parseFloat(totalEarnings),
        this_month: parseFloat(thisMonthEarnings),
        pending_payments: parseFloat(pendingPayments),
        total_consultations: totalConsultations,
        monthly_breakdown: monthlyBreakdown.map(item => ({
          month: parseInt(item.dataValues.month),
          revenue: parseFloat(item.dataValues.revenue) || 0,
          transactions: parseInt(item.dataValues.transactions) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Doctor revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue statistics'
    });
  }
});

// @desc    Get doctor dashboard statistics
// @route   GET /api/analytics/doctor-dashboard
// @access  Private (Doctor)
const getDoctorDashboardStats = asyncHandler(async (req, res) => {
  try {
    const { doctor_id } = req.query;
    const doctorId = doctor_id || req.user.doctor_id || req.user.id;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const todayString = new Date().toISOString().split('T')[0];

    // Get doctor's patients count
    const totalPatients = await Patient.count({
      where: {
        registered_by: doctorId
      }
    });

    // Get today's appointments for this doctor
    const todaysAppointments = await Appointment.count({
      where: {
        doctor_id: doctorId,
        appointment_date: todayString
      }
    });

    // Get this month's appointments for this doctor
    const monthlyAppointments = await Appointment.count({
      where: {
        doctor_id: doctorId,
        appointment_date: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Get completed consultations this month
    const completedConsultations = await Appointment.count({
      where: {
        doctor_id: doctorId,
        status: 'Completed',
        appointment_date: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAppointments = await Appointment.count({
      where: {
        doctor_id: doctorId,
        appointment_date: {
          [Op.between]: [todayString, nextWeek.toISOString().split('T')[0]]
        },
        status: ['Scheduled', 'Confirmed']
      }
    });

    // Get recent appointments for this doctor
    const recentAppointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId
      },
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Patient,
          include: [{
            model: User,
            attributes: ['first_name', 'last_name', 'email']
          }],
          attributes: ['id', 'patient_code']
        }
      ]
    });

    // Get appointment status breakdown for this doctor
    const appointmentsByStatus = await Appointment.findAll({
      where: {
        doctor_id: doctorId
      },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', 'id'), 'count']
      ],
      group: ['status']
    });

    // Calculate growth rates (compare this month vs last month)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const lastMonthAppointments = await Appointment.count({
      where: {
        doctor_id: doctorId,
        appointment_date: {
          [Op.between]: [lastMonth, endOfLastMonth]
        }
      }
    });

    const appointmentGrowth = lastMonthAppointments > 0
      ? ((monthlyAppointments - lastMonthAppointments) / lastMonthAppointments * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_patients: totalPatients,
          todays_appointments: todaysAppointments,
          monthly_appointments: monthlyAppointments,
          completed_consultations: completedConsultations,
          upcoming_appointments: upcomingAppointments,
          appointment_growth: appointmentGrowth
        },
        appointments_by_status: appointmentsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        recent_appointments: recentAppointments.map(apt => ({
          id: apt.id,
          appointment_number: apt.appointment_number,
          patient_name: apt.Patient?.User
            ? `${apt.Patient.User.first_name} ${apt.Patient.User.last_name}`
            : 'Unknown Patient',
          patient_code: apt.Patient?.patient_code,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          appointment_type: apt.appointment_type,
          status: apt.status,
          created_at: apt.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Doctor dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor dashboard statistics'
    });
  }
});

// @desc    Get doctor revenue data
// @route   GET /api/analytics/revenue
// @access  Private (Doctor/Admin)
const getDoctorRevenue = asyncHandler(async (req, res) => {
  try {
    const { doctor_id, period = '6months' } = req.query;
    const userRole = req.user.role;

    // If user is a doctor, they can only access their own data
    let targetDoctorId = doctor_id;
    if (userRole === 'Doctor') {
      targetDoctorId = req.user.doctor_id || req.user.id;
    }

    if (!targetDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate period start date
    let periodStart;
    let dateFormat;

    if (period === '12months') {
      periodStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
      dateFormat = '%Y-%m';
    } else if (period === '30days') {
      periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      dateFormat = '%Y-%m';
    }

    // Get total revenue for this doctor
    const totalRevenue = await Payment.sum('amount', {
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed'
      }
    }) || 0;

    // Get this month's revenue
    const thisMonthRevenue = await Payment.sum('amount', {
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed',
        payment_date: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Get pending revenue
    const pendingRevenue = await Payment.sum('amount', {
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Pending'
      }
    }) || 0;

    // Get revenue trends for the specified period
    const revenueTrends = await Payment.findAll({
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('Payment.payment_date'), dateFormat), 'period'],
        [require('sequelize').fn('SUM', require('sequelize').col('Payment.amount')), 'revenue'],
        [require('sequelize').fn('COUNT', 'Payment.id'), 'transactions']
      ],
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed',
        payment_date: {
          [Op.gte]: periodStart
        }
      },
      group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('Payment.payment_date'), dateFormat)],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('Payment.payment_date'), dateFormat), 'ASC']]
    });

    // Get payment method breakdown
    const paymentMethods = await Payment.findAll({
      attributes: [
        'payment_method',
        [require('sequelize').fn('SUM', require('sequelize').col('Payment.amount')), 'total'],
        [require('sequelize').fn('COUNT', 'Payment.id'), 'count']
      ],
      include: [{
        model: Invoice,
        include: [{
          model: Appointment,
          where: { doctor_id: targetDoctorId },
          attributes: []
        }],
        attributes: []
      }],
      where: {
        status: 'Completed',
        payment_date: {
          [Op.gte]: periodStart
        }
      },
      group: ['payment_method']
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_revenue: parseFloat(totalRevenue),
          this_month_revenue: parseFloat(thisMonthRevenue),
          pending_revenue: parseFloat(pendingRevenue)
        },
        trends: revenueTrends.map(item => ({
          period: item.dataValues.period,
          revenue: parseFloat(item.dataValues.revenue) || 0,
          transactions: parseInt(item.dataValues.transactions) || 0
        })),
        payment_methods: paymentMethods.map(item => ({
          method: item.payment_method,
          total: parseFloat(item.dataValues.total) || 0,
          count: parseInt(item.dataValues.count) || 0
        })),
        period
      }
    });
  } catch (error) {
    console.error('Doctor revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue data'
    });
  }
});

module.exports = {
  getDashboardStats,
  getRevenueTrends,
  getAppointmentTrends,
  getDoctorPerformance,
  getPatientDemographics,
  getDoctorRevenueStats,
  getDoctorDashboardStats,
  getDoctorRevenue
};
