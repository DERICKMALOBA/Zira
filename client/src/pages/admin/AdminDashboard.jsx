
import {
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Coins,
  UserPlus,
  CheckCircle,
  FileBarChart,
  Settings,
  Shield,
  Activity,
  Clock,
  XCircle,
  CreditCard,
} from 'lucide-react';

const AdminDashboard = () => {
 

  // Statistics Data
  const stats = [
    { 
      name: 'Total Users', 
      value: '2,847', 
      change: '+12.5%', 
      icon: Users, 
      color: 'bg-blue-500', 
      changeType: 'positive',
      description: 'Active system users'
    },
    { 
      name: 'Active Loans', 
      value: '1,234', 
      change: '+8.2%', 
      icon: FileText, 
      color: 'bg-green-500', 
      changeType: 'positive',
      description: 'Currently running'
    },
    { 
      name: 'Total Disbursed', 
      value: 'KES 45.2M', 
      change: '+15.3%', 
      icon: DollarSign, 
      color: 'bg-purple-500', 
      changeType: 'positive',
      description: 'This month'
    },
    { 
      name: 'Outstanding', 
      value: 'KES 12.8M', 
      change: '-3.1%', 
      icon: AlertTriangle, 
      color: 'bg-orange-500', 
      changeType: 'negative',
      description: 'Pending collection'
    },
    { 
      name: 'Repayment Rate', 
      value: '94.5%', 
      change: '+2.1%', 
      icon: TrendingUp, 
      color: 'bg-cyan-500', 
      changeType: 'positive',
      description: 'On-time payments'
    },
    { 
      name: 'Revenue (MTD)', 
      value: 'KES 3.2M', 
      change: '+18.7%', 
      icon: Coins, 
      color: 'bg-indigo-500', 
      changeType: 'positive',
      description: 'Interest & fees'
    },
  ];

  // Recent Activity Data
  const recentActivity = [
    { 
      action: 'Loan Approved', 
      user: 'John Doe', 
      details: 'KES 50,000', 
      time: '5 mins ago', 
      type: 'success',
      icon: CheckCircle
    },
    { 
      action: 'User Added', 
      user: 'Jane Smith', 
      details: 'Loan Officer', 
      time: '15 mins ago', 
      type: 'info',
      icon: UserPlus
    },
    { 
      action: 'Payment Received', 
      user: 'Mike Johnson', 
      details: 'KES 10,000', 
      time: '1 hour ago', 
      type: 'success',
      icon: CreditCard
    },
    { 
      action: 'Fraud Alert', 
      user: 'System', 
      details: 'Multiple login attempts', 
      time: '2 hours ago', 
      type: 'warning',
      icon: AlertTriangle
    },
    { 
      action: 'Loan Rejected', 
      user: 'Sarah Williams', 
      details: 'Low credit score', 
      time: '3 hours ago', 
      type: 'error',
      icon: XCircle
    },
    { 
      action: 'Settings Updated', 
      user: 'Admin', 
      details: 'Interest rate changed', 
      time: '4 hours ago', 
      type: 'info',
      icon: Settings
    },
  ];

  // Pending Actions
  const pendingActions = [
    { 
      title: 'Pending Loan Approvals', 
      count: 45, 
      priority: 'high',
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    { 
      title: 'Password Reset Requests', 
      count: 12, 
      priority: 'medium',
      icon: Shield,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    { 
      title: 'Overdue Loans', 
      count: 78, 
      priority: 'high',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      title: 'System Alerts', 
      count: 3, 
      priority: 'low',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
  ];

  // Quick Actions
  const quickActions = [
    { 
      name: 'Add User', 
      icon: UserPlus, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBorder: 'hover:border-blue-300'
    },
    { 
      name: 'Approve Loan', 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverBorder: 'hover:border-green-300'
    },
    { 
      name: 'Generate Report', 
      icon: FileBarChart, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBorder: 'hover:border-purple-300'
    },
    { 
      name: 'System Settings', 
      icon: Settings, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverBorder: 'hover:border-red-300'
    },
    { 
      name: 'View Analytics', 
      icon: TrendingUp, 
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      hoverBorder: 'hover:border-cyan-300'
    },
    { 
      name: 'Security Center', 
      icon: Shield, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      hoverBorder: 'hover:border-yellow-300'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
     
   
      <div className="flex-1 flex flex-col overflow-hidden">
      
       
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Page Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">System Overview</h2>
              <p className="text-gray-600 mt-1">Monitor and manage all lending operations</p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {stats.map((stat) => (
                <div 
                  key={stat.name} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </p>
                        <p className="text-xs text-gray-500">{stat.description}</p>
                      </div>
                    </div>
                    <div className={`${stat.color} w-14 h-14 rounded-xl flex items-center justify-center ml-4 flex-shrink-0`}>
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {pendingActions.map((action, index) => (
                <div 
                  key={index}
                  className={`${action.bgColor} rounded-xl p-5 border-2 border-transparent hover:border-gray-200 transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      action.priority === 'high' ? 'bg-red-100 text-red-700' :
                      action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {action.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">{action.title}</p>
                  <p className={`text-2xl font-bold ${action.color}`}>{action.count}</p>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div 
                      key={index} 
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'success' ? 'bg-green-100' :
                        activity.type === 'warning' ? 'bg-yellow-100' :
                        activity.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <activity.icon className={`h-5 w-5 ${
                          activity.type === 'success' ? 'text-green-600' :
                          activity.type === 'warning' ? 'text-yellow-600' :
                          activity.type === 'error' ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          <span className="font-medium">{activity.user}</span>
                          {' • '}
                          {activity.details}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <button 
                      key={index}
                      className={`w-full p-4 border-2 border-gray-200 rounded-lg ${action.hoverBorder} hover:shadow-sm transition-all duration-200 text-left group`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`${action.bgColor} w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <action.icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{action.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* System Health Status */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-6 w-6" />
                    <h3 className="text-xl font-bold">System Health</h3>
                  </div>
                  <p className="text-red-100">All systems operational • Last checked: Just now</p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">API Services</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Payment Gateway</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold">Online</span>
                  </div>
                  <span className="text-xs text-red-100">Uptime: 99.98%</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;