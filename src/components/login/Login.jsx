import React, { useState } from "react";
import "./Login.css"

const Login = ({ setBaseUrl }) => {
  const [number, setnumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const USERS = [
    {
      number: "7015823645",
      password: "1234",
      baseUrl: "https://invoice-backend-7czy.vercel.app/api",
    },
    {
      number: "8168901827",
      password: "1234",
      baseUrl: "https://backend-alpha-tawny.vercel.app/api",
    },
  ];

  const handleLogin = () => {
    const user = USERS.find(
      (u) => u.number === number && u.password === password
    );

    if (user) {
      setBaseUrl(user.baseUrl); // Set BASE_URL dynamically
      localStorage.setItem("userBaseUrl", user.baseUrl); // Optional: Persist BASE_URL in localStorage
      alert("Login successful!");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-form">
      <h2>Login to continue</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="form">
      <div className="form-group">
      <label>Mobile</label>
      <input
        type="number"
        value={number}
        onChange={(e) => setnumber(e.target.value)}
      />
      </div>
      <div className="form-group">
      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      </div>
      </div>
      <button onClick={handleLogin} className="login-btn">Login</button>
    </div>
  );
};

export default Login;
