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

  const currentYear = new Date().getFullYear();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Authentication failed");

      const userId = authData.user.id;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("id", userId)
        .maybeSingle();
      if (userError) throw userError;
      if (!userData) throw new Error("No user data found");

      const { data: basicProfile, error: basicError } = await supabase
        .from("profiles")
        .select("branch_id, region_id")
        .eq("id", userId)
        .single();
      if (basicError) throw basicError;

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

      setUser(authData.user);
      setProfile(profileData);

      switch (userData.role) {
        case "relationship_officer":
          navigate("/dashboard");
          break;
        case "admin":
          navigate("/dashboard/admin");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Section */}
        <div className="flex flex-col justify-center items-center p-10 bg-gradient-to-br from-green-100 via-emerald-100 to-green-50">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-3">Jasiri </h1>
            <p className="text-sm text-gray-600 tracking-wide mb-6">
              Lending Software
            </p>
            <div className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto">
              {/* Placeholder for your logo */}
              <img src="/logo.png" alt="Jasiri Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="mt-8">
            <img
              src="/team-illustration.png"
              alt="Team Illustration"
              className="w-72 object-contain mx-auto"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign In</h2>
          <form onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="mt-4 text-center">
              <a href="#" className="text-sm text-green-600 hover:text-green-800">
                Forgot Password?
              </a>
            </div>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            © {currentYear} Jasiri Lending Software. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
