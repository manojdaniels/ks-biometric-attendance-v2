const User = require('../../modal/user/usermodal');
const Attendance = require('../../modal/attendance/attendanceModel');
const moment = require('moment-timezone');

const REPORT_TZ = 'Asia/Kolkata';
const EXPECTED_PRODUCTIVE_MS = 8 * 60 * 60 * 1000;
const DUPLICATE_EXIT_WINDOW_MS = 5 * 60 * 1000;

const getReportDateRange = ({ reportType = 'daily', fromDate, toDate }) => {
  const now = moment.tz(REPORT_TZ);
  const type = String(reportType).toLowerCase().replace(/\s+/g, '');

  if ((type === 'custom' || type === 'customrange') && (!fromDate || !toDate)) {
    throw new Error('From and To dates are required for custom range reports');
  }

  if (fromDate && toDate) {
    return {
      start: moment.tz(fromDate, REPORT_TZ).startOf('day').toDate(),
      end: moment.tz(toDate, REPORT_TZ).endOf('day').toDate(),
    };
  }

  if (type === 'custom' || type === 'customrange') {
    if (!fromDate || !toDate) {
      throw new Error('From and To dates are required for custom range reports');
    }

    return {
      start: moment.tz(fromDate, REPORT_TZ).startOf('day').toDate(),
      end: moment.tz(toDate, REPORT_TZ).endOf('day').toDate(),
    };
  }

  const ranges = {
    daily: [now.clone().startOf('day'), now.clone().endOf('day')],
    monthly: [now.clone().startOf('month'), now.clone().endOf('month')],
    quarterly: [now.clone().startOf('quarter'), now.clone().endOf('quarter')],
    yearly: [now.clone().startOf('year'), now.clone().endOf('year')],
    annual: [now.clone().startOf('year'), now.clone().endOf('year')],
  };

  const range = ranges[type] || ranges.daily;

  return {
    start: range[0].toDate(),
    end: range[1].toDate(),
  };
};

