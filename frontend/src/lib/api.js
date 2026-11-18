import { BOOKINGS_CHANGED_EVENT, DEMO_VENUES, MOOD_SHOTS, SESSIONS, TYPE_META, formatTime, slugify } from "./data";

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

const TOKEN_KEY = "venuva.token";
const REFRESH_KEY = "venuva.refresh";
const USER_KEY = "venuva.user";
const BOOKINGS_KEY = "venuva.bookings";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export function isTokenValid() {
  const token = getToken();

  if (!token) return false;

  // Mock tokens do not have JWT expiry.
  if (token.startsWith("mock.")) return true;

  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) return false;

    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    const payload = JSON.parse(atob(padded));
    const exp = payload.exp;

    if (!exp) return false;

    return Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

function storeSession(user, access, refresh) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, access);

  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function validateSession() {
  const user = getStoredUser();

  if (!user) return null;

  // Do not remove the session just because the access token expired.
  // The refresh token may still be valid.
  if (!getToken() || !getRefreshToken()) {
    clearSession();
    return null;
  }

  return user;
}

const latency = (min = 320, max = 780) =>
  new Promise((r) =>
    setTimeout(r, min + Math.random() * (max - min))
  );

// Prevent multiple refresh requests at the same time.
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refresh = getRefreshToken();

    if (!refresh) {
      throw new Error("Refresh token not found");
    }

    const res = await fetch(
      `${API_BASE_URL}/accounts/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.access || !data.refresh) {
      throw new Error("Session expired. Please log in again.");
    }

    // Store both tokens because refresh-token rotation is enabled.
    localStorage.setItem(TOKEN_KEY, data.access);
    localStorage.setItem(REFRESH_KEY, data.refresh);

    return data.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function getErrorMessage(body, status) {
  return (
    (body && typeof body.message === "string" && body.message) ||
    (body && typeof body.detail === "string" && body.detail) ||
    (body?.errors ? JSON.stringify(body.errors) : null) ||
    (body && typeof body === "object" && !Array.isArray(body)
      ? Object.entries(body)
          .filter(([, value]) => Array.isArray(value))
          .map(([key, value]) => `${key}: ${value.join(", ")}`)
          .join("; ") || null
      : null) ||
    `Request failed (${status})`
  );
}

async function sendRequest(path, options, token) {
  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    delete headers.Authorization;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

async function readResponse(res) {
  const bodyText = await res.text();

  try {
    return bodyText ? JSON.parse(bodyText) : null;
  } catch {
    return bodyText;
  }
}

async function request(path, options = {}) {
  let token = getToken();

  // Mock mode: do not try to refresh mock tokens.
  if (token && token.startsWith("mock.")) {
    const res = await sendRequest(path, options, token);
    const body = await readResponse(res);

    if (res.status === 401 && getRefreshToken()) {
      clearSession();
      window.dispatchEvent(new Event("venuva:session-expired"));
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!res.ok) {
      throw new Error(getErrorMessage(body, res.status));
    }

    return body;
  }

  // If the access token has already expired, refresh before the request.
  if (token && !isTokenValid() && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
      clearSession();
      window.dispatchEvent(new Event("venuva:session-expired"));
      throw error;
    }
  }

  let res = await sendRequest(path, options, token);

  // If access token expires while making the request, refresh and retry once.
  if (res.status === 401 && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await sendRequest(path, options, token);
    } catch (error) {
      clearSession();
      window.dispatchEvent(new Event("venuva:session-expired"));
      throw error;
    }
  }

  const body = await readResponse(res);

  if (!res.ok) {
    // Do not automatically clear the session for every 401.
    // A 401 may also indicate an endpoint-specific authentication problem.
    throw new Error(getErrorMessage(body, res.status));
  }

  return body;
}

/* ─── Venues ─────────────────────────────────────────────────────────── */

function mapApiVenue(v) {
  const meta = TYPE_META[v.venue_type] ?? TYPE_META.banquet_hall;
  const locationParts = v.location.split(",").map((p) => p.trim()).filter(Boolean);
  const imageUrl = v.image
    ? v.image.startsWith("http") ? v.image : `${API_ORIGIN}${v.image}`
    : meta.image;
  return {
    id: v.id,
    slug: slugify(v.venue_name, v.id),
    name: v.venue_name,
    type: v.venue_type,
    typeLabel: meta.label.replace(/s$/, ""),
    capacityCategory: v.capacity_category,
    location: v.location,
    city: locationParts[locationParts.length - 1] ?? v.location,
    description: splitParagraphs(v.description, meta),
    capacity: v.capacity,
    pricePerHour: parseFloat(v.price_per_hour),
    rating: null,
    reviews: null,
    image: imageUrl,
    gallery: [MOOD_SHOTS[v.id % 6], MOOD_SHOTS[(v.id + 2) % 6], MOOD_SHOTS[(v.id + 4) % 6]],
    amenities: meta.amenities,
    eventTypes: meta.eventTypes,
    host: null,
  };
}

function splitParagraphs(text, meta) {
  const chunks = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (chunks.length > 0) return chunks;
  return [`${meta.label.replace(/s$/, "")} listed on Venuva. Details confirmed by the host after your booking request.`];
}


function mapApiBooking(b, venues) {
  const venue = venues.find((v) => v.id === b.venue);

  // Convert start time into minutes
  const [startHour, startMinute] = b.starting_time
    .slice(0, 5)
    .split(":")
    .map(Number);

  // Convert end time into minutes
  const [endHour, endMinute] = b.ending_time
    .slice(0, 5)
    .split(":")
    .map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  // Calculate duration in hours
  const hours = (endTotalMinutes - startTotalMinutes) / 60;

  return {
    id: `BK-${String(b.id).padStart(5, "0")}`,
    apiId: b.id,
    venueId: b.venue,
    venueSlug: venue?.slug,
    venueName: venue?.name ?? `Venue #${b.venue}`,
    venueImage: venue?.image ?? MOOD_SHOTS[b.venue % 6],
    location: venue?.location ?? "",
    date: b.booking_date,
    startTime: formatTime(b.starting_time),
    endTime: formatTime(b.ending_time),
    hours: Number.isFinite(hours) && hours > 0 ? hours : 0,
    guests: 0,
    total: parseFloat(b.total_amount),
    status: b.status,
    paymentStatus: b.payment_status ?? "unpaid",
    createdAt: b.created_at,
  };
}


