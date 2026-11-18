import { useEffect, useState } from "react";
import { Loader2, MapPin, Search, Trash2, Users } from "lucide-react";
import { fetchAdminVenues, deleteVenue } from "../../lib/adminApi";
import { money } from "../../lib/data";
import AdminLayout from "../../components/admin/AdminLayout";

const VENUE_TYPES = [
  { id: "all", label: "All" },
  { id: "wedding_hall", label: "Wedding" },
  { id: "banquet_hall", label: "Banquet" },
  { id: "auditorium", label: "Auditorium" },
  { id: "conference_hall", label: "Conference" },
  { id: "party_hall", label: "Party" },
  { id: "rooftop_venue", label: "Rooftop" },
  { id: "open_ground", label: "Open ground" },
];

export default function AdminVenues() {
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (typeFilter !== "all") params.set("venue_type", typeFilter);
    fetchAdminVenues(params.toString())
      .then((data) => setVenues(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, typeFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this venue permanently?")) return;
    await deleteVenue(id);
    load();
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-light text-cream">Venues</h1>
          <p className="mt-1 text-sm text-faint">All venues listed on the platform</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm rounded-xl border border-cream/10 bg-soot/40 px-3 py-2">
            <Search className="size-4 text-faint shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues…"
              className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {VENUE_TYPES.map((t) => (
              <button key={t.id} onClick={() => setTypeFilter(t.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] tracking-[0.12em] uppercase transition-colors ${
                  typeFilter === t.id ? "bg-gold text-ink font-medium" : "text-sand border border-cream/10 hover:border-cream/25"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gold" /></div>
          ) : venues.length === 0 ? (
            <p className="text-center text-sm text-faint py-16">No venues found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream/[0.07] text-[10px] tracking-[0.18em] uppercase text-faint">
                    <th className="text-left p-4">Venue</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Owner</th>
                    <th className="text-left p-4">Capacity</th>
                    <th className="text-left p-4">Rate</th>
                    <th className="text-left p-4">Bookings</th>
                    <th className="text-left p-4">Pending</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map((v) => (
                    <tr key={v.id} className="border-b border-cream/[0.04] hover:bg-cream/[0.02] transition-colors">
                      <td className="p-4">
                        <p className="text-cream font-medium">{v.venue_name}</p>
                        <p className="text-xs text-faint flex items-center gap-1 mt-0.5"><MapPin className="size-3" /> {v.location}</p>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-cream/[0.06] px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase text-sand">
                          {v.venue_type?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sand">{v.owner_name || `#${v.owner}`}</td>
                      <td className="p-4 text-sand">
                        <span className="flex items-center gap-1"><Users className="size-3 text-gold/70" /> {v.capacity}</span>
                      </td>
                      <td className="p-4 text-champagne tabular-nums">{money(parseFloat(v.price_per_hour))}/hr</td>
                      <td className="p-4 text-sand tabular-nums">{v.total_bookings ?? 0}</td>
                      <td className="p-4">
                        {(v.pending_bookings ?? 0) > 0 ? (
                          <span className="rounded-full bg-gold/10 text-gold px-2.5 py-1 text-[10px] font-medium">{v.pending_bookings}</span>
                        ) : (
                          <span className="text-faint text-xs">0</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(v.id)} title="Delete"
                          className="grid size-8 place-items-center rounded-lg text-sand hover:text-wine hover:bg-wine/10 transition-colors">
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
