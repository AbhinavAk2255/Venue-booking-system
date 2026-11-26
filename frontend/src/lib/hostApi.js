
import { apiClient, getToken, clearSession } from "./api";

async function hostRequest(path, options = {}) {
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
      data:
        body instanceof FormData
          ? body
          : body
            ? JSON.parse(body)
            : undefined,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...otherOptions,
    });

    return response.data;
  } catch (error) {
    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
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

// Owner's own venues
export const fetchMyVenues = () =>
  hostRequest("/venues/venue_dasboard/");

// Create venue (multipart for image upload)
export const createVenue = (formData) =>
  hostRequest("/venues/create/", {
    method: "POST",
    body: formData,
  });

// Update venue
export const updateMyVenue = (id, formData) =>
  hostRequest(`/venues/update_venue/${id}/`, {
    method: "PUT",
    body: formData,
  });

// Delete venue
export const deleteMyVenue = (id) =>
  hostRequest(`/venues/delete_venue/${id}/`, {
    method: "DELETE",
  });

// Bookings on my venues
export const fetchMyVenueBookings = () =>
  hostRequest("/booking/owner_booking_list/");

// Approve or reject a booking on my venue
export const updateBookingStatus = (id, status) =>
  hostRequest(`/booking/update_status/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
