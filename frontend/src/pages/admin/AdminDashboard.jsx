import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, Building2, CalendarDays, Clock,
  DollarSign, Hourglass, TrendingUp, UserPlus, Users,
} from "lucide-react";
import { fetchStats } from "../../lib/adminApi";
import { money, prettyDate } from "../../lib/data";
import AdminLayout from "../../components/admin/AdminLayout";

const STATUS_COLORS = {
  pending:  "bg-cream/10 text-cream/80",
  approved: "bg-gold/10 text-gold",
  rejected: "bg-wine/10 text-wine",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-light text-cream">Dashboard</h1>
            <p className="mt-1 text-sm text-faint">Overview of your venue booking system</p>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-faint">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-wine/40 bg-wine/[0.08] px-5 py-4 text-sm text-cream/85">
            ⚠ {error} — Make sure you've set up the <code className="text-champagne bg-ink/60 px-1.5 py-0.5 rounded">admin_api</code> app and you're logged in as a superuser.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-soot/50" />
            ))}
          </div>
        ) : stats && (
          <>
            {/* Top stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Users,      label: "Total Users",       value: stats.total_users,       color: "text-cream",    bg: "bg-cream/[0.05]" },
                { icon: Building2,  label: "Total Venues",      value: stats.total_venues,      color: "text-gold",     bg: "bg-gold/[0.06]"  },
                { icon: BookOpen,   label: "Total Bookings",    value: stats.total_bookings,    color: "text-champagne",bg: "bg-champagne/[0.06]" },
                { icon: DollarSign, label: "Revenue (Approved)",value: money(stats.total_revenue),color: "text-gold",   bg: "bg-gold/[0.06]"  },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className={`rounded-2xl border border-cream/[0.07] ${bg} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-faint">{label}</span>
                    <Icon className={`size-4 ${color} opacity-60`} />
                  </div>
                  <p className={`mt-3 font-display text-3xl font-light ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Booking breakdown + User breakdown */}
            <div className="grid lg:grid-cols-2 gap-4 mb-8">
              {/* Booking status */}
              <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-medium text-cream">Booking Status</h3>
                  <Link to="/admin/bookings" className="text-[11px] uppercase tracking-[0.14em] text-gold hover:text-champagne flex items-center gap-1">
                    View all <ArrowRight className="size-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Pending",  value: stats.pending_bookings,  total: stats.total_bookings, color: "bg-cream/40" },
                    { label: "Approved", value: stats.approved_bookings, total: stats.total_bookings, color: "bg-gold"     },
                    { label: "Rejected", value: stats.rejected_bookings, total: stats.total_bookings, color: "bg-wine"     },
                  ].map(({ label, value, total, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-sand">{label}</span>
                        <span className="text-cream tabular-nums">{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cream/[0.06] overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all duration-700`}
                          style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User breakdown */}
              <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-medium text-cream">User Breakdown</h3>
                  <Link to="/admin/users" className="text-[11px] uppercase tracking-[0.14em] text-gold hover:text-champagne flex items-center gap-1">
                    View all <ArrowRight className="size-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Customers",  value: stats.total_customers, icon: Users     },
                    { label: "Owners",     value: stats.total_owners,    icon: Building2  },
                    { label: "New (30d)",  value: stats.new_users_30d,   icon: UserPlus   },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-cream/[0.06] bg-soot/40 p-4 text-center">
                      <Icon className="size-4 text-gold mx-auto mb-2" />
                      <p className="font-display text-2xl font-light text-cream">{value}</p>
                      <p className="text-[10px] tracking-[0.16em] uppercase text-faint mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-gold/[0.06] border border-gold/20 px-4 py-3 flex items-center gap-3">
                  <TrendingUp className="size-4 text-gold shrink-0" />
                  <p className="text-xs text-champagne">
                    <span className="font-medium">{stats.recent_bookings_30d}</span> bookings in the last 30 days
                  </p>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 p-5">
              <h3 className="text-sm font-medium text-cream mb-5">Recent Activity</h3>
              {stats.recent_activity?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cream/[0.07] text-[10px] tracking-[0.18em] uppercase text-faint">
                        <th className="text-left pb-3 pr-4">Booking</th>
                        <th className="text-left pb-3 pr-4">Customer</th>
                        <th className="text-left pb-3 pr-4">Venue</th>
                        <th className="text-left pb-3 pr-4">Date</th>
                        <th className="text-left pb-3 pr-4">Amount</th>
                        <th className="text-left pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_activity.map((b) => (
                        <tr key={b.id} className="border-b border-cream/[0.04] hover:bg-cream/[0.02] transition-colors">
                          <td className="py-3 pr-4 text-faint">#{b.id}</td>
                          <td className="py-3 pr-4 text-cream/80">{b.customer_name}</td>
                          <td className="py-3 pr-4 text-cream/80">{b.venue_name}</td>
                          <td className="py-3 pr-4 text-sand whitespace-nowrap">{b.booking_date}</td>
                          <td className="py-3 pr-4 text-champagne tabular-nums">{money(parseFloat(b.total_amount))}</td>
                          <td className="py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase ${STATUS_COLORS[b.status]}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-faint py-8 text-center">No recent activity</p>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
