"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats } from "@/hooks/useAdminStats";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  LifeBuoy,
  LogOut,
  Settings,
  Menu,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
function Sidebar({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "financial", label: "Financial Review", icon: DollarSign },
    { id: "rates", label: "Rates & Commission", icon: TrendingUp },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "support", label: "Support", icon: LifeBuoy },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-40 bg-gradient-to-b from-green-700 to-green-800 text-white p-6 transform transition-transform lg:transform-none z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 rounded w-8 h-8 flex items-center justify-center font-bold">
              L
            </div>
            <div>
              <div className="text-sm font-bold">Local Temp</div>
              <div className="text-xs opacity-75">Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto pr-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  activeSection === item.id
                    ? "bg-white text-green-700 font-semibold"
                    : "text-white hover:bg-green-600"
                }`}
                title={item.label}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-xs font-medium truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-white hover:bg-green-600 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================
function Header({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900"></h1>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// DASHBOARD PAGE - Main overview with key metrics and charts
// ============================================================================
function DashboardPage({ stats, activities, revenueTrends, loading }) {
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and key metrics</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <div className="text-2xl">📊</div>
            </div>
          </div>
          <div className="text-xs text-green-600">Real-time status</div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">£{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Platform total</p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <div className="text-2xl">💰</div>
            </div>
          </div>
          <div className="text-xs text-green-600">Platform earnings</div>
        </div>

        {/* Pending Payouts Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">Pending Payouts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingPayouts}</p>
              <p className="text-xs text-gray-500 mt-2">To be processed</p>
            </div>
            <div className="bg-yellow-100 rounded-lg p-3">
              <div className="text-2xl">⏳</div>
            </div>
          </div>
          <div className="text-xs text-yellow-600">Awaiting release</div>
        </div>

        {/* Disputes Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">Disputes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeDisputes}</p>
              <p className="text-xs text-gray-500 mt-2">Requires attention</p>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <div className="text-2xl">⚠️</div>
            </div>
          </div>
          <div className="text-xs text-red-600">{stats.activeDisputes} active</div>
        </div>
      </div>

      {/* Platform Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Platform Users
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-green-700 font-bold">L</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Total Locums</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeLocums}</p>
              </div>
              <p className="text-xs text-green-600 ml-12">
                ↑ Registered professionals
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-blue-700 font-bold">P</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Total Users</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <p className="text-xs text-blue-600 ml-12">
                Total platform accounts
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-green-700 font-bold">P</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Total Practices</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.activePractices}</p>
              </div>
              <p className="text-xs text-green-600 ml-12">
                ↑ Active registrations
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                Active This Week
              </p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeThisWeek}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent activity.
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                >
                  <div
                    className={`rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                      activity.type === "success" ? "bg-green-100" : "bg-blue-100"
                    }`}
                  >
                    {activity.type === "success" ? "✓" : "i"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600">{activity.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2}
              dot={{ fill: "#059669" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// USERS PAGE - User management and listing
// ============================================================================
function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          bookings_count:bookings(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const locumsCount = users.filter(u => u.user_type === 'locum').length;
  const practicesCount = users.filter(u => u.user_type === 'practice').length;

  const tabs = [`All Users (${users.length})`, `Locums (${locumsCount})`, `Practices (${practicesCount})` ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage locums and practice accounts</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 font-medium text-gray-700 border-b-2 border-green-600 text-green-600 whitespace-nowrap"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.user_type === "locum"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.user_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-green-600 hover:text-green-800 font-medium">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FINANCIAL REVIEW PAGE
// ============================================================================
function FinancialReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await (supabase
        .from('bookings')
        .select(`
            *,
            locum:profiles!bookings_locum_id_fkey(full_name),
            practice:profiles!bookings_practice_id_fkey(full_name),
            tickets(id, subject, description, status)
        `) as any)
        .in('payment_status', ['held', 'disputed'])
        .order('completed_at', { ascending: true });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (bookingId: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('release-funds', {
            body: { bookingId }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        toast({
            title: "Funds Released",
            description: "Payment has been transferred to the locum.",
        });
        fetchReviews(); // Refresh
    } catch (error: any) {
        toast({
            title: "Error",
            variant: "destructive",
            description: error.message
        });
    }
  };

  const handleRefund = async (bookingId: string) => {
    if (!confirm("Are you sure you want to issue a refund? This cannot be undone.")) return;
    try {
        const { data, error } = await supabase.functions.invoke('issue-refund', {
             body: { bookingId }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        toast({
            title: "Refund Issued",
            description: "Partial refund processed (admin fee retained).",
        });
        fetchReviews();
    } catch (error: any) {
        toast({
             title: "Error",
             variant: "destructive",
             description: error.message
        });
    }
  };

  if (loading) return <div className="p-6">Loading reviews...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Review</h1>
        <p className="text-gray-600">Review held payments and disputes</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date Completed</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Practice</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Locum</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Detail</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {reviews.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No payments requiring review</td>
                    </tr>
                )}
                {reviews.map((review) => (
                    <tr key={review.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(review.completed_at).toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                                {new Date(review.completed_at).toLocaleTimeString()}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{review.practice?.full_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{review.locum?.full_name}</td>
                        <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                review.payment_status === 'disputed' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                                {review.payment_status.toUpperCase()}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {(review as any).tickets && (review as any).tickets.length > 0 ? (
                                <div>
                                    <p className="font-semibold text-gray-900">{(review as any).tickets[0].subject}</p>
                                    <p>{(review as any).tickets[0].description}</p>
                                </div>
                            ) : (
                                '-'
                            )}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                            <Button size="sm" onClick={() => handleRelease(review.id)} className="bg-green-600 hover:bg-green-700">
                                Release
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRefund(review.id)}>
                                Refund
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// BOOKINGS PAGE - Booking management and statistics
// ============================================================================
function BookingsPage({ stats, bookingTrends }) {

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600">Overview of all platform bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
          <p className="text-xs text-green-600 mt-2">All time</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Active Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeBookings || 0}</p>
          <p className="text-xs text-blue-600 mt-2">Ongoing</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">User Growth</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeThisWeek}</p>
          <p className="text-xs text-gray-600 mt-2">Past 7 days</p>
        </div>
      </div>

      {/* Monthly Booking Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Monthly Booking Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bookingTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// PAYMENTS PAGE - Payment tracking and transaction history
// ============================================================================
function PaymentsPage({ stats, transactions }) {

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600">Track transactions and payouts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Total Processed</p>
          <p className="text-3xl font-bold text-gray-900">£{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Platform Commission (est 10%)</p>
          <p className="text-3xl font-bold text-gray-900">£{(stats.totalRevenue * 0.1).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Pending Payouts</p>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingPayouts}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Transaction History
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Practice
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Locum
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Practice Payment
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Admin Margin
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Locum Payout
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm text-gray-900">{tx.date}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {tx.practice}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{tx.locum}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  £{tx.practicePayment}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">
                  £{tx.adminMargin.toFixed(0)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  £{tx.locumPayout}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// RATES PAGE - Rate configuration and commission management
// ============================================================================
function RatesPage({ locumRates }) {

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rates & Commission</h1>
        <p className="text-gray-600">Manage pricing and admin margins</p>
      </div>

      {/* How It Works Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-2">How It Works</h3>
        <p className="text-sm text-gray-700">
          The locum sets their base rate. You can add an admin margin on top of
          that rate. The practice sees and pays the final price (base rate +
          admin margin). The locum receives their base rate, and the admin
          margin is your platform revenue.
        </p>
      </div>

      {/* Rate Configuration Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Rate Configuration
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Locum Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Locum Rate
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Admin Margin
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Final Price (Practice Pays)
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {locumRates.map((rate) => (
              <tr
                key={rate.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm text-gray-900">{rate.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  £{rate.baseRate}/hr
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">
                  +£{rate.adminMargin.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  £{rate.finalPrice.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-green-600 border border-green-600 rounded px-3 py-1 text-xs hover:bg-green-50">
                    Edit Margin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Example Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Example Breakdown
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <span className="text-gray-700">Locum Base Rate</span>
            <span className="font-bold text-gray-900">£100.00</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 bg-green-50 -mx-6 px-6 py-4">
            <span className="text-gray-700">Admin Margin (10%)</span>
            <span className="font-bold text-green-600">£10.00</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-700">Final Price (Practice Pays)</span>
            <span className="font-bold text-gray-900">£110.00</span>
          </div>
          <div className="text-center py-2 text-gray-500 text-sm">═</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REPORTS PAGE - Analytics and reporting
// ============================================================================
function ReportsPage({ stats, revenueTrends, bookingTrends }) {

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Revenue trends and platform usage</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Revenue Growth
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Volume Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Booking Volume
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Key Metrics Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-600 text-sm">Avg Booking Value</p>
            <p className="text-2xl font-bold text-gray-900">£{(stats.totalRevenue / (stats.totalBookings || 1)).toFixed(0)}</p>
            <p className="text-xs text-green-600 mt-1">Platform average</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Active This Week</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeThisWeek}</p>
            <p className="text-xs text-green-600 mt-1">New registrations</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Locum Pool</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeLocums}</p>
            <p className="text-xs text-gray-600 mt-1">
              Verified professionals
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Practice Pool</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activePractices}</p>
            <p className="text-xs text-green-600 mt-1">
              Registered clinics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUPPORT PAGE - Support tickets and customer service
// ============================================================================
function SupportPage({ tickets, loading, updateTicketStatus }) {

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600">Manage tickets and user inquiries</p>
      </div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Open Tickets</p>
          <p className="text-3xl font-bold text-gray-900">{openTickets}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Resolved Total</p>
          <p className="text-3xl font-bold text-green-600">{resolvedTickets}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Total Tickets</p>
          <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
        </div>
      </div>

      {/* Recent Support Tickets */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            Support Tickets
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {tickets.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No tickets found.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="px-6 py-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{ticket.creator_name}</p>
                  <p className="text-sm font-medium text-gray-800">{ticket.subject}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{ticket.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                      ticket.status === "open"
                        ? "bg-amber-100 text-amber-700"
                        : ticket.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ticket.status}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  {ticket.status === 'open' && (
                    <button 
                      onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                      className="bg-green-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-green-700 whitespace-nowrap"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ADMIN PANEL COMPONENT
// ============================================================================
export default function AdminPanel() {
  const { stats, tickets, activities, revenueTrends, bookingTrends, transactions, locumRates, loading, updateTicketStatus } = useAdminStats();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Render the active page
  const renderPage = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardPage stats={stats} activities={activities} revenueTrends={revenueTrends} loading={loading} />;
      case "users":
        return <UsersPage />;
      case "bookings":
        return <BookingsPage stats={stats} bookingTrends={bookingTrends} />;
      case "payments":
        return <PaymentsPage stats={stats} transactions={transactions} />;
      case "rates":
        return <RatesPage locumRates={locumRates} />;
      case "financial":
        return <FinancialReviewPage />;
      case "reports":
        return <ReportsPage stats={stats} revenueTrends={revenueTrends} bookingTrends={bookingTrends} />;
      case "support":
        return <SupportPage tickets={tickets} loading={loading} updateTicketStatus={updateTicketStatus} />;
      default:
        return <DashboardPage stats={stats} activities={activities} revenueTrends={revenueTrends} loading={loading} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-40">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-100">{renderPage()}</main>
      </div>
    </div>
  );
}
