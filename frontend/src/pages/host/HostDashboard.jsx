import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Building2, Clock, DollarSign, Plus } from "lucide-react";
import { fetchMyVenueBookings, fetchMyVenues } from "../../lib/hostApi";
import { money } from "../../lib/data";
import HostLayout from "../../components/host/HostLayout";

export default function HostDashboard() {
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyVenues().catch(() => []),
      fetchMyVenueBookings().catch(() => []),
    ])
      .then(([venueData, bookingData]) => {
        setVenues(Array.isArray(venueData) ? venueData : venueData?.results || []);
        setBookings(Array.isArray(bookingData) ? bookingData : bookingData?.results || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved").length;
  const revenue = bookings
    .filter((b) => b.status === "approved")
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  return (
    <HostLayout>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-cream">Host Dashboard</h1>
            <p className="mt-1 text-sm text-faint">Manage your venues and track all bookings on your spaces</p>
          </div>
          <Link
            to="/host/venues"
            className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase text-ink transition-colors hover:bg-champagne"
          >
            <Plus className="size-4" /> Add Venue
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-soot/50" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { icon: Building2, label: "My Venues", value: venues.length, color: "text-gold" },
                { icon: BookOpen, label: "Total Bookings", value: bookings.length, color: "text-champagne" },
                { icon: Clock, label: "Pending Requests", value: pending, color: "text-cream" },
                { icon: DollarSign, label: "Revenue", value: money(revenue), color: "text-gold" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-2xl border border-cream/[0.07] bg-coal/50 p-5">
                  <Icon className={`size-4 ${color} opacity-60`} />
                  <p className={`mt-3 font-display text-3xl font-light ${color}`}>{value}</p>
                  <p className="mt-1 text-[10px] uppercase text-faint">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-cream">Recent Bookings on My Venues</h3>
                <Link to="/host/bookings" className="text-xs uppercase text-gold hover:text-champagne">
                  View all →
                </Link>
              </div>
              {bookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-faint">No bookings yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cream/[0.07] text-[10px] uppercase text-faint">
                        <th className="pb-3 text-left">ID</th>
                        <th className="pb-3 text-left">Customer</th>
                        <th className="pb-3 text-left">Venue</th>
                        <th className="pb-3 text-left">Date</th>
                        <th className="pb-3 text-left">Amount</th>
                        <th className="pb-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 10).map((b) => (
                        <tr key={b.id} className="border-b border-cream/[0.04]">
                          <td className="py-2.5 text-faint">#{b.id}</td>
                          <td className="py-2.5 text-cream/80">{b.customer_name || b.customer}</td>
                          <td className="py-2.5 text-cream/80">{b.venue_name || b.venue}</td>
                          <td className="py-2.5 text-sand">{b.booking_date}</td>
                          <td className="py-2.5 text-champagne">{money(parseFloat(b.total_amount || 0))}</td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                                b.status === "approved"
                                  ? "bg-gold/10 text-gold"
                                  : b.status === "rejected"
                                    ? "bg-wine/10 text-wine"
                                    : "bg-cream/10 text-cream/80"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </HostLayout>
  );
}
