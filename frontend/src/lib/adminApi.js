
import { apiClient, getToken, clearSession } from "./api";

async function adminRequest(path, options = {}) {
  const token = getToken();

  const {
    method = "GET",
    body,
    headers = {},
    ...otherOptions
  } = options;

  try {
    const response = await apiClient.request({
      url: path,
      method,
      data: body ? JSON.parse(body) : undefined,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...otherOptions,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      clearSession();
    }

    const responseData = error.response?.data;

    const message =
      responseData?.message ||
      responseData?.detail ||
      responseData?.error ||
      error.message ||
      "Unable to connect to the server.";

    throw new Error(String(message));
  }
}

// Dashboard
export const fetchStats = () => adminRequest("/admin/stats/");

// Users
export const fetchUsers = (params = "") =>
  adminRequest(`/admin/users/${params ? `?${params}` : ""}`);

export const createUser = (data) =>
  adminRequest("/admin/users/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateUser = (id, data) =>
  adminRequest(`/admin/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUser = (id) =>
  adminRequest(`/admin/users/${id}/`, { method: "DELETE" });

export const toggleUser = (id) =>
  adminRequest(`/admin/users/${id}/`, { method: "PATCH" });

// export const toggleUser = (id) =>
//   adminRequest(`/admin/users/${id}/toggle/`, {
//     method: "PATCH",
// });

// Venues
export const fetchAdminVenues = (params = "") =>
  adminRequest(`/admin/venues/${params ? `?${params}` : ""}`);

export const updateVenue = (id, data) =>
  adminRequest(`/admin/venues/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteVenue = (id) =>
  adminRequest(`/admin/venues/${id}/`, { method: "DELETE" });

// Bookings
export const fetchAdminBookings = (params = "") =>
  adminRequest(`/admin/bookings/${params ? `?${params}` : ""}`);

export const updateBookingStatus = (id, status) =>
  adminRequest(`/admin/bookings/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteBooking = (id) =>
  adminRequest(`/admin/bookings/${id}/delete/`, { method: "DELETE" });

// Host Applications
export const fetchHostApplications = (status = "") => {
  const params = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  return adminRequest(`/admin/host-applications/${params}`);
};

export const approveHostApplication = (id, adminNote = "") =>
  adminRequest(`/admin/host-applications/${id}/review/`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "approved",
      admin_note: adminNote,
    }),
  });

export const rejectHostApplication = (id, adminNote = "") =>
  adminRequest(`/admin/host-applications/${id}/review/`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "rejected",
      admin_note: adminNote,
    }),
  });
