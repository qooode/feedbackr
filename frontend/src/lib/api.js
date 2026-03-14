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
