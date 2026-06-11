import React, { useEffect, useState ,useCallback} from "react";
import "../attendanceRecord/attendance.css";
import { getUser, getEmployeeData, deleteUser } from "../../api";
import { useNavigate } from "react-router-dom";
import Loader from "../loader/loader";
import moment from "moment-timezone";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import DeleteIcon from "@mui/icons-material/Delete";
import Status from "../status/status";
import {useAuth} from "../../Context/AuthContext.jsx";
// import ModeEditOutlinedIcon from '@mui/icons-material/ModeEditOutlined';
// import Search from "../Search/search";

const AttendanceTable = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const navigate = useNavigate();
  const {role}=useAuth();

  const formatDateForInput = (date) => date.toISOString().split("T")[0];

  // ✅ Wrap with useCallback
  const fetchEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUser({ date: selectedDate });
      setEmployeeData(response.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
      setLoading(false);
    }
  }, [selectedDate]); // Only changes when selectedDate changes

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleViewUser = async (id) => {
    try {
      const response = await getEmployeeData(id);
      console.log(response)
    } catch (err) {
      console.log(err);
    }
    navigate(`/attendance/${id}`);
  };
  const handleDeleteUser = async (id) => {
  try {
    const response = await deleteUser(id);
    console.log(response);

    // ✅ Immediately remove from UI
    setEmployeeData((prev) => prev.filter((user) => user._id !== id));

  } catch (err) {
    console.error("Delete user error:", err);
  }
};
  const downloadCSV = async () => {
    try {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      const csvData = await getUser({ date: selectedDate, format: "csv" });

     
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${formattedDate}.csv`);
      document.body.appendChild(link);
      link.click();

   
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert(
        "Failed to download CSV: " +
          (error.message || "Check console for details")
      );
    }
  };

  if (loading) {
    return <Loader message="Loading employee data..." />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }
 const heading = role === "subadmin" ? " Employees Record" : "Client Record";
  return (
    <div className="attendance-cont">
      <h1 className="atndnchead">{heading}</h1>
      <div className="alignment" style={{ marginBottom: "1rem" }}>
        <div className="left-align">
          <label htmlFor="attendance-date">Select Date: </label>
          <input
            type="date"
            id="attendance-date"
            value={formatDateForInput(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            max={formatDateForInput(new Date())}
          />
        </div>

        <div className="right-align ">
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadCSV}
            className="btndownload"
          >
            DOwnload CSV
          </Button>
        </div>
      </div>

      <table className="atndncTbl">
        <thead>
          <tr className="atndncro">
            <th className="atndncehd">S.No.</th>
            <th className="atndncehd">Name</th>
            <th className="atndncehd">Email</th>

            <th className="atndncehd">Phone number</th>
            <th className="atndncehd">Entry Time</th>
            <th className="atndncehd">Exit Time</th>
            <th className="atndncehd">Exit Count</th>
     
            <th className="atndncehd">Status</th>
            <th className="atndncehd">Working hours</th>
            <th className="atndncehd action">Action</th>
          </tr>
        </thead>
        <tbody>
          {employeeData &&
            employeeData.map((record, key) => (
              <tr key={record._id} className="atndncro">
                <td className="atndncehd1">{key + 1}</td>
                <td className="atndncehd1">
                  {record.name ? record.name : "-- "}
                </td>
                <td className="atndncehd1">
                  {record.email ? record.email : "--"}
                </td>

                <td className="atndncehd1">
                  {record.phoneNumber ? record.phoneNumber : "--"}
                </td>
                <td className="atndncehd1">
                  {record.entryTIME && record.entryTIME !== "--"
                    ? record.entryTIME
                    : "--"}
                </td>
                <td className="atndncehd1">
                  {record.exitTIME && record.exitTIME !== "--"
                    ? record.exitTIME
                    : "--"}
                </td>

                <td className="atndncehd1">
                  {record.exitCount ? record.exitCount : "--"}
                </td>

                <td className="atndncehd1">
                  {/* <Status id={record._id} initialStatus={record.isActive} onStatusChange={fetchEmployeeData}/>
                  
                  */}

                  <Status
  id={record._id}
  initialStatus={record.isActive}
  onStatusChange={(updatedStatus) => {
    setEmployeeData((prevData) =>
      prevData.map((user) =>
        user._id === record._id ? { ...user, isActive: updatedStatus } : user
      )
    );
  }}
/>
                </td>
              
                <td className="atndncehd1">
                  {record.totalWorkHours ? record.totalWorkHours : "--"}
                </td>
                <td className="atndncehd1">
                  <div className="btn-view">
                    <div className="btn2">
                      <button
                        className="view-btn"
                        title="View Details"
                        onClick={() => {
                          handleViewUser(record._id);
                        }}
                      >

                        <RemoveRedEyeIcon />
                      </button>
                    </div>
                    <div className="btn2">
                      <button
                        className="view-btn"
                        title="Delete Record"
                        onClick={() => {
                          handleDeleteUser(record._id);
                        }}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
