import { API_BASE_URL, getToken, clearSession } from "./api";

async function hostRequest(path, options = {}) {
  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers ?? {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) clearSession();
    const msg = body?.message || body?.detail || body?.error || `Request failed (${res.status})`;
    throw new Error(String(msg));
  }

  return body;
}

// Owner's own venues
export const fetchMyVenues = () => hostRequest("/venues/venue_dasboard/");

// Create venue (multipart for image upload)
export const createVenue = (formData) =>
  hostRequest("/venues/create/", {
    method: "POST",
    body: formData,
  });

// Update venue (requires backend URL fix: update_venue/<int:pk>/)
export const updateMyVenue = (id, formData) =>
  hostRequest(`/venues/update_venue/${id}/`, {
    method: "PUT",
    body: formData,
  });

// Delete venue (requires backend URL fix: delete_venue/<int:pk>/)
export const deleteMyVenue = (id) =>
  hostRequest(`/venues/delete_venue/${id}/`, {
    method: "DELETE",
  });

// Bookings on my venues
export const fetchMyVenueBookings = () => hostRequest("/booking/owner_booking_list/");

// Approve or reject a booking on my venue
export const updateBookingStatus = (id, status) =>
  hostRequest(`/booking/update_status/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
