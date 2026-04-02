const BASE_URL ="http://localhost:3000/api";

// ─── JSON request helper ───────────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── Multipart request (for image uploads) ────────────────────────────────────
const multipartRequest = async (endpoint, formData) => {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

/**
 * GET /api/messages?receiverId=...
 * Fetch all messages between current user and receiverId
 * Returns { success, roomId, count, messages: [...] }
 */
export const getMessages = (receiverId) =>
  request(`/messages?receiverId=${receiverId}`);

/**
 * POST /api/messages/send
 * Send a text or image message
 * @param {string} receiverId
 * @param {string} message   text content
 * @param {File}   [image]   optional image file
 */
export const sendMessage = (receiverId, message, image = null) => {
  if (image) {
    const fd = new FormData();
    fd.append("receiverId", receiverId);
    fd.append("message", message || "");
    fd.append("image", image);
    return multipartRequest("/messages/send", fd);
  }
  return request("/messages/send", {
    method: "POST",
    body: JSON.stringify({ receiverId, message }),
  });
};

/**
 * DELETE /api/messages/:messageId
 * Delete a message the current user sent
 */
export const deleteMessage = (messageId) =>
  request(`/messages/${messageId}`, { method: "DELETE" });