export async function fetchVenues() {
  if (USE_MOCK) { await latency(); return DEMO_VENUES; }
  const data = await request("/venues/list/");
  return (Array.isArray(data) ? data : []).map(mapApiVenue);
}

/* ─── Auth ───────────────────────────────────────────────────────────── */

export async function signIn(username, password) {
  if (!username.trim()) throw new Error("Username is required");
  if (!password)        throw new Error("Password is required");

  if (USE_MOCK) {
  await latency();
  const existing = getStoredUser();

  const user = existing && existing.username.toLowerCase() === username.toLowerCase()
    ? existing
    : {
        id: 9000 + (username.length % 90),
        username: username.trim(),
        email: `${username.toLowerCase()}@demo.venuva`,
        role: "customer",
        is_superuser: false,
        is_staff: false,
      };

  storeSession(user, `mock.${btoa(username).replace(/=+$/, "")}.${Date.now().toString(36)}`);
  return user;
}

  const data = await request("/accounts/login/", {
    method: "POST",
    body: JSON.stringify({ username: username.trim(), password }),
  });

  if (!data.status) throw new Error(data.message || "Invalid Username or Password");

  const user = {
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
    role: data.user.role,
    is_superuser: data.user.is_superuser || false,
    is_staff: data.user.is_staff || false,
  };
  storeSession(user, data.access_token, data.refresh_token);
  return user;
}


export async function signUp(username, email, password) {
  if (!username.trim()) {
    throw new Error("Username is required");
  }

  if (!email.trim()) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (USE_MOCK) {
    await latency();

    const user = {
      id: Date.now() % 100000,
      username: username.trim(),
      email: email.trim(),
      role: "customer",
      is_superuser: false,
      is_staff: false,
    };

    storeSession(
      user,
      `mock.${btoa(username).replace(/=+$/, "")}.${Date.now().toString(36)}`
    );

    return user;
  }

  await request("/accounts/register/", {
    method: "POST",
    body: JSON.stringify({
      username: username.trim(),
      email: email.trim(),
      password,
    }),
  });

  return signIn(username.trim(), password);
}


