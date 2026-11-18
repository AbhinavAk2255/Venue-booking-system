import { useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { createVenue, deleteMyVenue, fetchMyVenues, updateMyVenue } from "../../lib/hostApi";
import { money } from "../../lib/data";
import HostLayout from "../../components/host/HostLayout";

const VENUE_TYPES = [
  "wedding_hall",
  "banquet_hall",
  "auditorium",
  "conference_hall",
  "meeting_room",
  "party_hall",
  "convention_center",
  "rooftop_venue",
  "beach_venue",
  "open_ground",
];

const EMPTY = {
  venue_name: "",
  venue_type: "banquet_hall",
  location: "",
  capacity: "",
  price_per_hour: "",
  description: "",
};

export default function HostVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetchMyVenues()
      .then((data) => setVenues(Array.isArray(data) ? data : data?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImage(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (venue) => {
    setEditing(venue.id);
    setForm({
      venue_name: venue.venue_name,
      venue_type: venue.venue_type,
      location: venue.location,
      capacity: venue.capacity,
      price_per_hour: venue.price_per_hour,
      description: venue.description,
    });
    setImage(null);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);

      if (editing) {
        await updateMyVenue(editing, fd);
      } else {
        await createVenue(fd);
      }

      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this venue permanently?")) return;
    try {
      await deleteMyVenue(id);
      load();
    } catch {}
  };

  return (
    <HostLayout>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-cream">My Venues</h1>
            <p className="mt-1 text-sm text-faint">Add, edit and manage your listed venues</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase text-ink transition-colors hover:bg-champagne"
          >
            <Plus className="size-4" /> Add Venue
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-gold" />
          </div>
        ) : venues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cream/15 py-20 text-center">
            <p className="font-display text-xl text-cream">No venues yet</p>
            <p className="mt-2 text-sm text-faint">Click “Add Venue” to list your first venue.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-2xl border border-cream/[0.07] bg-coal/50">
                {v.image && (
                  <img
                    src={v.image.startsWith("http") ? v.image : `http://localhost:8000${v.image}`}
                    alt={v.venue_name}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-display text-lg text-cream">{v.venue_name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-faint">
                    <MapPin className="size-3" /> {v.location}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-sand">
                      <Users className="size-3 text-gold/70" /> {v.capacity}
                    </span>
                    <span className="text-champagne">{money(parseFloat(v.price_per_hour))}/hr</span>
                    <span className="rounded-full bg-cream/[0.06] px-2 py-0.5 text-xs capitalize text-faint">
                      {v.venue_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEdit(v)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream/10 py-2 text-xs text-sand hover:bg-cream/[0.04] hover:text-cream"
                    >
                      <Pencil className="size-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream/10 py-2 text-xs text-sand hover:bg-wine/10 hover:text-wine"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-cream/10 bg-coal p-7 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl text-cream">{editing ? "Edit Venue" : "Add New Venue"}</h3>
                <button onClick={() => setShowForm(false)} className="grid size-8 place-items-center rounded-full border border-cream/10 text-sand hover:text-cream">
                  <X className="size-4" />
                </button>
              </div>

              {error && <p className="mb-4 rounded-xl border border-wine/30 bg-wine/10 px-4 py-2.5 text-sm text-wine">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  required
                  value={form.venue_name}
                  onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                  placeholder="Venue Name"
                  className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:border-gold/50 focus:outline-none"
                />
                <select
                  value={form.venue_type}
                  onChange={(e) => setForm({ ...form, venue_type: e.target.value })}
                  className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream focus:outline-none [&>option]:bg-coal"
                >
                  {VENUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Location"
                  className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:border-gold/50 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="Capacity"
                    className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:border-gold/50 focus:outline-none"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.price_per_hour}
                    onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })}
                    placeholder="Price/hour"
                    className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  className="w-full rounded-xl border border-cream/10 bg-soot/40 px-4 py-3 text-sm text-cream placeholder:text-faint focus:border-gold/50 focus:outline-none"
                />
                <div>
                  <label className="mb-1 block text-xs text-faint">Venue Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="w-full text-sm text-sand file:mr-3 file:rounded-full file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-xs file:text-gold"
                  />
                </div>
                <button
                  disabled={saving}
                  className="w-full rounded-full bg-gold py-3.5 text-xs font-bold uppercase text-ink transition-colors hover:bg-champagne disabled:opacity-60"
                >
                  {saving ? <Loader2 className="mx-auto size-4 animate-spin" /> : editing ? "Update Venue" : "Create Venue"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </HostLayout>
  );
}
