import pb from './pocketbase';

/**
 * Wrapper that handles 401 (stale token after redeploy) gracefully.
 * Clears the auth store and prompts the user to refresh.
 */
async function safeSend(path, options) {
  try {
    return await pb.send(path, options);
  } catch (err) {
    if (err?.status === 401 || err?.response?.code === 401) {
      pb.authStore.clear();
      const wrapped = new Error('Your session expired. Please refresh the page and log in again.');
      wrapped.status = 401;
      throw wrapped;
    }
    throw err;
  }
}

/**
 * Send a message to the AI chat assistant
 */
export async function sendChatMessage(message, history) {
  return safeSend('/api/feedbackr/chat', {
    method: 'POST',
    body: { message, history },
  });
}

/**
 * Generate a structured post from conversation history
 */
export async function generatePost(history) {
  return safeSend('/api/feedbackr/generate', {
    method: 'POST',
    body: { history },
  });
}

/**
 * Search for similar existing posts
 */
export async function searchSimilar(description) {
  return safeSend('/api/feedbackr/similar', {
    method: 'POST',
    body: { description },
  });
}

/**
 * Upload a file attachment via server-side proxy (Catbox)
 * The userhash never leaves the server.
 */
export async function uploadAttachment(file) {
  const formData = new FormData();
  formData.append('file', file);

  // Use pb.send with raw fetch body (FormData)
  // PocketBase SDK will add the auth header automatically
  const res = await fetch(`${pb.baseURL}/api/feedbackr/upload`, {
    method: 'POST',
    headers: {
      Authorization: pb.authStore.token,
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || 'Upload failed');
    err.status = res.status;
    throw err;
  }

  return res.json(); // { url: "https://files.catbox.moe/..." }
}

/**
 * Delete attachment(s) from Catbox (admin only)
 */
export async function deleteAttachment(urls) {
  return safeSend('/api/feedbackr/delete-attachment', {
    method: 'POST',
    body: { urls: Array.isArray(urls) ? urls : [urls] },
  });
}
