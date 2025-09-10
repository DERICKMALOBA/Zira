// src/components/OfficerHeader.jsx
import { Menu, Bell, User } from 'lucide-react';

const OfficerHeader = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 mr-4 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Officer Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Bell className="h-6 w-6" />
            <span className="absolute top-2 right-2 block h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">O</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Loan Officer</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default OfficerHeader;