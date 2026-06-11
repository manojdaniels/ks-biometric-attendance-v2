import React from 'react'
import './userDashboard.css'
import Card from '../card/card'
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
const UserDashboard = () => {
  return (
    <div className='user-dashboard'>
      <Card title="First Entry"  icon={PermIdentityIcon}/>
      <Card title="Total Exit " icon={PersonRemoveIcon}/>
      <Card title="Working Hours"  icon={QueryBuilderIcon}/>
    </div>
  )
}

export default UserDashboard
