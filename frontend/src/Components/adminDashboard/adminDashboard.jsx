import { useEffect, useMemo, useState } from 'react';
import {
  CalendarMonth,
  Download,
  MoreVert,
  SignalCellularAlt,
  Videocam,
  VisibilityOff,
  Wifi,
} from '@mui/icons-material';
import {
  downloadAttendanceReport,
  getAttendanceReport,
  getLiveAttendance,
  getReportEmployees,
} from '../../api';
import './adminDashboard.css';

const reportTypes = [
  { label: 'Daily', value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom Range', value: 'custom' },
];

const today = new Date().toISOString().slice(0, 10);

const toInputDate = (date) => date.toISOString().slice(0, 10);

const getDefaultDateRange = (type) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (type === 'monthly') {
    return {
      from: toInputDate(new Date(year, month, 1)),
      to: toInputDate(new Date(year, month + 1, 0)),
    };
  }

  if (type === 'quarterly') {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    return {
      from: toInputDate(new Date(year, quarterStartMonth, 1)),
      to: toInputDate(new Date(year, quarterStartMonth + 3, 0)),
    };
  }

  if (type === 'yearly') {
    return {
      from: toInputDate(new Date(year, 0, 1)),
      to: toInputDate(new Date(year, 11, 31)),
    };
  }

  return { from: today, to: today };
};

const cameraStreamBaseUrl = import.meta.env.VITE_CAMERA_STREAM_URL || 'http://localhost:5055';

const cameraConfig = [
  {
    id: 'out',
    title: 'CAMERA 1 (OUT)',
    feed: 'rtsp://192.168.1.101/stream1',
    streamUrl: `${cameraStreamBaseUrl}/video/entry`,
    className: 'feed-in',
  },
  {
    id: 'in',
    title: 'CAMERA 2 (IN)',
    feed: 'rtsp://192.168.1.101/stream2',
    streamUrl: `${cameraStreamBaseUrl}/video/exit`,
    className: 'feed-out',
  },
];

const CameraToggle = ({ active, onChange }) => (
  <button
    type="button"
    className={`camera-toggle ${active ? 'is-on' : ''}`}
    onClick={onChange}
    aria-pressed={active}
  >
    <span>ON</span>
    <span className="toggle-knob" />
    <span>OFF</span>
  </button>
);

const CameraPreview = ({ camera, active, onToggle }) => (
  <section className="camera-card">
    <div className="camera-copy">
      <div className="camera-title-row">
        <h3>{camera.title}</h3>
        <span className={`status-pill ${active ? 'active' : 'inactive'}`}>
          {active ? 'ACTIVE' : 'OFFLINE'}
        </span>
      </div>

      <CameraToggle active={active} onChange={onToggle} />

      <span className="rtsp-feed">RTSP FEED: {camera.feed}</span>

      <div className="camera-icons" aria-hidden="true">
        <Videocam />
        <VisibilityOff className={active ? 'green' : ''} />
      </div>
    </div>

    <div className={`camera-visual ${camera.className} ${active ? '' : 'is-paused'}`}>
      {active && (
        <img
          src={camera.streamUrl}
          alt={`${camera.title} live stream`}
          className="camera-stream"
        />
      )}
      <div className="office-wall" />
      <div className="glass-door" />
      <div className="person person-one" />
      <div className="person person-two" />
      <div className="scan-line" />
      {!active && <span className="offline-label">Camera Off</span>}
      <div className="camera-health">
        <VisibilityOff />
        <Wifi />
        <SignalCellularAlt />
      </div>
    </div>
  </section>
);

