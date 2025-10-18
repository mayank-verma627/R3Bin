// components/TestAuth.tsx
import { useState } from "react";
import { supabase } from "./supabase";

export default function TestAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const testSignUp = async () => {
    setMessage("");
    setError("");
    console.log("Attempting signup with:", email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error("Signup error:", error);
        setError(`Error: ${error.message} (Code: ${error.status})`);
      } else {
        console.log("Signup success:", data);
        setMessage("Success! Check console for details.");
      }
    } catch (err: any) {
      console.error("Catch block error:", err);
      setError(`Caught error: ${err.message}`);
    }
  };

  const testSignIn = async () => {
    setMessage("");
    setError("");
    console.log("Attempting signin with:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Signin error:", error);
        setError(`Error: ${error.message}`);
      } else {
        console.log("Signin success:", data);
        setMessage("Login successful!");
      }
    } catch (err: any) {
      console.error("Catch block error:", err);
      setError(`Caught error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Test</h1>
      
      <div className="mb-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={testSignUp}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Test Sign Up
        </button>
        <button
          onClick={testSignIn}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Sign In
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p className="font-bold mb-1">Open browser console (F12) to see detailed logs</p>
        <p className="text-gray-600">Check for any CORS or network errors</p>
      </div>
    </div>
  );
}