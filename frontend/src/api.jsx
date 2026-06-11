import axios from "axios";
import moment from "moment-timezone";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  
  headers: { 
   
    "Content-Type": "application/json",
    // "X-Common-Header":"some value",
    // "Access-Control-Allow-Origin": "*",        
    // "Access-Control-Allow-Methods": "PUT,GET,POST,DELETE,OPTIONS,PATCH",        
    // 'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token, token, access-control-allow-origin',
   " x-api-key":"$2b$10$mBiSrdsIQZ/wSe6oVswYv.QIiZhTpL3U.E0.bnDtJnn.zu6GlrxWK"
  }
});


API.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  
  return config;
}); 

 const registerUser = async (userData) => {
  try {
    const response = await API.post(`/auth/createUser`, userData);
    return response.data;
  } catch (error) {
    return error.response?.data || { message: "Something went wrong" };
  }
};


 const loginUser = async (userData) => {
  try {
    const response = await API.post(`/auth/login`, userData);
    return response.data;
  } catch (error) {
    return error.response?.data || { message: "Invalid Credentials" };
  }
};
const logoutUser=async ()=>{
  try{
  const response=await API.post('/auth/logout')
  return response.data;
  }
  catch(error){
 return error.response?.data || {message:""}
  }
}
const getEmployeeData=async(id)=>{
  try{
    // console.log(id)
    const response=await API.get(`/attendance/getAttendance/${id}`);
    return response.data;

  }
  catch(err){
   return err.response.data || {message:"User not found"}
  }
}



 const getUser = async ({ id, date = new Date(), format,search="" }) => {
  try {
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const params = {
      startDate: formattedDate,
      endDate: formattedDate,
    };

    if (format === 'csv') params.format = 'csv';
    if (id) params.userId = id;
    if(search) params.search=search

    const config = {
      params,
      responseType: format === 'csv' ? 'blob' : 'json'
    };

    const response = await API.get(`/user/getAllUser`, config);
    return response.data;
  } catch (err) {
    throw err.response?.data || new Error("User Not Found");
  }
}

  const deleteUser = async (id) => {
    try {
      const response = await API.delete(`/user/deleteUser/${id}`);
      
        return response.data;
    
    } catch (error) {
      console.error('Delete Attendance Error:', error);
      throw error;
    }
  };


const forgotPassword = async (email) => {
  try {
    const response = await API.post('/auth/resetPasswordrequest', { email });
    return response.data;
  } catch (err) {
    return err.response?.data || { message: "User Not Found" };
  }
};


// const getResetPassword = async (token, newPassword) => {
//   try {
//     const response = await API.post(`/auth/resetPassword/${token}`, { newPassword });
//     return response.data;
//   } catch (err) {
//     return err.response?.data || { message: "Invalid Token or Password" };
//   }
// }


const getResetPassword = async (userId, token, password) => { // Use lowercase
  try {
    const response = await API.post(`/auth/resetPassword/${userId}/${token}`, { 
      password // Send as lowercase
    });
    return response.data;
  } catch (err) {
    return err.response?.data || { message: "Invalid Token or Password" };
  }
};
const updateStatus = async (id, isActive) => {
  try {
    const response = await API.patch(`/user/status/${id}`, { isActive });
    return response.data;
  } catch (err) {
    return err.response?.data || { message: "Failed to update status" };
  }
};

const createUser= async(userPayload)=>{
  try{
  const response= await API.post(`/user/createUser`, userPayload)
  //  console.log(response,"regi")
   return response.data
  }catch(err){
return err.response?.data || {message:"Failed to Create User"};
  }
}

// api.js
const addCamera = async (userId, cameraDetails) => {
  if (!userId) {
    return { message: "UserId is required" };
  }

  try {
    const response = await API.post(`/camera/addCamera/${userId}`, cameraDetails);
    return response.data;
  } catch (err) {
    return err.response?.data || { message: "Failed to add camera" };
  }
};


const uploadImages = async (images, personName) => {
  if (!images || images.length === 0) return;

  const formData = new FormData();
  images.forEach(file => formData.append("images", file));

  try {
    const response = await API.post(
      `/image/upload?name=${encodeURIComponent(personName)}`,  
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (err) {
     return err.response?.data || { message: "Failed to send" };   
  }
};


const userCount= async(id)=>{
  try{
 const response=await API.get(`/user/userCount/${id}`)
 return response.data;
  }
  catch(err){
    return err.response?.data || { message: "Failed to fetch user count" };                             
  }
}
export {registerUser,loginUser,getEmployeeData,getUser,deleteUser,logoutUser,forgotPassword,getResetPassword,updateStatus,createUser
,addCamera,uploadImages,userCount};