const AdminDashboard = () => {
  const [cameraStates, setCameraStates] = useState({ in: true, out: true });
  const [reportType, setReportType] = useState('daily');
  const [employeeMode, setEmployeeMode] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [attendanceError, setAttendanceError] = useState('');

  const attendance = useMemo(() => liveAttendance, [liveAttendance]);

  useEffect(() => {
    let isMounted = true;

    const loadLiveAttendance = async () => {
      const response = await getLiveAttendance(30);

      if (!isMounted) return;

      if (Array.isArray(response.data)) {
        setLiveAttendance(response.data);
        setAttendanceError('');
      } else {
        setAttendanceError(response.message || 'Live attendance unavailable');
      }
    };

    loadLiveAttendance();
    const interval = window.setInterval(loadLiveAttendance, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadEmployees = async () => {
      const response = await getReportEmployees();
      if (isMounted && Array.isArray(response.data)) {
        setEmployees(response.data);
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCamera = (id) => {
    setCameraStates((current) => ({ ...current, [id]: !current[id] }));
  };

  const handleReportTypeChange = (value) => {
    setReportType(value);

    if (value !== 'custom') {
      const range = getDefaultDateRange(value);
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  const buildReportParams = () => ({
    reportType,
    employeeId: employeeMode === 'single' ? selectedEmployee : 'all',
    fromDate,
    toDate,
  });

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      setReportLoading(true);
      setReportError('');

      try {
        const response = await getAttendanceReport({
          reportType,
          employeeId: employeeMode === 'single' ? selectedEmployee : 'all',
          fromDate,
          toDate,
        });

        if (isMounted) {
          setReportData(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setReportError(err.message || 'Unable to generate report');
        }
      } finally {
        if (isMounted) {
          setReportLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [employeeMode, fromDate, reportType, selectedEmployee, toDate]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError('');

    try {
      const response = await getAttendanceReport(buildReportParams());
      setReportData(response.data);
    } catch (err) {
      setReportError(err.message || 'Unable to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setReportError('');

    try {
      const blob = await downloadAttendanceReport(buildReportParams());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${reportType}-report.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setReportError(err.message || 'Unable to download report');
    }
  };

  return (
    <main className="bio-dashboard">
      <section className="dashboard-panel camera-panel">
        <h2>LIVE CAMERA STREAMS (RTSP)</h2>
        <div className="camera-grid">
          {cameraConfig.map((camera) => (
            <CameraPreview
              key={camera.id}
              camera={camera}
              active={cameraStates[camera.id]}
              onToggle={() => toggleCamera(camera.id)}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-panel attendance-panel">
        <div className="panel-title-row">
          <h2>
            LIVE ATTENDANCE LOG <span>(updates in real-time)</span>
          </h2>
          <span className="live-pill">
            <span />
            Live
          </span>
        </div>
        {attendanceError && <p className="attendance-error">{attendanceError}</p>}

        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee Name</th>
                <th>Status</th>
                <th>Time</th>
                <th>Camera Source</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={`${row.id}-${row.time}`}>
                  <td>{String(row.id).slice(-6)}</td>
                  <td>{row.employeeName || row.name}</td>
                  <td>
                    <span className={`status-badge ${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{new Date(row.time).toLocaleString()}</td>
                  <td>{row.cameraSource || row.camera}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="5">No live attendance records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-panel reports-panel">
        <h2>REPORTING &amp; ANALYTICS</h2>

        <div className="report-controls">
          <label>
            <span>Report Type</span>
            <select value={reportType} onChange={(event) => handleReportTypeChange(event.target.value)}>
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Employee Filter</span>
            <select value={employeeMode} onChange={(event) => setEmployeeMode(event.target.value)}>
              <option value="all">All Employees</option>
              <option value="single">Single Employee</option>
            </select>
          </label>

          <label className="search-field">
            <span>Employee</span>
            <select
              value={selectedEmployee}
              onChange={(event) => setSelectedEmployee(event.target.value)}
              disabled={employeeMode !== 'single'}
            >
              <option value="all">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>

          <div className="date-range">
            <span>Date Range</span>
            <div>
              <label>
                <input
                  aria-label="From date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  type="date"
                />
                <CalendarMonth />
              </label>
              <b>-</b>
              <label>
                <input
                  aria-label="To date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  type="date"
                />
                <CalendarMonth />
              </label>
            </div>
          </div>
        </div>

        <div className="report-tabs report-metrics" aria-label="Report summaries">
          <button type="button">
            <span>Report Days</span>
            <strong>{reportData?.summary?.totalRecords ?? 0}</strong>
          </button>
          <button type="button">
            <span>Productive</span>
            <strong>{reportData?.summary?.totalProductiveHours ?? '0h 0m'}</strong>
          </button>
          <button type="button">
            <span>Breaks</span>
            <strong>{reportData?.summary?.totalBreakHours ?? '0h 0m'}</strong>
          </button>
        </div>

        {reportError && <p className="attendance-error">{reportError}</p>}

        <div className="report-actions">
          <button type="button" className="generate-report" onClick={handleGenerateReport}>
            {reportLoading ? 'GENERATING...' : 'GENERATE REPORT'}
          </button>
          <button type="button" className="download-report" onClick={handleDownloadReport}>
            <Download />
            CSV
          </button>
        </div>

        <div className="analytics-grid">
          <article className="analytics-card">
            <div className="analytics-title">
              <h3>Employee Summary</h3>
              <MoreVert />
            </div>
            <div className="employee-summary-list">
              {(reportData?.employeeSummary || []).slice(0, 8).map((employee) => (
                <div key={employee.employeeId}>
                  <span>{employee.employeeName}</span>
                  <strong>{employee.productiveHours}</strong>
                  <small>{employee.daysPresent} days / {employee.breakHours} breaks</small>
                </div>
              ))}
              {reportData?.employeeSummary?.length === 0 && (
                <p>No employee attendance found for this report.</p>
              )}
            </div>
          </article>

          <article className="analytics-card">
            <div className="analytics-title">
              <h3>Report Details</h3>
              <MoreVert />
            </div>
            <div className="report-detail-table">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>IN/OUT</th>
                    <th>Productive</th>
                    <th>Breaks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.rows || []).slice(0, 8).map((row) => (
                    <tr key={`${row.employeeId}-${row.entryTime}`}>
                      <td>{row.employeeName}</td>
                      <td>{row.date}</td>
                      <td>{row.inOutTimings}</td>
                      <td>{row.productiveHours}</td>
                      <td>{row.breakHours}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                  {reportData?.rows?.length === 0 && (
                    <tr>
                      <td colSpan="6">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
