import React from 'react';
import { useAuth } from '../../Context/AuthContext';
import AdminDashboard from '../../Components/adminDashboard/adminDashboard';
import SubAdmin from '../../Components/subAdmin/subAdmin';
import UserDashboard from '../../Components/userDashboard/userDashboard';

const Home = () => {
  const { role } = useAuth();

  return (
    <div>
      {role === "admin" && <AdminDashboard />}
      {role === "subadmin" && <SubAdmin />}
      {role === "user" && <UserDashboard />}
      {!role && <p>Loading Dashboard...</p>}
    </div>
  );
};

export default Home;
