// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // fetch role & branch from your `users` table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, branch_id, region_id")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      setError("Profile not found");
      return;
    }

    // redirect by role
    switch (profile.role) {
      case "relationship_officer":
        navigate("/officer");
        break;
      case "branch_manager":
      case "regional_manager":
      case "credit_analyst":
      case "customer_service_officer":
        navigate("/dashboard");
        break;
      default:
        setError("Unauthorized role");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
