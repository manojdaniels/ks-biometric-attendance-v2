import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "./resetPassword.css";
import { getResetPassword } from '../../api';
// import { IoEyeOutline ,IoEyeOffOutline} from "react-icons/io5";
const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
      // const[showPassword, setShowPassword]=useState(null);

    const {id, token } = useParams(); 
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            setLoading(false);
            setError("Passwords do not match!");
            return;
        }

        try {
            const res = await getResetPassword(id,token, newPassword);
            setMessage(res.message || "Password has been reset successfully!");
            e.target.reset();
            setTimeout(() => {
                navigate('/login'); // Redirect to login after success
            }, 2000);
        } catch (err) {
            setError(err.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='reset_password_container'>
            <div className='reset_password'>
                <div className='reset_password_header'>
                    <h3 className='reset_head'>Reset Password</h3>
                </div>

                <div className='reset_password_content'>
                    <form onSubmit={handleResetPassword}>
                        <div className='reset_password_input'>
                            <label>New Password:</label>
                            <input type='password' name='newPassword' placeholder='Enter New Password' required className='reset_input' />
                            {/* <span className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                              </span> */}
                        </div>

                        <div className='reset_password_input'>
                            <label>Confirm Password:</label>
                            <input type='password' name='confirmPassword' placeholder='Enter Confirm Password' required className='reset_input' />
                            {/* <span className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                              </span> */}
                        </div>

                        {error && <p className="error">{error}</p>}
                        {message && <p className="success">{message}</p>}

                        <div className='reset_password_button'>
                            <button type='submit' className='reset_password_btn' disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