export async function signOut() {
  try {
    if (!USE_MOCK && getToken() && getRefreshToken()) {
      // Refresh first if the access token has already expired.
      if (!isTokenValid()) {
        await refreshAccessToken();
      }

      await request("/accounts/logout/", {
        method: "POST",
        body: JSON.stringify({
          refresh: getRefreshToken(),
        }),
      });
    }
  } catch (error) {
    console.error("Server logout failed:", error);
  } finally {
    clearSession();
  }
}

/* ─── Bookings ───────────────────────────────────────────────────────── */

function readBookings() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? "[]"); } catch { return []; }
}

function writeBookings(list) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}

export async function fetchBookings() {
  if (USE_MOCK) {
    await latency(220, 520);
    return readBookings().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const [bookings, venues] = await Promise.all([
    request("/booking/booking_list/"),
    fetchVenues(),
  ]);
  return (Array.isArray(bookings) ? bookings : []).map((b) => mapApiBooking(b, venues));
}

export async function createBooking(draft) {
  const session = SESSIONS.find((s) => s.id === draft.sessionId) ?? SESSIONS[1];
  const total   = session.hours * draft.venue.pricePerHour;

  if (USE_MOCK) {
    await latency(600, 1000);
    const booking = {
      id: "VN-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      venueId: draft.venue.id, venueSlug: draft.venue.slug,
      venueName: draft.venue.name, venueImage: draft.venue.image,
      location: draft.venue.location, date: draft.date,
      startTime: session.start, endTime: session.end,
      hours: session.hours, guests: draft.guests, total,
      status: "pending", createdAt: new Date().toISOString(),
    };
    writeBookings([booking, ...readBookings()]);
    window.setTimeout(() => {
      writeBookings(readBookings().map((b) => b.id === booking.id ? { ...b, status: "approved" } : b));
      window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
    }, 6500);
    return booking;
  }

  const res = await request("/booking/booking_venue/", {
    method: "POST",
    body: JSON.stringify({ venue: draft.venue.id, booking_date: draft.date, starting_time: session.start, ending_time: session.end }),
  });
  return mapApiBooking(res.data, [draft.venue]);
}


export async function cancelBooking(id) {
  // Live Django API mode
  if (!USE_MOCK) {
    return request(`/booking/cancel_booking/${id}/`, {
      method: "PATCH",
    });
  }

  // Mock mode: keep your existing mock cancellation logic here
}


export async function cancelLiveBooking(id) {
  return request(`/booking/cancel_booking/${id}/`, {
    method: "PATCH",
  });
}

// ─── Customer Host Applications ────────────────────────────────────

export const fetchMyHostApplications = () =>
  request("/accounts/host/my-applications/");

export const submitHostApplication = (data) =>
  request("/accounts/host/apply/", {
    method: "POST",
    body: JSON.stringify(data),
} );



export async function createPaymentOrder(bookingId) {
  if (USE_MOCK) {
    throw new Error("Online payments are available in live mode only.");
  }

  return request("/booking/create_payment_order/", {
    method: "POST",
    body: JSON.stringify({
      booking_id: bookingId,
    }),
  });
}

export async function verifyPayment(paymentDetails) {
  if (USE_MOCK) {
    throw new Error("Online payments are available in live mode only.");
  }

  return request("/booking/verify_payment/", {
    method: "POST",
    body: JSON.stringify({
      razorpay_order_id: paymentDetails.razorpay_order_id,
      razorpay_payment_id: paymentDetails.razorpay_payment_id,
      razorpay_signature: paymentDetails.razorpay_signature,
    }),
  });
}

export async function fetchPaymentReceipt(bookingId) {
  if (USE_MOCK) {
    throw new Error("Payment receipts are available in live mode only.");
  }

  return request(`/booking/payment_receipt/${bookingId}/`, {
    method: "GET",
  });
}

//  Notifications

export async function fetchNotifications() {
  if (USE_MOCK) {
    return { notifications: [], unread_count: 0 };
  }

  return request("/booking/notifications/");
}

export async function markNotificationAsRead(notificationId) {
  if (USE_MOCK) return null;

  return request(`/booking/notifications/${notificationId}/read/`, {
    method: "PATCH",
  });
}


// ─── Venue Reviews ─────────────────────────────────────

export async function fetchVenueReviews(venueId) {
  if (USE_MOCK) {
    return [];
  }

  return request(`/booking/venues/${venueId}/reviews/`);
}


export async function createVenueReview(reviewData) {
  if (USE_MOCK) {
    throw new Error("Reviews are available in live mode only.");
  }

  return request("/booking/reviews/create/", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}