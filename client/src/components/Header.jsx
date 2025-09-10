// src/components/Header.jsx

import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 mr-4 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Zira Lending System</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <BellIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <span className="ml-2 text-sm font-medium text-gray-700">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header