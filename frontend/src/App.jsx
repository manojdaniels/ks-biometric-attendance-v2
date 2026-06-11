import './App.css';
import {Routes, Route, Navigate} from 'react-router-dom';
import Auth from './Auth/auth';
import Nav from './Components/Nav/Nav';
import AttendanceTable from './Components/attendanceRecord/attendanceTable';
import UserAttendance from './Components/Userattendance/userAttendance';
import {AuthProvider, useAuth} from "./Context/AuthContext"
import ProtectedRoute from "./routes/protectedRoutes"
import ForgotPassword from './Components/forgotpassword/forgotPassword';
import Home from './Pages/Home/home';
import ResetPassword from './Components/resetPassword/resetPassword';
import Profile from './Pages/profile/profile';
import SubAdmin from './Components/subAdmin/subAdmin';
import UserDashboard from './Components/userDashboard/userDashboard';
import AdminDashboard from './Components/adminDashboard/adminDashboard';

function App() {
  return (
    <AuthProvider>
      <AppContent/>
    </AuthProvider>
  );
}

const AppContent = () => {
  const {isAuthenticated} = useAuth();
  
  return (
    <>
      {isAuthenticated && <Nav/>}
      <Routes>
        
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/home" replace /> : <Auth />
          }
        />
        <Route path="/home" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
        <Route path="/attendance" element={<ProtectedRoute><AttendanceTable/></ProtectedRoute>}/>
        <Route path="/attendance/:id" element={<ProtectedRoute><UserAttendance/></ProtectedRoute>}/>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/"} />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path='/reset-password/:id/:token' element={<ResetPassword />} />
        <Route path='/profile/:id' element={<Profile/>}/>
        <Route path='/Admin' element={<ProtectedRoute><AdminDashboard/></ProtectedRoute>}/>
        <Route path='/subadmin' element={<ProtectedRoute><SubAdmin/></ProtectedRoute>}/>
        <Route path='/user' element={<ProtectedRoute><UserDashboard/></ProtectedRoute>}/>

      </Routes>
    </>
  );
}

export default App;
