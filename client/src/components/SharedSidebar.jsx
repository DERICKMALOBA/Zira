// src/components/SharedSidebar.jsx
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Calculator,
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
  FolderOpen,
  UserCheck,
  PhoneCall,
  Handshake,
  UserPlus,
  ClipboardList,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from "../hooks/userAuth"; 

const SharedSidebar = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useAuth();
  const location = useLocation();

  const toggleItem = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setExpandedItems({});
    }
  };

  // Auto-expand parent when child is active
  useEffect(() => {
    getNavigation().forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => 
          location.pathname === child.href || location.pathname.startsWith(child.href + '/')
        );
        if (isChildActive) {
          setExpandedItems(prev => ({
            ...prev,
            [item.name]: true
          }));
        }
      }
    });
  }, [location.pathname, profile?.role]);

  const getNavigation = () => {
    const isOfficer = profile?.role === 'relationship_officer';
    
    const baseNavigation = [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: Home,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
    ];

    // Officer-specific navigation items
    const officerNavigation = isOfficer ? [
      {
        name: 'Leads',
        href: '/officer/leads',
        icon: UserPlus,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        name: 'My Customers',
        href: '/officer/customers',
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        children: [
          { name: 'View Customers', href: '/officer/customers', icon: Users },
          { name: 'Add Customer', href: '/officer/customers/add', icon: UserPlus },
          { name: 'Pending Amendments', href: '/officer/customers/amendments', icon: ClipboardList },
          { name: 'Customer Drafts', href: '/officer/customers/drafts', icon: FileText },
        ],
      },
      {
        name: 'My Loans',
        href: '/officer/loans',
        icon: FileText,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        children: [
          { name: 'Loan Applications', href: '/officer/loans/applications', icon: FileText },
          { name: 'All Loans', href: '/officer/loans', icon: FileSpreadsheet },
          { name: 'Loan Drafts', href: '/officer/loans/drafts', icon: FileText },
        ],
      },
      {
        name: 'Performance',
        href: '/officer/conversions',
        icon: TrendingUp,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
      },
    ] : [];

    const sharedNavigation = [
      {
        name: 'Accounting',
        href: '/accounting',
        icon: Calculator,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        children: [
          { name: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: BookOpen },
          { name: 'Journals', href: '/accounting/journals', icon: Book },
          { name: 'Transactions', href: '/accounting/transactions', icon: CreditCard },
          { name: 'Bank Reconciliations', href: '/accounting/bank-reconciliations', icon: Landmark },
        ],
      },
      {
        name: 'Registry',
        href: '/registry',
        icon: Users,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        children: [
          { name: 'Customers', href: '/registry/customers', icon: Users },
          { name: 'Pending Amendments', href: '/registry/pending-amendments', icon: FolderOpen },
          { name: 'Approvals Pending', href: '/registry/approvals-pending', icon: UserCheck },
          ...(profile?.role === "customer_service_officer" 
            ? [{ name: 'Callbacks Pending', href: '/registry/callbacks-pending', icon: PhoneCall }] 
            : []),
        ],
      },
      {
        name: 'Loaning',
        href: '/loaning',
        icon: FileText,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        children: [
          { name: 'All Loans', href: '/loaning/all', icon: FileText },
          { name: 'Pending Branch Manager', href: '/loaning/pending-branch-manager', icon: FileText },
          { name: 'Pending Regional Manager', href: '/loaning/pending-regional-manager', icon: FileText },
          { name: 'Pending Disbursement', href: '/loaning/pending-disbursement', icon: FileText },
          { name: 'Disbursed Loans', href: '/loaning/disbursement-loans', icon: FileText },
          { name: 'Rejected Loans', href: '/loaning/rejected-loans', icon: FileText },
        ],
      },
      {
        name: 'Drafts',
        href: '/drafts',
        icon: FileText,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        children: [
          {
            name: 'Customer Verification Drafts',
            href: '/drafts/customers',
            icon: UserCheck,
          },
        ],
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        children: [
          { 
            name: 'All Reports', 
            href: '/reports/all', 
            icon: FileText,
          },
          { 
            name: 'PTP Reports', 
            href: '/reports/ptp', 
            icon: Handshake,
          },
        ],
      },
    ];

    return [...baseNavigation, ...officerNavigation, ...sharedNavigation];
  };

  const navigation = getNavigation();

  return (
    <div className={`h-full bg-green-50 text-gray-800 border-r border-green-200 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    } flex-shrink-0 relative flex flex-col overflow-hidden`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-green-200 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Jasiri Lending 
            </span>
          </div>
        )}
        
        {/* Toggle Button - Always visible */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-green-100 border border-green-200 text-gray-700 hover:text-green-700 hover:bg-green-200 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigation.map((item) => (
          <div key={item.name} className="relative">
            {/* Main Navigation Item */}
            {item.children ? (
              <div
                onClick={() => !isCollapsed && toggleItem(item.name)}
                className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  (expandedItems[item.name] || location.pathname.startsWith(item.href)) && !isCollapsed
                    ? 'bg-green-200 shadow-lg border border-green-200'
                    : 'bg-transparent hover:bg-green-100 hover:shadow-md hover:border hover:border-green-200'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    item.bgColor
                  } ${isCollapsed ? 'mr-0' : 'mr-3'}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  {!isCollapsed && (
                    <span className="text-sm font-semibold">{item.name}</span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="text-gray-500 group-hover:text-gray-700 transition-colors">
                    {expandedItems[item.name] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-green-200 shadow-lg border border-green-200'
                      : 'bg-transparent hover:bg-green-100 hover:shadow-md hover:border hover:border-green-200'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  item.bgColor
                } ${isCollapsed ? 'mr-0' : 'mr-3'}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-semibold">{item.name}</span>
                )}
              </NavLink>
            )}

            {/* Submenu Items - Only show when not collapsed */}
            {item.children && !isCollapsed && (
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedItems[item.name] ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="ml-4 pl-6 mt-2 space-y-1 border-l-2 border-green-200">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={child.href}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-300 ${
                          isActive
                            ? 'bg-green-200 text-green-800 border-l-2 border-green-500 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-green-100 hover:shadow-sm'
                        }`
                      }
                    >
                      {child.icon && (
                        <child.icon className="h-4 w-4 mr-3 text-gray-500" />
                      )}
                      <span className="font-medium">{child.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-green-200 flex-shrink-0">
        {/* App Version/Info - Only show when expanded */}
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Jasiri Lending v1.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {profile?.role ? `${profile.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Collapsed State Tooltip */}
      {isCollapsed && (
        <div className="absolute left-full top-2 ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 z-50">
          Navigation Menu
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default SharedSidebar;