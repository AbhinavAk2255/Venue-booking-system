import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, Loader2, Search, X as XIcon } from "lucide-react";
import { fetchMyVenueBookings, updateBookingStatus } from "../../lib/hostApi";
import { money } from "../../lib/data";
import HostLayout from "../../components/host/HostLayout";

const STATUS_STYLES = {
  pending: "bg-cream/10 text-cream/80",
  approved: "bg-gold/10 text-gold",
  rejected: "bg-wine/10 text-wine",
};

export default function HostBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    fetchMyVenueBookings()
      .then((data) => setBookings(Array.isArray(data) ? data : data?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, newStatus) => {
    const label = newStatus === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} booking #${id}?`)) return;

    setBusy(id);
    try {
      await updateBookingStatus(id, newStatus);
      // Update local state immediately
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setBusy(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const customer = (b.customer_name || b.customer || "").toString().toLowerCase();
      const venue = (b.venue_name || b.venue || "").toString().toLowerCase();
      if (!customer.includes(q) && !venue.includes(q)) return false;
    }
    return true;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <HostLayout>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cream">Venue Bookings</h1>
            <p className="mt-1 text-sm text-faint">Approve or reject booking requests from customers</p>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-gold">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-cream/10 bg-soot/40 px-3 py-2">
            <Search className="size-4 text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or venue…"
              className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none"
            />
          </div>
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-2 text-[11px] uppercase transition-colors ${
                filter === s ? "bg-gold font-bold text-ink" : "border border-cream/10 text-sand hover:text-cream"
              }`}
            >
              {s === "all" ? `All (${bookings.length})` : `${s} (${bookings.filter((b) => b.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Bookings table */}
        <div className="overflow-hidden rounded-2xl border border-cream/[0.07] bg-coal/50">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-6 animate-spin text-gold" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-faint">No bookings found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream/[0.07] text-[10px] uppercase text-faint">
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">Venue</th>
                    <th className="p-4 text-left">Date & Time</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const isBusy = busy === b.id;
                    return (
                      <tr key={b.id} className="border-b border-cream/[0.04] hover:bg-cream/[0.02] transition-colors">
                        <td className="p-4 text-faint">#{b.id}</td>
                        <td className="p-4 text-cream/80">{b.customer_name || `User #${b.customer}`}</td>
                        <td className="p-4 text-cream/80">{b.venue_name || `Venue #${b.venue}`}</td>
                        <td className="whitespace-nowrap p-4">
                          <span className="flex items-center gap-1 text-cream/80">
                            <CalendarDays className="size-3 text-gold/60" /> {b.booking_date}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                            <Clock className="size-3" /> {b.starting_time?.slice(0, 5)} — {b.ending_time?.slice(0, 5)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-display text-lg text-champagne">{money(parseFloat(b.total_amount || 0))}</span>
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase ${STATUS_STYLES[b.status] || ""}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin text-gold" />
                            ) : (
                              <>
                                {b.status !== "approved" && (
                                  <button
                                    onClick={() => handleStatus(b.id, "approved")}
                                    title="Approve this booking"
                                    className="grid size-8 place-items-center rounded-lg text-sand transition-colors hover:bg-gold/10 hover:text-gold"
                                  >
                                    <Check className="size-4" />
                                  </button>
                                )}
                                {b.status !== "rejected" && (
                                  <button
                                    onClick={() => handleStatus(b.id, "rejected")}
                                    title="Reject this booking"
                                    className="grid size-8 place-items-center rounded-lg text-sand transition-colors hover:bg-wine/10 hover:text-wine"
                                  >
                                    <XIcon className="size-4" />
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
    </HostLayout>
  );
}