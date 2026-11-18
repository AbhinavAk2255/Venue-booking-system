
import { useEffect, useState } from "react";

import {
  fetchHostApplications,
  approveHostApplication,
  rejectHostApplication,
} from "../../lib/adminApi";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  Check,
  X,
  Loader2,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";

const STATUS_STYLES = {
  pending: {
    bg: "bg-cream/10",
    text: "text-cream/80",
    label: "Pending",
  },
  approved: {
    bg: "bg-gold/10",
    text: "text-gold",
    label: "Approved",
  },
  rejected: {
    bg: "bg-wine/10",
    text: "text-wine",
    label: "Rejected",
  },
};

export default function AdminHostApplications() {
  // All React hooks must be inside this component
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  // Confirmation modal state
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);

  // Load applications from backend
  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchHostApplications(
        filter === "all" ? "" : filter
      );

      setApplications(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  // Open confirmation modal
  const handleReview = (application, action) => {
    setReviewTarget(application);
    setReviewAction(action);
  };

  // Execute approval or rejection after confirmation
  const confirmReview = async () => {
    if (!reviewTarget || !reviewAction) return;

    const id = reviewTarget.id;

    setBusy(id);
    setError("");

    try {
      const note = notes[id] || "";

      if (reviewAction === "approved") {
        await approveHostApplication(id, note);
      } else {
        await rejectHostApplication(id, note);
      }

      setReviewTarget(null);
      setReviewAction(null);

      await load();
    } catch (err) {
      setError(err.message || "Unable to review application.");
    } finally {
      setBusy(null);
    }
  };

  // Search applications
  const filteredApplications = applications.filter((app) => {
    const term = search.toLowerCase().trim();

    if (!term) return true;

    return [
      app.username,
      app.email,
      app.business_name,
      app.location,
      app.contact_number,
    ].some((value) =>
      String(value || "").toLowerCase().includes(term)
    );
  });

  // Application counts
  const pendingCount = applications.filter(
    (app) => app.status === "pending"
  ).length;

  const approvedCount = applications.filter(
    (app) => app.status === "approved"
  ).length;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-light text-cream">
              Host Applications
            </h1>

            <p className="mt-1 text-sm text-faint">
              Review and manage customer requests to become venue hosts
            </p>
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

        {/* Search and filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm rounded-xl border border-cream/10 bg-soot/40 px-3 py-2">
            <Search className="size-4 text-faint shrink-0" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicant or business..."
              className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none"
            />
          </div>

          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors ${
                filter === status
                  ? "bg-gold text-ink font-medium"
                  : "text-sand border border-cream/10 hover:border-cream/25"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-xl border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine">
            {error}
          </div>
        )}

        {/* Applications table */}
        <div className="rounded-2xl border border-cream/[0.07] bg-coal/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-gold" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <p className="text-center text-sm text-faint py-16">
              No host applications found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream/[0.07] text-[10px] tracking-[0.18em] uppercase text-faint">
                    <th className="text-left p-4">Applicant</th>
                    <th className="text-left p-4">Business</th>
                    <th className="text-left p-4">Contact</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Admin Note</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((app) => {
                    const st =
                      STATUS_STYLES[app.status] ||
                      STATUS_STYLES.pending;

                    const isBusy = busy === app.id;

                    return (
                      <tr
                        key={app.id}
                        className="border-b border-cream/[0.04] hover:bg-cream/[0.02] transition-colors align-top"
                      >
                        {/* Applicant */}
                        <td className="p-4 min-w-[180px]">
                          <p className="text-cream flex items-center gap-2">
                            <User className="size-3 text-gold" />
                            {app.username}
                          </p>

                          <p className="text-xs text-faint mt-1">
                            {app.email}
                          </p>

                          <p className="text-[10px] text-faint mt-1">
                            User ID: #{app.user_id}
                          </p>
                        </td>

                        {/* Business */}
                        <td className="p-4 min-w-[190px]">
                          <p className="text-cream flex items-center gap-2">
                            <Building2 className="size-3 text-gold" />
                            {app.business_name}
                          </p>

                          <p className="text-xs text-faint mt-2 flex items-center gap-1">
                            <MapPin className="size-3" />
                            {app.location}
                          </p>
                        </td>

                        {/* Contact */}
                        <td className="p-4 min-w-[180px]">
                          <p className="text-cream/80 flex items-center gap-2">
                            <Phone className="size-3 text-gold/60" />
                            {app.contact_number}
                          </p>

                          <p className="text-xs text-faint mt-2 flex items-center gap-2">
                            <Mail className="size-3" />
                            {app.email}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`rounded-full ${st.bg} ${st.text} px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase`}
                          >
                            {st.label}
                          </span>

                          {app.created_at && (
                            <p className="text-[10px] text-faint mt-2 whitespace-nowrap">
                              {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        {/* Admin note */}
                        <td className="p-4 min-w-[200px]">
                          {app.status === "pending" ? (
                            <textarea
                              value={notes[app.id] ?? ""}
                              onChange={(e) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [app.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="Add an optional note..."
                              className="w-full min-w-[180px] rounded-lg border border-cream/10 bg-soot/50 p-2 text-xs text-cream placeholder:text-faint focus:outline-none focus:border-gold/40 resize-y"
                            />
                          ) : (
                            <p className="text-xs text-sand/70 max-w-[220px]">
                              {app.admin_note || "No note"}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin text-gold" />
                            ) : app.status === "pending" ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleReview(app, "approved")
                                  }
                                  title="Approve application"
                                  className="grid size-8 place-items-center rounded-lg text-sand hover:text-gold hover:bg-gold/10 transition-colors"
                                >
                                  <Check className="size-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    handleReview(app, "rejected")
                                  }
                                  title="Reject application"
                                  className="grid size-8 place-items-center rounded-lg text-sand hover:text-wine hover:bg-wine/10 transition-colors"
                                >
                                  <X className="size-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-faint">
                                Reviewed
                              </span>
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

      {/* Confirmation modal */}
      {reviewTarget && reviewAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-cream/10 bg-coal shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="p-6 border-b border-cream/[0.07]">
              <div
                className={`grid size-12 place-items-center rounded-full mb-4 ${
                  reviewAction === "approved"
                    ? "bg-gold/10 text-gold"
                    : "bg-wine/10 text-wine"
                }`}
              >
                {reviewAction === "approved" ? (
                  <Check className="size-6" />
                ) : (
                  <X className="size-6" />
                )}
              </div>

              <h2 className="font-display text-2xl text-cream font-light">
                {reviewAction === "approved"
                  ? "Approve Application?"
                  : "Reject Application?"}
              </h2>

              <p className="mt-2 text-sm text-faint leading-relaxed">
                {reviewAction === "approved"
                  ? "Are you sure you want to approve this host application? This user will receive venue owner access."
                  : "Are you sure you want to reject this host application? The user will remain a customer."}
              </p>
            </div>

            {/* Applicant details */}
            <div className="p-6">
              <div className="rounded-xl border border-cream/[0.07] bg-soot/50 p-4">
                <p className="text-xs text-faint uppercase tracking-wider">
                  Applicant
                </p>

                <p className="mt-1 text-cream">
                  {reviewTarget.username}
                </p>

                <p className="text-xs text-faint mt-1">
                  {reviewTarget.email}
                </p>

                <div className="border-t border-cream/[0.07] my-3" />

                <p className="text-xs text-faint uppercase tracking-wider">
                  Business
                </p>

                <p className="mt-1 text-cream">
                  {reviewTarget.business_name}
                </p>

                <p className="text-xs text-faint mt-1">
                  {reviewTarget.location}
                </p>
              </div>

              {/* Confirmation buttons */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  disabled={busy === reviewTarget.id}
                  onClick={() => {
                    setReviewTarget(null);
                    setReviewAction(null);
                  }}
                  className="rounded-full border border-cream/10 px-5 py-3 text-xs uppercase tracking-wider text-sand hover:bg-cream/[0.05] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy === reviewTarget.id}
                  onClick={confirmReview}
                  className={`rounded-full px-5 py-3 text-xs uppercase tracking-wider font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${
                    reviewAction === "approved"
                      ? "bg-gold text-ink hover:bg-champagne"
                      : "bg-wine text-cream hover:bg-wine/80"
                  }`}
                >
                  {busy === reviewTarget.id ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : reviewAction === "approved" ? (
                    "Confirm Approval"
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
