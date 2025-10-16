import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, Search, AlertTriangle } from "lucide-react";

const InactiveCustomers = () => {
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [days, setDays] = useState(30);

  // Fetch inactive customers
  const fetchInactiveCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // ✅ Call Supabase RPC function
      const { data, error } = await supabase.rpc("get_inactive_customers", {
        days,
      });

      if (error) throw error;
      setInactiveCustomers(data || []);
    } catch (err) {
      console.error("Error fetching inactive customers:", err.message);
      setErrorMsg("Failed to load inactive customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveCustomers();
  }, [days]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Inactive Customers
          </h1>
          <div className="flex items-center space-x-2">
            <label className="text-gray-600 text-sm">Inactivity Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-1.5 text-gray-700 focus:ring focus:ring-indigo-300"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <button
              onClick={fetchInactiveCustomers}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Search size={16} className="mr-2" /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <Loader2 size={32} className="animate-spin mr-3" />
            Loading inactive customers...
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center">
            <AlertTriangle className="mr-2" /> {errorMsg}
          </div>
        ) : inactiveCustomers.length === 0 ? (
          <div className="text-center text-gray-600 py-20">
            No inactive customers found for the last {days} days.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-indigo-100 text-gray-800">
                <tr>
                  <th className="px-4 py-2">No</th>
                  <th className="px-4 py-2">Customer Name</th>
                  <th className="px-4 py-2">Mobile</th>
                  <th className="px-4 py-2">ID Number</th>
                  <th className="px-4 py-2">Branch</th>
                  <th className="px-4 py-2">Loan Officer</th>
                  <th className="px-4 py-2">Disbursement Date</th>
                  <th className="px-4 py-2">Created Date</th>
                  <th className="px-4 py-2">Inactive Days</th>
                </tr>
              </thead>
              <tbody>
                {inactiveCustomers.map((cust, index) => (
                  <tr
                    key={cust.customer_id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{cust.customer_name}</td>
                    <td className="px-4 py-2">{cust.mobile}</td>
                    <td className="px-4 py-2">{cust.national_id}</td>
                    <td className="px-4 py-2">{cust.branch_name || "-"}</td>
                    <td className="px-4 py-2">{cust.loan_officer || "-"}</td>
                    <td className="px-4 py-2">
                      {cust.disbursement_date
                        ? new Date(cust.disbursement_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(cust.account_created).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 font-semibold text-red-600">
                      {cust.inactive_days} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InactiveCustomers;
