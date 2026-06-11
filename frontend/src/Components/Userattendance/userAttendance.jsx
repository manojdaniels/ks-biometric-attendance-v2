import React, { useEffect, useState } from "react";
import "../attendanceRecord/attendance.css";
import { useParams } from "react-router-dom";
import { getEmployeeData} from "../../api";
import dayjs from "dayjs";
import Loader from "../loader/loader";
import AddCamera from '../../Components/addCamera/addCamera'
import "./userAttendance.css"
import { useAuth } from "../../Context/AuthContext";
const UserAttendance = () => {
  
 
    const { id } = useParams();

    // console.log(id,"params");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  // For storing error messages
const {role}=useAuth();
 
   // Empty array means this runs once when component mounts
  const fetchAttendanceData = async (id) => {
    try {
      // console.log("Fetching attendance data for id:", id);
        const response = await getEmployeeData(id);

       // console.log(response.user2, "user2");
        setAttendanceData(response?.user2 || []);
        setLoading(false);
    } catch (err) {
        setError(err.message);
        setLoading(false);
    }
};
useEffect(() => {
  if (id) {
    fetchAttendanceData(id);
  }
}, [id]);
  
  // Show loading message while data is being fetched
  if (loading) {
    return <Loader message="Loading Attendance Data"/>;
  }

  // Show error message if something went wrong
  if (error) {
    return <div className="error">{error}</div>;
  }
 const camerashow=role==="subadmin"?"":<AddCamera/>
  return (
    <div className="attendance-cont">

   <div className="camera-btn">
   {camerashow}
   </div>
      
      <h1 className="atndnchead">Attendance Record</h1>
      <table className="atndncTbl">
        <thead>
          <tr className="atndncro">
          
            <th className="atndncehd">Entry</th>
            <th className="atndncehd">Exit</th>

            

           
          </tr>
        </thead>
        <tbody>
          { attendanceData.map((record, key) => {
            
            // console.log(record, "record");
            return (

            <tr key={key} className="atndncro">
                
              <td className="atndncehd_td">{record.entryTime ? dayjs(record.entryTime ).format("YYYY:MM:DD HH:mm:ss"): "-- "}</td>
              <td className="atndncehd_td">
                {record.exitTime ? dayjs(record.exitTime).format("YYYY:MM:DD  HH:mm:ss") : "--"}
              </td>

              

              
            </tr>
            );
})}
        </tbody>
      </table>
    </div>
  );
};

export default UserAttendance;
