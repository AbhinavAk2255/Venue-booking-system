import { useEffect, useState } from "react";
import {
  CalendarDays, Check, Clock, Loader2,
  Search, Trash2, X,
} from "lucide-react";
import { fetchAdminBookings, updateBookingStatus, deleteBooking } from "../../lib/adminApi";
import { money } from "../../lib/data";
import AdminLayout from "../../components/admin/AdminLayout";

const STATUS_STYLES = {
  pending:  { bg: "bg-cream/10",  text: "text-cream/80",  label: "Pending"  },
  approved: { bg: "bg-gold/10",   text: "text-gold",      label: "Approved" },
  rejected: { bg: "bg-wine/10",   text: "text-wine",      label: "Rejected" },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [busy,     setBusy]     = useState(null); // booking id being acted on

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search.trim()) params.set("search", search.trim());
    fetchAdminBookings(params.toString())
      .then((data) => setBookings(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, search]);

  const handleStatus = async (id, status) => {
    setBusy(id);
    try {
      await updateBookingStatus(id, status);
      load();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking permanently?")) return;
    setBusy(id);
    try {
      await deleteBooking(id);
      load();
    } finally {
      setBusy(null);
    }
  };

  const pendingCount  = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-light text-cream">Bookings</h1>
            <p className="mt-1 text-sm text-faint">Approve, reject and manage all booking requests</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="rounded-full bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-[11px] tracking-[0.14em] uppercase">
                {pendingCount} pending
              </span>
            )}
            <span className="text-[11px] tracking-[0.14em] uppercase text-faint">
              {approvedCount} approved
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm rounded-xl border border-cream/10 bg-soot/40 px-3 py-2">
            <Search className="size-4 text-faint shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or venue…"
              className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none" />
          </div>
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors ${
                filter === s ? "bg-gold text-ink font-medium" : "text-sand border border-cream/10 hover:border-cream/25"
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gold" /></div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-sm text-faint py-16">No bookings found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream/[0.07] text-[10px] tracking-[0.18em] uppercase text-faint">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Venue</th>
                    <th className="text-left p-4">Date & Time</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const st = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                    const isBusy = busy === b.id;
                    return (
                      <tr key={b.id} className="border-b border-cream/[0.04] hover:bg-cream/[0.02] transition-colors">
                        <td className="p-4 text-faint tabular-nums">#{b.id}</td>
                        <td className="p-4">
                          <p className="text-cream">{b.customer_name}</p>
                          <p className="text-xs text-faint">{b.customer_email}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-cream/80">{b.venue_name}</p>
                          <p className="text-xs text-faint">{b.venue_location}</p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <p className="text-cream/80 flex items-center gap-1.5">
                            <CalendarDays className="size-3 text-gold/60" /> {b.booking_date}
                          </p>
                          <p className="text-xs text-faint flex items-center gap-1.5 mt-0.5">
                            <Clock className="size-3" /> {b.starting_time?.slice(0, 5)} — {b.ending_time?.slice(0, 5)}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="font-display text-lg text-champagne tabular-nums">
                            {money(parseFloat(b.total_amount))}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full ${st.bg} ${st.text} px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin text-gold" />
                            ) : (
                              <>
                                {b.status !== "approved" && (
                                  <button onClick={() => handleStatus(b.id, "approved")}
                                    title="Approve"
                                    className="grid size-8 place-items-center rounded-lg text-sand hover:text-gold hover:bg-gold/10 transition-colors">
                                    <Check className="size-4" />
                                  </button>
                                )}
                                {b.status !== "rejected" && (
                                  <button onClick={() => handleStatus(b.id, "rejected")}
                                    title="Reject"
                                    className="grid size-8 place-items-center rounded-lg text-sand hover:text-wine hover:bg-wine/10 transition-colors">
                                    <X className="size-4" />
                                  </button>
                                )}
                                {b.status === "pending" && (
                                  <button onClick={() => handleDelete(b.id)}
                                    title="Delete"
                                    className="grid size-8 place-items-center rounded-lg text-sand hover:text-wine hover:bg-wine/10 transition-colors">
                                    <Trash2 className="size-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
