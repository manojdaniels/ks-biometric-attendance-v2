import React, { useState } from 'react'
import Login from '../Components/login/login'
import Signup from '../Components/Signup/Signup'
const Auth = () => {
    const[isLogin, setLogin]=useState(true);
  return (
   <div>
    {isLogin ?
    (
        <Login toggleform={() => setLogin(false)}/>

    ):
    ( <Signup toggleform={() => setLogin(true)}/>
    )}
   </div>
  )
}

export default Auth;
