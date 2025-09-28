// src/components/Header.jsx
import { Bars3Icon, UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../hooks/userAuth";

const Headerrm = ({ sidebarOpen, setSidebarOpen }) => {
  const { profile, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadgeColor = (role) => {
    const colors = {
      regional_manager: "bg-secondary/10 text-secondary border-secondary/20",
      admin: "bg-danger/10 text-danger border-danger/20",
      manager: "bg-primary/10 text-primary border-primary/20",
      agent: "bg-green-100 text-green-700 border-green-200",
      default: "bg-background text-text border-gray-300",
    };
    return colors[role] || colors.default;
  };

  const getRoleDisplayName = (role) => {
    const names = {
      regional_manager: "Regional Manager",
      admin: "Administrator",
      manager: "Branch Manager",
      agent: "Loan Agent",
    };
    return names[role] || role;
  };

  return (
    <header className="bg-background border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-text hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 group md:hidden"
          >
            <Bars3Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <h1 className="text-xl font-heading bg-gradient-to-r from-text to-gray-600 bg-clip-text text-transparent">
              Zira Lending
            </h1>
          </div>
        </div>

        {/* Right Section - User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile?.full_name}
                    className="h-9 w-9 rounded-full border-2 border-background shadow-sm"
                  />
                ) : (
                  <div className="h-9 w-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
                    <UserCircleIcon className="h-7 w-7 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1">
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-background ${
                      profile?.status === "online" ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </div>
              </div>

              <div className="hidden md:flex flex-col items-start text-left">
                <span className="font-semibold text-text text-sm leading-tight">
                  {profile?.name}
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  {getRoleDisplayName(profile?.role)}
                </span>
              </div>
            </div>

            <ChevronDownIcon
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-background rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in-80 slide-in-from-top-2">
              {/* Profile Header in Dropdown */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile?.full_name}
                      className="h-11 w-11 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-11 w-11 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-9 w-9 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text truncate">{profile?.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                      profile?.role
                    )}`}
                  >
                    {getRoleDisplayName(profile?.role)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {profile?.lastLogin ? `Last login: ${profile.lastLogin}` : "Active now"}
                  </span>
                </div>
              </div>

              {/* Role-specific Information */}
              <div className="px-4 py-3 border-b border-gray-200">
                {profile?.role === "regional_manager" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Region:</span>
                      <span className="font-medium text-text">{profile?.region}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Branches:</span>
                      <span className="font-medium text-text">{profile?.branchCount || "All"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Branch:</span>
                      <span className="font-medium text-text">{profile?.branch}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Employee ID:</span>
                      <span className="font-medium text-text">{profile?.employeeId || "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Menu */}
              <div className="py-2">
                <button className="w-full text-left px-4 py-2 text-sm text-text hover:bg-primary/5 transition-colors duration-150">
                  My Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-text hover:bg-primary/5 transition-colors duration-150">
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-text hover:bg-primary/5 transition-colors duration-150">
                  Help & Support
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors duration-150 font-medium"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Headerrm;
