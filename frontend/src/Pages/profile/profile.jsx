import React from "react";
import "./profile.css";
const Profile = () => {
  return (
    <div className="profile-container">
      <div className="profile_page_header">
        <h1 className="profile_header">Profile</h1>
      </div>
      <div className="profile_content">
        <div className="profile_photo_content">
          <div className="profile_photo1">
        

          </div>
          <div className="profile_edit">
            <button className="edit_button1">Change Photo</button>
          </div>
        </div>

        <div className="profile_details">
          <form className="profile_form">
            <div className="profile_form_content">
              <label htmlFor="name" className="profile_label">
                Name:
              </label>
              <input
                type="text"
                name="name"
                // value={formData.name}
                // onChange={handleChange}
                className="profile_input"
                required
              />
            </div>
            <div className="profile_form_content">
              <label htmlFor="name" className="profile_label">
                Email:
              </label>
              <input
                type="email"
                name="email"
                // value={formData.name}
                // onChange={handleChange}
                className="profile_input"
                required
              />
            </div>

            <div className="profile_form_content">
              <label htmlFor="name" className="profile_label">
                Contact:
              </label>
              <input
                type="tel"
                name="contact"
                // value={formData.name}
                // onChange={handleChange}
                className="profile_input"
                required
              />
            </div>
            <div className="profile_form_content">
              <label htmlFor="name" className="profile_label">
                Role:
              </label>
              <input
                type="text"
                name="role"
                // value={formData.name}
                // onChange={handleChange}
                className="profile_input"
                disabled
                required
              />
            </div>
            <div className="profile_btn">
              <button type="submit" className="profile_submit">
                Update
              </button>
              <button type="cancel" className="profile_submit">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
