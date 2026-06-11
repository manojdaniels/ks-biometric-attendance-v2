import React from 'react'
import "./subAdmin.css"
import Card from '../card/card';
import {  FaPeopleGroup,FaFileExcel} from "react-icons/fa6";
import { BiSolidCctv } from "react-icons/bi";

import { IoIosNotifications } from "react-icons/io";
import AddUser from '../addUser/addUser';
const SubAdmin = () => {




  return (
    <div className='subadmin-cards'>
      <div className='add_user' >
        < AddUser/>
      </div>
      <div className='subadmin-dash-card'>

      
      <Card  title="Total Cameras" icon={BiSolidCctv}/>
         <Card  title="Renewal Notification" icon={IoIosNotifications}/>
      <Card title="Total Employees " icon={  FaPeopleGroup }/>
      <Card title="Attendance Reports" icon= { FaFileExcel }/>

     
      </div>
      
      
  


    </div>
  )
}

export default SubAdmin;
