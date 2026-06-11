import React, { useState } from "react";
import "./forgotPassword.css";
import { forgotPassword } from "../../api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setMessage("Reset link sent to your email.");
        setEmail("");
      } else {
        setError(res.message || "Failed to send reset link.");
      }
    } catch  {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="forgot_password_container">
      <div className="forgot_password">
        <div className="forgot_password_header">
          <h3 className="header3">Forgot Password</h3>
        </div>
        <div className="forgot_password_content">
          {message && <p className="success">{message}</p>}
          {error && <p className="login-error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="forgot_password_input">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="forgot_password_button">
              <button className="send_mail" type="submit">
                Send Mail
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
