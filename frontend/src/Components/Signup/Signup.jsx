import React,{ useState } from "react"
import "../login/login.css";
import "../Signup/Signup.css"
import { registerUser } from "../../api";


const Signup = ({ toggleform }) => {
  const [formData, setformData] = useState({
    name: "",
    email: "",
    phoneNumber:"",
    password: "",
    confirmPassword: "",
  });

  const [error, setErrors] = useState({});
  const[message, setMessage]=useState("");
  
 
  
  const handleChange = (e) => {
    setformData({ ...formData, [e.target.name]: e.target.value });
  };

  const validationError=()=>{
    let errors={};
    let isValid=true
    if(!formData.name){
      errors.name="Name is required";
     isValid=false;

    }
    if(!formData.email){
      errors.email="Email is required";
      isValid=false;
    }
    else if(!/\S+@\S+\.\S+/.test(formData.email)){
      errors.email="Please Enter valid email";
     isValid =false;
    }
    if(!formData.phoneNumber){
      errors.phoneNumber="Contact Number is required."
      isValid =false;
    }
    else if(!/^[0-9]{10}$/.test(formData.phoneNumber)){
      errors.phoneNumber="Contact Number must be of 10 digits."
      isValid=false;
    }
    if(!formData.password){
      errors.password="Password is required."
      isValid=false
    }
    else if(formData.password.length < 8){
      errors.password="Password must be at least 8 character long."
    isValid=false;
    }

    if(formData.password !== formData.confirmPassword){
      errors.confirmPassword="Password Do not match "
      isValid=false;
    }
    setErrors(errors);
    return isValid
  }
  const handleSubmit = async(e) => {
    e.preventDefault();
    setErrors({});
      if(!validationError()){
        return;
      }
  
      try {
        const response= await registerUser({
          name:formData.name,
          email:formData.email,
          phoneNumber:formData.phoneNumber,
          password:formData.password,
          confirmPassword:formData.confirmPassword,
         
        })
        if(response.message){
          setMessage(response.message);
           
           setErrors({});
           setformData({
            name:"",
            email:"",
            phoneNumber:"",
            password:"",
            confirmPassword:""
           })
        }
      } catch (err) {
        setErrors({general:err.message});

      }
    
    
  };

  return (
    <div className="login-cont">
      <div className="log-field1">
        <div className="head">
          <h1>Signup</h1>
        </div>
 

        <form onSubmit={(e)=>handleSubmit(e)}>
        <div className="authBox">
        {message && <p className="success" >{message}</p>} 
        {error.general && <p className="signup-error">{error.general}</p>} 
        <div className="field2">
            <input
              type="text"
              placeholder="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            {error.name && <div className="signup-error">{error.name}</div>}
          </div>
          <div className="field2">
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {error.email && <div className="signup-error">{error.email}</div>}
          </div>

          <div className="field2">
            <input
              type="tel"
              placeholder="Contact"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            {error.phoneNumber && <div className="signup-error">{error.phoneNumber}</div>}
          </div>
          <div className="field2">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            {error.password && <div className="signup-error">{error.password}</div>}
          </div>

          <div className="field2">
            <input
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {error.confirmPassword && <div className="signup-error">{error.confirmPassword}</div>}
          </div>
          <button className="btn" type="submit" >Sign Up</button>
          <div className="para">
          <p className="para1">
            Already have an account?
            <span className="forgot" onClick={toggleform}>
              Login
            </span>
          </p>
        </div>
        </div>
          
          
          
          {/* Image Upload Options */}
          

          
        </form>

      </div>
    </div>
  );
};

export default Signup;
