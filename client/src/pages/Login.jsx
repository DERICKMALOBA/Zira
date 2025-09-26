// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/userAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setProfile } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign in user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setError("Authentication failed");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      console.log("Authenticated user ID:", userId);

      // Get user data from users table (name, role, email, etc.)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("User data error:", userError);
        setError(`User data error: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!userData) {
        setError("No user data found");
        setLoading(false);
        return;
      }

      // Get profile data (branch_id and region_id) from profiles table
      const { data: basicProfile, error: basicError } = await supabase
        .from("profiles")
        .select("branch_id, region_id")
        .eq("id", userId)
        .single();

      if (basicError) {
        console.error("Basic profile error:", basicError);
        setError(`Profile error: ${basicError.message}`);
        setLoading(false);
        return;
      }

      if (!basicProfile) {
        setError("No profile found for this user");
        setLoading(false);
        return;
      }

      // Fetch related data separately if needed
      let branchName = "N/A";
      let regionName = "N/A";

      if (basicProfile?.branch_id) {
        const { data: branchData } = await supabase
          .from("branches")
          .select("name")
          .eq("id", basicProfile.branch_id)
          .single();
        branchName = branchData?.name || "N/A";
      }

      if (basicProfile?.region_id) {
        const { data: regionData } = await supabase
          .from("regions")
          .select("name")
          .eq("id", basicProfile.region_id)
          .single();
        regionName = regionData?.name || "N/A";
      }

      const profileData = {
        id: userData.id,
        name: userData.full_name,
        email: userData.email,
        role: userData.role,
        branch_id: basicProfile?.branch_id || null,
        region_id: basicProfile?.region_id || null,
        branch: branchName,
        region: regionName,
      };

      // Update context
      setUser(authData.user);
      setProfile(profileData);

      // Redirect based on role
      switch (userData.role) {
        case "relationship_officer":
          navigate("/officer");
          break;
        case "branch_manager":
          navigate("/dashboard/bm");
          break;
        case "regional_manager":
          navigate("/dashboard/rm");
          break;
        case "credit_analyst_officer":
          navigate("/dashboard/ca");
          break;
        case "customer_service_officer":
          navigate("/dashboard/cs");
          break;
        default:
          setError(`Unauthorized role: ${userData.role}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}