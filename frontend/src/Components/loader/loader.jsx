import React from "react";
import "./loader.css";

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="loader-container">
      <div className="loader"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loader;
