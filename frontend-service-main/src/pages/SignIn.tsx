// src/pages/SignIn.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, API_CONFIG } from "@/config/api";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Button clicked");

    // Example API call (replace with actual API)
    const response = await fetch(
      API_ENDPOINTS.DEPLOYMENTS.TENANT,
      {
        method: "GET",
        headers: {
          ...API_CONFIG.HEADERS,
          username: email,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Store JWT (or any response) in localStorage or context
      localStorage.setItem("token", email);
      console.log(`user-token: ${data.token}`);
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">PaaS on Kubernetes</h1>
        <p className="text-sm text-center mb-4">Deploy your backend pods and services in seconds</p>
        <h2 className="text-2xl font-semibold mb-6">Sign In</h2>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium">
              Username
            </label>
            <input
              type="name"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Sign In
          </button>

          <p className="mt-4 text-center">
            Don’t have an account?{" "}
            <a href="/signup" className="text-blue-500 hover:underline">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