const formatDuration = (milliseconds) => {
  const totalMinutes = Math.max(Math.floor(milliseconds / 60000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const formatTime = (date) => (date ? moment(date).tz(REPORT_TZ).format('HH:mm:ss') : '--');

const formatDate = (date) => moment(date).tz(REPORT_TZ).format('YYYY-MM-DD');

const listDatesBetween = (start, end) => {
  const dates = [];
  const cursor = moment(start).tz(REPORT_TZ).startOf('day');
  const last = moment(end).tz(REPORT_TZ).startOf('day');

  while (cursor.isSameOrBefore(last, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'));
    cursor.add(1, 'day');
  }

  return dates;
};

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const toCsv = (rows) => {
  const headers = [
    'Employee Name',
    'Email',
    'Date',
    'All IN/OUT Timings',
    'First IN',
    'Last OUT',
    'Total Office Hours',
    'Productive Hours',
    'Break Hours',
    'Expected Productive Hours',
    'Productive Difference',
    'Status',
  ];

  const body = rows.map((row) => [
    row.employeeName,
    row.email,
    row.date,
    row.inOutTimings,
    row.firstIn,
    row.lastOut,
    row.totalOfficeHours,
    row.productiveHours,
    row.breakHours,
    row.expectedProductiveHours,
    row.productiveDifference,
    row.status,
  ]);

  return [headers, ...body]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
};

const buildDayWiseReport = (records, users, userMap, start, end) => {
  const grouped = {};

  users.forEach((user) => {
    listDatesBetween(start, end).forEach((date) => {
      const userId = user._id.toString();
      grouped[`${userId}-${date}`] = {
        employeeId: userId,
        employeeName: user.name || 'Unknown',
        email: user.email || '',
        date,
        sessions: [],
      };
    });
  });

  records.forEach((record) => {
    const userId = record.userId.toString();
    const user = userMap[userId] || {};
    const date = formatDate(record.entryTime);
    const key = `${userId}-${date}`;

    grouped[key] = grouped[key] || {
      employeeId: userId,
      employeeName: record.userName || user.name || 'Unknown',
      email: user.email || '',
      date,
      sessions: [],
    };

    grouped[key].sessions.push({
      entryTime: record.entryTime,
      exitTime: record.exitTime,
    });
  });

  return Object.values(grouped)
    .map((day) => {
      const sessions = day.sessions.sort(
        (a, b) => new Date(a.entryTime) - new Date(b.entryTime)
      );
      const isAbsent = sessions.length === 0;
      const firstEntry = sessions[0]?.entryTime;
      const lastExit = [...sessions].reverse().find((session) => session.exitTime)?.exitTime;
      const hasOpenSession = sessions.some((session) => !session.exitTime);
      const productiveMs = sessions.reduce((total, session) => {
        if (!session.entryTime || !session.exitTime) return total;
        return total + Math.max(
          new Date(session.exitTime).getTime() - new Date(session.entryTime).getTime(),
          0
        );
      }, 0);
      const officeMs = firstEntry && lastExit
        ? Math.max(new Date(lastExit).getTime() - new Date(firstEntry).getTime(), 0)
        : productiveMs;
      const breakMs = Math.max(officeMs - productiveMs, 0);
      const productiveDifferenceMs = productiveMs - EXPECTED_PRODUCTIVE_MS;

      return {
        employeeId: day.employeeId,
        employeeName: day.employeeName,
        email: day.email,
        date: day.date,
        inOutTimings: isAbsent ? 'No records' : sessions
          .map((session) => `${formatTime(session.entryTime)} IN - ${formatTime(session.exitTime)} OUT`)
          .join(' | '),
        firstIn: formatTime(firstEntry),
        lastOut: formatTime(lastExit),
        totalOfficeHours: formatDuration(officeMs),
        productiveHours: formatDuration(productiveMs),
        productiveHoursMs: productiveMs,
        breakHours: formatDuration(breakMs),
        breakHoursMs: breakMs,
        expectedProductiveHours: formatDuration(EXPECTED_PRODUCTIVE_MS),
        productiveDifference: `${productiveDifferenceMs < 0 ? '-' : ''}${formatDuration(Math.abs(productiveDifferenceMs))}`,
        status: isAbsent ? 'Absent' : hasOpenSession ? 'Open' : 'Present',
      };
    })
    .sort((a, b) => {
      const dateSort = b.date.localeCompare(a.date);
      if (dateSort !== 0) return dateSort;
      return a.employeeName.localeCompare(b.employeeName);
    });
};

const findUserByRecognizedName = async (recognizedName) => {
  const rawName = String(recognizedName || '').trim();
  const spaceName = rawName.replace(/_/g, ' ');

  return User.findOne({
    $or: [
      { name: rawName },
      { name: spaceName },
      { name: new RegExp(`^${rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { name: new RegExp(`^${spaceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    ],
  });
};

exports.entryExit = async (req, res) => {
    try {

        const { type } = req.query;
        const { name, entry, exit } = req.body;

        const user = await findUserByRecognizedName(name);
        const eventTimestamp = new Date(entry || exit || Date.now());
        const eventDayStart = moment(eventTimestamp).tz(REPORT_TZ).startOf('day').toDate();
        const eventDayEnd = moment(eventTimestamp).tz(REPORT_TZ).endOf('day').toDate();

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        //-----------------------------------
        // ENTRY
        //-----------------------------------

        if (type === "entry") {

            const existing = await Attendance.findOne({
                userId: user._id,
                entryTime: { $gte: eventDayStart, $lte: eventDayEnd },
                $or: [
                    { exitTime: null },
                    { exitTime: { $exists: false } }
                ]
            });

            if (existing) {
                return res.status(200).json({
                    message: "User already checked in"
                });
            }

            await Attendance.create({
                userId: user._id,
                userName: user.name,
                entryTime: entry
            });

            return res.status(200).json({
                message: "Entry recorded"
            });
        }

        //-----------------------------------
        // EXIT
        //-----------------------------------

        if (type === "exit") {

            const attendance = await Attendance.findOne({
                userId: user._id,
                entryTime: { $gte: eventDayStart, $lte: eventDayEnd },
                $or: [
                    { exitTime: null },
                    { exitTime: { $exists: false } }
                ]
            }).sort({ entryTime: -1 });

            if (!attendance) {
                const recentExit = await Attendance.findOne({
                    userId: user._id,
                    exitTime: {
                        $gte: new Date(new Date(exit).getTime() - DUPLICATE_EXIT_WINDOW_MS),
                        $lte: new Date(new Date(exit).getTime() + DUPLICATE_EXIT_WINDOW_MS)
                    }
                }).sort({ exitTime: -1 });

                if (recentExit) {
                    return res.status(200).json({
                        message: "Duplicate exit ignored"
                    });
                }

                return res.status(200).json({
                    message: "Exit ignored because no active entry was found"
                });
            }

            attendance.exitTime = exit;

            await attendance.save();

            return res.status(200).json({
                message: "Exit recorded"
            });
        }

        return res.status(400).json({
            message: "Invalid attendance type"
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            message: err.message
        });
    }
};


exports.getAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, enddate } = req.query;
    let query = {};

    if (id) {
      query.userId = id;
    }
    if (startDate && enddate) {
      query.createdAt = { $gte: startDate, $lt: enddate };
    }
    const user2 = await Attendance.find(query).sort({ _id: -1 });
      // console.log(user2, 'user2');
    return res.status(200).json({ message: 'Data fetch successfully', user2 });
  
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getLiveAttendance = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);

    const records = await Attendance.find({})
      .sort({ updatedAt: -1, _id: -1 })
      .lean();

    const latestByUser = new Map();

    records.forEach((record) => {
      const userId = record.userId.toString();
      const event = record.exitTime
        ? {
            id: record.userId,
            employeeName: record.userName,
            status: 'OUT',
            time: record.exitTime,
            cameraSource: 'Camera 1',
          }
        : {
            id: record.userId,
            employeeName: record.userName,
            status: 'IN',
            time: record.entryTime,
            cameraSource: 'Camera 2',
          };

      const current = latestByUser.get(userId);
      if (!current || new Date(event.time) > new Date(current.time)) {
        latestByUser.set(userId, event);
      }
    });

    const feed = Array.from(latestByUser.values())
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);

    return res.status(200).json({
      message: 'Live attendance fetched successfully',
      data: feed,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getReportEmployees = async (req, res) => {
  try {
    const query = { role: { $ne: 'admin' } };

    if (req.user?.role === 'subadmin') {
      query.createdBy = req.user._id;
      query.role = 'user';
    }

    const employees = await User.find(query)
      .select('_id name email role')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      message: 'Employees fetched successfully',
      data: employees,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const {
      reportType = 'daily',
      employeeId = 'all',
      fromDate,
      toDate,
      format,
    } = req.query;

    const { start, end } = getReportDateRange({ reportType, fromDate, toDate });

    const userQuery = { role: { $ne: 'admin' } };
    if (employeeId && employeeId !== 'all') {
      userQuery._id = employeeId;
    }

    if (req.user?.role === 'subadmin') {
      userQuery.createdBy = req.user._id;
      userQuery.role = 'user';
    }

    const users = await User.find(userQuery)
      .select('_id name email role')
      .lean();

    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const records = await Attendance.find({
      userId: { $in: users.map((user) => user._id) },
      entryTime: { $gte: start, $lte: end },
    })
      .sort({ entryTime: 1 })
      .lean();

    const rows = buildDayWiseReport(records, users, userMap, start, end);
    const employeeSummaryMap = rows.reduce((acc, row) => {
      if (!acc[row.employeeId]) {
        acc[row.employeeId] = {
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          email: row.email,
          daysPresent: 0,
          productiveMs: 0,
          breakMs: 0,
        };
      }

      if (row.status !== 'Absent') {
        acc[row.employeeId].daysPresent += 1;
      }
      acc[row.employeeId].productiveMs += row.productiveHoursMs;
      acc[row.employeeId].breakMs += row.breakHoursMs;
      return acc;
    }, {});

    const employeeSummary = Object.values(employeeSummaryMap).map((item) => ({
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      email: item.email,
      daysPresent: item.daysPresent,
      productiveHours: formatDuration(item.productiveMs),
      breakHours: formatDuration(item.breakMs),
    }));

    const totalProductiveMs = rows.reduce((total, row) => total + row.productiveHoursMs, 0);
    const totalBreakMs = rows.reduce((total, row) => total + row.breakHoursMs, 0);

    const response = {
      reportType,
      dateRange: {
        from: moment(start).tz(REPORT_TZ).format('YYYY-MM-DD'),
        to: moment(end).tz(REPORT_TZ).format('YYYY-MM-DD'),
      },
      summary: {
        totalEmployees: users.length,
        totalRecords: rows.length,
        attendanceEvents: records.length,
        totalProductiveHours: formatDuration(totalProductiveMs),
        totalBreakHours: formatDuration(totalBreakMs),
        expectedProductiveHoursPerDay: formatDuration(EXPECTED_PRODUCTIVE_MS),
      },
      employeeSummary,
      rows,
    };

    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment(`attendance-${reportType}-report.csv`);
      return res.send(toCsv(rows));
    }

    return res.status(200).json({
      message: 'Attendance report fetched successfully',
      data: response,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
