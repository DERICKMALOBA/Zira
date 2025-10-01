import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from "../../supabaseClient";

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const roles = [
    { value: "admin", label: "Admin" },
    { value: "operation_officer", label: "Operation Officer" },
    { value: "regional_manager", label: "Regional Manager" },
    { value: "relationship_officer", label: "Relationship Officer" },
    { value: "customer_service_officer", label: "Customer Service Officer" },
    { value: "credit_analyst_officer", label: "Credit Analyst Officer" },
    { value: "branch_manager", label: "Branch Manager" },
  ];

  const roleRequiresBranchRegion = (role) => {
    return role && role !== 'admin' && role !== 'operation_officer';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchBranches(),
      fetchRegions()
    ]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        created_at,
        profiles (
          branch_id,
          region_id,
          branches (id, name),
          regions (id, name)
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped = data.map((u) => ({
        ...u,
        branch_id: u.profiles?.branch_id,
        region_id: u.profiles?.region_id,
        branches: u.profiles?.branches,
        regions: u.profiles?.regions,
      }));
      setUsers(mapped);
    }
  };

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*");
    if (data) setBranches(data);
  };

  const fetchRegions = async () => {
    const { data } = await supabase.from("regions").select("*");
    if (data) setRegions(data);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({});
  };

  const handleUpdate = async () => {
    try {
      const requiresBranchRegion = roleRequiresBranchRegion(formData.role);

      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name?.trim(),
          email: formData.email?.trim(),
          role: formData.role,
          phone: formData.phone?.trim() || null,
        })
        .eq("id", editingUser.id);

      if (userError) throw userError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          branch_id: requiresBranchRegion ? (formData.branch_id || null) : null,
          region_id: requiresBranchRegion ? (formData.region_id || null) : null,
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      await fetchUsers();
      closeModal();
      alert('User updated successfully!');
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await supabase.from("profiles").delete().eq("id", id);
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      await fetchUsers();
      alert('User deleted successfully!');
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesRegion = !filterRegion || user.region_id === filterRegion;
    const matchesBranch = !filterBranch || user.branch_id === filterBranch;

    return matchesSearch && matchesRole && matchesRegion && matchesBranch;
  });

  const clearFilters = () => {
    setFilterRole('');
    setFilterRegion('');
    setFilterBranch('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
      

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {(filterRole || filterRegion || filterBranch) && (
                <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Regions</option>
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">A</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">M</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role?.includes('manager')).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">O</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Officers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role?.includes('officer')).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {roles.find(r => r.value === user.role)?.label || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {roleRequiresBranchRegion(user.role) 
                      ? (user.branches?.name || 'N/A')
                      : <span className="italic text-gray-400">All Branches</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {roleRequiresBranchRegion(user.role)
                      ? (user.regions?.name || 'N/A')
                      : <span className="italic text-gray-400">All Regions</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {roleRequiresBranchRegion(formData.role) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      value={formData.region_id || ''}
                      onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Region</option>
                      {regions.map(region => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    <select
                      value={formData.branch_id || ''}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}