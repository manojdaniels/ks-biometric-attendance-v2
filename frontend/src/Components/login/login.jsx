import React, { useState } from "react";
import "../login/login.css";
import { loginUser } from "../../api.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import { IoEyeOutline ,IoEyeOffOutline} from "react-icons/io5";
const Login = ({toggleform}) => {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({})
  const[message,setMessage]=useState("");
  const[showPassword, setShowPassword]=useState(null);
  
  const navigate=useNavigate();
  const{login}=useAuth();

  const handlesubmit = async (e) => {
    e.preventDefault();
   
  
    let errors = {};

    if (!email && !password) {
      errors.general = "Please enter required fields.";
    } else {
      if (!email) {
        errors.email = "Please enter your email.";
      }
      if (!password) {
        errors.password = "Please enter valid password.";
      }
    }
    setError(errors);

    if (Object.keys(errors).length === 0) {
      try {
         const response=await loginUser({email,password});
          console.log(response)
         if(response.token){
          login(response.user,response.token, response.user.role);
          setMessage("Login Successfully");
         
          setEmail("");
          setPassword("");
          setError({});

          navigate("/home");
         }
         else{
          setError({general:response.message});
         }
      } catch  {
     setError({general:"Invalid Credentials"});
        
      }
    }
    else{
      setError(errors);
    }
  };

  return (
    <div className="login-cont">
      <div className="log-field">
        <div className="head">
        
          <h1 className="login_head">Login</h1>
        </div>

        
        <form onSubmit={handlesubmit}>
        <div className="authBox">
        {error.general && <p className="login-error">{error.general}</p>}
        
        <div className="field2">
          <input
           type="email" 
           placeholder="Email"
            name="Email" 
           value={email} 
           onChange={(e) => setEmail(e.target.value)}
           />
           {error.email && <p className="login-error">{error.email}</p>}
        </div>
        <div className="field2">
          

          <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    name="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="password-input"
  />
  <span className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
    {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
  </span>
           
           {error.password && <p className="login-error">{error.password}</p>}
        </div>
        <span className="forget" onClick={()=>navigate("/forgot")}>Forgot Password?</span>

        <button className="btn" type="submit">Login

</button>
{message && <p className="success">{message}</p>}
        <div className="para">
          <p className="para1">
            Do not have an account?
            <span className="forgot" onClick={toggleform}>
              Signup
            </span>
          </p>
        </div>
        </div>
       
        

      
        
        </form>
        
      </div>
    </div>
  );
};

export default Login;
