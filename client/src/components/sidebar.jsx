// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Calculator,
  Settings,
  Users,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Book,
  CreditCard,
  Landmark,
  FileCheck,
  Target,
  FolderOpen,
  UserCheck,
  PhoneCall,
  UserCog,
  UserPlus,
  ClipboardList,
  CheckCircle,
  PieChart,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      name: 'Accounting',
      href: '/accounting',
      icon: Calculator,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      children: [
        { name: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: BookOpen },
        { name: 'Journals', href: '/accounting/journals', icon: Book },
        { name: 'Transactions', href: '/accounting/transactions', icon: CreditCard },
        { name: 'Bank Reconciliations', href: '/accounting/bank-reconciliations', icon: Landmark },
      ],
    },
    {
      name: 'Credit Settings',
      href: '/credit-settings',
      icon: Settings,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      children: [
        { name: 'Document Settings', href: '/credit-settings/document-settings', icon: FileCheck },
        { name: 'KPI Categories', href: '/credit-settings/kpi-categories', icon: Target },
      ],
    },
    {
      name: 'Registry',
      href: '/registry',
      icon: Users,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      children: [
        { name: 'Customers', href: '/registry/customers', icon: Users },
        { name: 'Pending Amendments', href: '/registry/pending-amendments', icon: FolderOpen },
        { name: 'Approvals Pending', href: '/registry/approvals-pending', icon: UserCheck },
        { name: 'Callbacks Pending', href: '/registry/callbacks-pending', icon: PhoneCall },
        { name: 'Customer Transfer', href: '/registry/customer-transfer', icon: UserCog },
        { name: 'Customer Categories', href: '/registry/customer-categories', icon: UserPlus },
        { name: 'Customer Edits', href: '/registry/customer-edits', icon: ClipboardList },
      ],
    },
   {
  name: 'Loaning',
  href: '/loaning',
  icon: FileText,
  color: 'text-red-400',
  bgColor: 'bg-red-400/10',
  children: [
    { name: 'Loans', href: '/loaning/all', icon: FileText },
    { name: 'Loan Approval', href: '/loaning/loan-approval', icon: CheckCircle },
    { name: 'Loan Pending Branch Manager', href: '/loaning/pending-branch-manager', icon: FileText },
    { name: 'Loan Pending Regional Manager', href: '/loaning/pending-regional-manager', icon: FileText },
    { name: 'Loan Pending Disbursement', href: '/loaning/pending-disbursement', icon: FileText },
    { name: 'Disbursement Loans', href: '/loaning/disbursement-loans', icon: FileText },
    { name: 'Rejected Loans', href: '/loaning/rejected-loans', icon: FileText },
  ],
}
,
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      children: [
        { name: 'Call Center Reports', href: '/reports/call-center-reports', icon: PieChart },
        { name: 'HQ Reports', href: '/reports/hq-reports', icon: TrendingUp },
      ],
    },
  ];

  return (
    <div className="h-full bg-gray-900 text-white w-64 overflow-y-auto border-r border-gray-800 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Zira Lending</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors md:hidden"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <div key={item.name} className="relative">
       
         {/* Main Navigation Item */}
{item.children ? (
  <div
    onClick={() => toggleItem(item.name)}
    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
      expandedItems[item.name] || window.location.pathname.startsWith(item.href)
        ? 'bg-gray-800 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <div className="flex items-center">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-3 ${item.bgColor}`}>
        <item.icon className={`h-4 w-4 ${item.color}`} />
      </div>
      <span className="text-sm font-medium">{item.name}</span>
    </div>

    <div className="text-gray-400 group-hover:text-white">
      {expandedItems[item.name] ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </div>
  </div>
) : (
  <NavLink
    to={item.href}
    className={({ isActive }) =>
      `group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-gray-800 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`
    }
  >
    <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-3 ${item.bgColor}`}>
      <item.icon className={`h-4 w-4 ${item.color}`} />
    </div>
    <span className="text-sm font-medium">{item.name}</span>
  </NavLink>
)}

            {/* Submenu Items */}
            {item.children && (
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedItems[item.name] ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="ml-4 pl-6 mt-1 space-y-1 border-l border-gray-700">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={child.href}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                          isActive
                            ? 'bg-indigo-900/30 text-indigo-200 border-l-2 border-indigo-500'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                        }`
                      }
                    >
                      {child.icon && <child.icon className="h-3.5 w-3.5 mr-2.5" />}
                      <span>{child.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;