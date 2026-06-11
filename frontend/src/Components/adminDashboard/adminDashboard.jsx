import React from 'react'
import "../adminDashboard/adminDashboard.css"
import Card from '../card/card';
import { BiSolidCctv } from "react-icons/bi";
import { FaUsers,FaBan} from "react-icons/fa6";

import AddUser from '../addUser/addUser';


const AdminDashboard = () => {




  return (



    <div className='admin-cards'>

      <div className='add_user' >
        < AddUser/>
      </div>
      <div className='admin-dash-card'>

      <Card   title="Total Active Clients" value="20" icon={FaUsers} color="#F1FCFE"/>
      <Card  title="Total Cameras" icon={BiSolidCctv }/>
      <Card title="Due for Renewal " icon={ FaBan }/>
    

      </div>
      </div>
    
    
      
      
  


   
  )
}

export default AdminDashboard;
