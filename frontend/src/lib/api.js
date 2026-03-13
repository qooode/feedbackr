import pb from './pocketbase';

/**
 * Send a message to the AI chat assistant
 */
export async function sendChatMessage(message, history) {
  return pb.send('/api/feedbackr/chat', {
    method: 'POST',
    body: { message, history },
  });
}

/**
 * Generate a structured post from conversation history
 */
export async function generatePost(history) {
  return pb.send('/api/feedbackr/generate', {
    method: 'POST',
    body: { history },
  });
}

/**
 * Search for similar existing posts
 */
export async function searchSimilar(description) {
  return pb.send('/api/feedbackr/similar', {
    method: 'POST',
    body: { description },
  });
}
