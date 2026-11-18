import { useEffect, useState } from "react";
import {
  Building2, CalendarHeart, Check, Loader2, Plus,
  Search, Shield, Trash2, UserCheck, UserX, X,
} from "lucide-react";
import { fetchUsers, createUser, toggleUser, deleteUser } from "../../lib/adminApi";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "customer" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("role", filter);
    if (search.trim()) params.set("search", search.trim());
    fetchUsers(params.toString())
      .then((data) => setUsers(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createUser(form);
      setShowCreate(false);
      setForm({ username: "", email: "", password: "", role: "customer" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    await toggleUser(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    await deleteUser(id);
    load();
  };

  const ROLE_BADGE = {
    customer:  { icon: CalendarHeart, cls: "bg-cream/10 text-cream/80" },
    owner:     { icon: Building2,     cls: "bg-gold/10 text-gold"      },
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-light text-cream">Users</h1>
            <p className="mt-1 text-sm text-faint">Manage customers and venue owners</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[12px] font-medium tracking-[0.12em] uppercase text-ink hover:bg-champagne transition-colors">
            <Plus className="size-4" /> Add user
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm rounded-xl border border-cream/10 bg-soot/40 px-3 py-2">
            <Search className="size-4 text-faint shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none" />
          </div>
          {["all", "customer", "owner"].map((r) => (
            <button key={r} onClick={() => setFilter(r)}
              className={`rounded-full px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors ${
                filter === r ? "bg-gold text-ink font-medium" : "text-sand border border-cream/10 hover:border-cream/25"
              }`}>
              {r === "all" ? "All" : r === "customer" ? "Customers" : "Owners"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gold" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-faint py-16">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream/[0.07] text-[10px] tracking-[0.18em] uppercase text-faint">
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Bookings</th>
                    <th className="text-left p-4">Venues</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const badge = ROLE_BADGE[u.role] || ROLE_BADGE.customer;
                    const BadgeIcon = badge.icon;
                    return (
                      <tr key={u.id} className="border-b border-cream/[0.04] hover:bg-cream/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-full bg-gold/10 text-gold text-[11px] font-semibold shrink-0">
                              {u.username?.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-cream truncate">{u.username}</p>
                              <p className="text-xs text-faint truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase ${badge.cls}`}>
                            <BadgeIcon className="size-3" /> {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-sand tabular-nums">{u.total_bookings ?? 0}</td>
                        <td className="p-4 text-sand tabular-nums">{u.total_venues ?? 0}</td>
                        <td className="p-4">
                          {u.is_superuser ? (
                            <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.12em] uppercase text-gold"><Shield className="size-3" /> Admin</span>
                          ) : u.is_active ? (
                            <span className="text-[10px] tracking-[0.12em] uppercase text-champagne/80">Active</span>
                          ) : (
                            <span className="text-[10px] tracking-[0.12em] uppercase text-wine">Disabled</span>
                          )}
                        </td>
                        <td className="p-4 text-faint text-xs whitespace-nowrap">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {!u.is_superuser && (
                              <>
                                <button onClick={() => handleToggle(u.id)} title={u.is_active ? "Disable" : "Enable"}
                                  className={`grid size-8 place-items-center rounded-lg transition-colors ${
                                    u.is_active ? "text-sand hover:text-wine hover:bg-wine/10" : "text-sand hover:text-gold hover:bg-gold/10"
                                  }`}>
                                  {u.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                                </button>
                                <button onClick={() => handleDelete(u.id)} title="Delete"
                                  className="grid size-8 place-items-center rounded-lg text-sand hover:text-wine hover:bg-wine/10 transition-colors">
                                  <Trash2 className="size-4" />
                                </button>
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

        {/* Create User Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <div className="relative w-full max-w-md rounded-3xl border border-cream/10 bg-coal p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl text-cream">Create user</h3>
                <button onClick={() => setShowCreate(false)} className="grid size-8 place-items-center rounded-full border border-cream/10 text-sand hover:text-cream"><X className="size-4" /></button>
              </div>
              {error && <p className="mb-4 text-sm text-wine bg-wine/10 border border-wine/30 rounded-xl px-4 py-2.5">{error}</p>}
              <form onSubmit={handleCreate} className="space-y-4">
                <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Username" className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:outline-none focus:border-gold/50" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email" className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:outline-none focus:border-gold/50" />
                <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password (min 8)" className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:outline-none focus:border-gold/50" />
                <div className="grid grid-cols-2 gap-2">
                  {["customer", "owner"].map((r) => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${form.role === r ? "border-gold/60 bg-gold/[0.08]" : "border-cream/10"}`}>
                      <span className={`text-sm ${form.role === r ? "text-cream" : "text-sand"}`}>{r === "customer" ? "Customer" : "Owner"}</span>
                    </button>
                  ))}
                </div>
                <button disabled={creating} className="w-full flex items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-[12px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne disabled:opacity-60">
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Create user</>}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
