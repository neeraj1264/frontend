import React, { useState, useEffect } from "react";
import "./Advance.css";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";

const Advance = ({ orders, setOrders }) => {
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [password, setPassword] = useState("");
  const [isAdvancedAccessGranted, setIsAdvancedAccessGranted] = useState(false);
  const [advancedCheckboxState, setAdvancedCheckboxState] = useState(false);
  const navigate = useNavigate();

  const HARD_CODED_PASSWORD = "1947"; // Hardcoded password

  useEffect(() => {
    const advancedFeatureAccess = localStorage.getItem("advancedFeature");
    
    if (advancedFeatureAccess === "true") {
      setIsAdvancedAccessGranted(true);
      setAdvancedCheckboxState(true);
    }
  }, []);

  const handlePasswordSubmit = () => {
    if (password === HARD_CODED_PASSWORD) {
      setIsAdvancedAccessGranted(true);
      setAdvancedCheckboxState(true);
      setShowPasswordPopup(false);
      localStorage.setItem("advancedFeature", "true");
      alert("Access granted!");
    } else {
      alert("Incorrect password. Try again.");
    }
  };

  const handleAdvancedCheckboxClick = () => {
    if (advancedCheckboxState) {
      setAdvancedCheckboxState(false);
      setIsAdvancedAccessGranted(false);
      localStorage.removeItem("advancedFeature");
      alert("Access removed!");
    } else {
      setShowPasswordPopup(true);
    }
  };

  return (
    <>
      <Header />
      <div className="advance-page">
        {/* Advanced Features Checkbox */}
        <div className="checkbox-container">
          <label>
            <input
              type="checkbox"
              checked={advancedCheckboxState}
              onChange={handleAdvancedCheckboxClick}
            />
            <h4>Access Advanced Features</h4>
          </label>
        </div>

        {/* Password Popup */}
        {showPasswordPopup && (
          <div className="advance-password-popup">
            <div className="popup-content">
              <h3>Enter Password</h3>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button onClick={handlePasswordSubmit}>Submit</button>
              <button onClick={() => setShowPasswordPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Advance;
