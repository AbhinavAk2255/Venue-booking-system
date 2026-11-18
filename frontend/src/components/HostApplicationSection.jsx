
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, CheckCircle2, Clock, Loader2,
  MapPin, Phone, Send, XCircle,
} from "lucide-react";

import {
  fetchMyHostApplications,
  submitHostApplication,
} from "../lib/api";

const STATUS_STYLES = {
  pending: {
    label: "Pending review",
    className: "border-cream/20 bg-cream/[0.06] text-cream/80",
  },
  approved: {
    label: "Approved",
    className: "border-gold/40 bg-gold/10 text-champagne",
  },
  rejected: {
    label: "Rejected",
    className: "border-wine/40 bg-wine/10 text-wine",
  },
};

const EMPTY_FORM = {
  business_name: "",
  contact_number: "",
  location: "",
  reason: "",
};

export default function HostApplicationSection() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyHostApplications();

      setApplications(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      setError(err.message || "Unable to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const pendingApplication = applications.find(
    (app) => app.status === "pending"
  );

  const approvedApplication = applications.find(
    (app) => app.status === "approved"
  );

  const updateField = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await submitHostApplication(form);

      setForm(EMPTY_FORM);
      setSuccess("Your host application has been submitted successfully.");

      await loadApplications();
    } catch (err) {
      setError(err.message || "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-cream/10 bg-soot/50 px-4 py-3 text-sm text-cream placeholder:text-faint focus:outline-none focus:border-gold/50";

  if (loading) {
    return (
      <div className="mt-10 flex justify-center rounded-3xl border border-cream/[0.08] bg-coal/70 py-12">
        <Loader2 className="size-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <section className="mt-10 rounded-3xl border border-cream/[0.08] bg-coal/70 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
          <Building2 className="size-5 text-gold" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-light text-cream">
            Become a venue host
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-sand">
            Apply to list your venue on Venuva and manage your bookings.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-wine/30 bg-wine/10 p-3 text-sm text-wine">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-champagne">
          {success}
        </div>
      )}

      {/* Approved application */}
      {approvedApplication ? (
        <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/[0.06] p-5">
          <div className="flex items-center gap-2 text-champagne">
            <CheckCircle2 className="size-5" />
            <h3 className="font-medium">Your application is approved!</h3>
          </div>

          <p className="mt-2 text-sm text-sand">
            Your host application for{" "}
            <span className="text-cream">
              {approvedApplication.business_name}
            </span>{" "}
            has been approved.
          </p>

          {approvedApplication.admin_note && (
            <p className="mt-3 text-sm text-sand">
              Admin note: {approvedApplication.admin_note}
            </p>
          )}

          <Link
            to="/host"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne transition-colors"
          >
            Open host panel
          </Link>

          <p className="mt-3 text-xs text-faint">
            If access is not available yet, sign out and sign in again to
            refresh your account role.
          </p>
        </div>
      ) : pendingApplication ? (
        /* Pending application */
        <div className="mt-6 rounded-2xl border border-cream/10 bg-soot/40 p-5">
          <div className="flex items-center gap-2 text-cream">
            <Clock className="size-5 text-gold" />
            <h3 className="font-medium">Application under review</h3>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-cream">
                {pendingApplication.business_name}
              </p>
              <p className="mt-1 text-xs text-faint">
                Submitted{" "}
                {new Date(pendingApplication.created_at).toLocaleDateString()}
              </p>
            </div>

            <span className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-wider ${STATUS_STYLES.pending.className}`}>
              {STATUS_STYLES.pending.label}
            </span>
          </div>

          <p className="mt-4 text-sm text-sand">
            Your application is waiting for admin approval. You can check
            back here for updates.
          </p>
        </div>
      ) : (
        /* New application form */
        <>
          {applications.some((app) => app.status === "rejected") && (
            <div className="mt-6 rounded-xl border border-wine/30 bg-wine/10 p-4">
              <div className="flex items-center gap-2 text-wine">
                <XCircle className="size-4" />
                <span className="text-sm font-medium">
                  Previous application rejected
                </span>
              </div>

              {applications
                .filter((app) => app.status === "rejected")
                .slice(0, 1)
                .map((app) => (
                  <p key={app.id} className="mt-2 text-sm text-sand">
                    {app.admin_note || "No additional note was provided."}
                  </p>
                ))}

              <p className="mt-2 text-xs text-faint">
                You can submit a new application below.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs tracking-wider uppercase text-sand">
                Business / Venue name
              </label>

              <input
                name="business_name"
                value={form.business_name}
                onChange={updateField}
                required
                maxLength={200}
                placeholder="Enter your business name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs tracking-wider uppercase text-sand">
                Contact number
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
                <input
                  name="contact_number"
                  value={form.contact_number}
                  onChange={updateField}
                  required
                  maxLength={30}
                  placeholder="Enter contact number"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs tracking-wider uppercase text-sand">
                Location
              </label>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
                <input
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  required
                  maxLength={200}
                  placeholder="City, State"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs tracking-wider uppercase text-sand">
                Why do you want to become a host?
              </label>

              <textarea
                name="reason"
                value={form.reason}
                onChange={updateField}
                required
                rows={4}
                maxLength={2000}
                placeholder="Tell us about your venue and your plans..."
                className={`${inputClass} resize-y`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-xs font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}

              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </form>
        </>
      )}

      {/* Previous application history */}
      {applications.length > 0 && (
        <div className="mt-8 border-t border-cream/[0.08] pt-5">
          <h3 className="text-xs tracking-[0.18em] uppercase text-faint">
            Application history
          </h3>

          <div className="mt-3 space-y-3">
            {applications.map((app) => {
              const status =
                STATUS_STYLES[app.status] || STATUS_STYLES.pending;

              return (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soot/40 p-3"
                >
                  <div>
                    <p className="text-sm text-cream">
                      {app.business_name}
                    </p>
                    <p className="mt-1 text-xs text-faint">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
