import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Check, RotateCcw, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage, generatePost, searchSimilar } from '../lib/api';
import AuthModal from '../components/AuthModal';
import pb from '../lib/pocketbase';

export default function Submit() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState('');

  // Generated post preview
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  // Similar posts
  const [similarPosts, setSimilarPosts] = useState([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  // Send initial AI greeting on mount
  useEffect(() => {
    if (isLoggedIn && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hey! 👋 I'm here to help you submit feedback. What's on your mind? You can tell me about a bug, suggest a feature, or describe something that could be improved.",
      }]);
    }
  }, [isLoggedIn]);

  const handleSend = async () => {
    if (!input.trim() || aiLoading) return;

    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setError('');

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Build history (skip the initial greeting for API)
    const history = newMessages
      .filter((_, i) => i > 0) // Skip initial assistant greeting
      .map((m) => ({ role: m.role, content: m.content }));

    setAiLoading(true);
    try {
      const response = await sendChatMessage(userMessage, history);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply },
      ]);

      // Check if AI says it has enough details
      if (response.reply.toLowerCase().includes('enough details') ||
          response.reply.toLowerCase().includes('generate your feedback') ||
          response.reply.toLowerCase().includes('let me generate')) {
        setShowGenerate(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setAiLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    const history = messages
      .filter((_, i) => i > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      // Generate post and check for similar posts in parallel
      const [postData, _] = await Promise.all([
        generatePost(history),
        checkForSimilar(),
      ]);

      setPreview(postData);
    } catch (err) {
      console.error('Generate error:', err);
      setError('Failed to generate post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const checkForSimilar = async () => {
    setCheckingSimilar(true);
    try {
      // Use the last user messages as description
      const userMessages = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ');

      const result = await searchSimilar(userMessages);
      if (result.similar && result.similar.length > 0) {
        setSimilarPosts(result.similar);
      }
    } catch (err) {
      // Non-critical, just ignore
    } finally {
      setCheckingSimilar(false);
    }
  };

  const handlePublish = async () => {
    if (!preview) return;
    setPublishing(true);
    setError('');

    try {
      const record = await pb.collection('posts').create({
        title: preview.title,
        body: preview.body,
        category: preview.category,
        priority: preview.priority,
        status: 'new',
        author: user.id,
        votes_count: 0,
        ai_transcript: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      navigate(`/post/${record.id}`);
    } catch (err) {
      console.error('Publish error:', err);
      setError('Failed to publish. Please try again.');
      setPublishing(false);
    }
  };

  const handleAddToExisting = async (postId) => {
    setPublishing(true);
    setError('');

    try {
      // Add as a comment on the existing post
      const userMessages = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n\n');

      await pb.collection('comments').create({
        post: postId,
        author: user.id,
        body: userMessages,
        is_ai_merged: true,
      });

      navigate(`/post/${postId}`);
    } catch (err) {
      console.error('Merge error:', err);
      setError('Failed to add comment. Please try again.');
      setPublishing(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hey! 👋 I'm here to help you submit feedback. What's on your mind?",
    }]);
    setPreview(null);
    setShowGenerate(false);
    setSimilarPosts([]);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sparkles size={48} />
            </div>
            <h3 className="empty-state-title">Sign in to submit feedback</h3>
            <p className="empty-state-text">
              Our AI assistant will help you create a detailed feedback post.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowAuth(true)}>
              Sign In to Submit
            </button>
          </div>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="chat-container">
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h1 className="page-title">
              <Sparkles size={28} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--accent)', marginRight: '8px' }} />
              Submit Feedback
            </h1>
            <p className="page-subtitle">
              Chat with our AI assistant — it'll help you create a detailed feedback post.
            </p>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'}`}
              >
                <div className="chat-bubble-label">
                  {msg.role === 'assistant' ? 'AI Assistant' : 'You'}
                </div>
                {msg.content}
              </div>
            ))}

            {aiLoading && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}

            {/* Generate Button */}
            {showGenerate && !preview && !generating && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignSelf: 'center', marginTop: 'var(--space-md)' }}>
                <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
                  <Sparkles size={18} />
                  Generate Feedback Post
                </button>
                <button className="btn btn-ghost" onClick={handleReset}>
                  <RotateCcw size={16} />
                  Start Over
                </button>
              </div>
            )}

            {generating && (
              <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--accent)' }}>
                <div className="spinner" />
                <span>Generating your feedback post...</span>
              </div>
            )}

            {/* Similar Posts */}
            {similarPosts.length > 0 && !preview && (
              <div className="card similar-posts" style={{ alignSelf: 'stretch' }}>
                <div className="similar-posts-title">
                  ⚠️ Similar posts found — your feedback might already exist
                </div>
                {similarPosts.map((p) => (
                  <div key={p.id} className="similar-post-item">
                    <div className="similar-post-info">
                      <div className="similar-post-name">{p.title}</div>
                      <div className="similar-post-snippet">{p.body}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/post/${p.id}`)}
                      >
                        <Eye size={12} />
                        View
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToExisting(p.id)}
                        disabled={publishing}
                      >
                        Add to this
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  Not a duplicate? Click "Generate Feedback Post" above to create a new post.
                </div>
              </div>
            )}

            {/* Preview Card */}
            {preview && (
              <div className="card preview-card" style={{ alignSelf: 'stretch' }}>
                <div className="preview-header">
                  <Sparkles size={16} />
                  AI-Generated Preview
                </div>

                <input
                  className="input"
                  value={preview.title}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                  style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', marginBottom: 'var(--space-md)', background: 'transparent', border: '1px solid var(--border-subtle)' }}
                />

                <textarea
                  className="input"
                  value={preview.body}
                  onChange={(e) => setPreview({ ...preview, body: e.target.value })}
                  rows={6}
                  style={{ marginBottom: 'var(--space-md)', background: 'transparent', border: '1px solid var(--border-subtle)' }}
                />

                <div className="preview-badges">
                  <select
                    className="input"
                    value={preview.category}
                    onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                    style={{ width: 'auto' }}
                  >
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Feature</option>
                    <option value="improvement">🔧 Improvement</option>
                  </select>

                  <select
                    className="input"
                    value={preview.priority}
                    onChange={(e) => setPreview({ ...preview, priority: e.target.value })}
                    style={{ width: 'auto' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="preview-actions">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handlePublish}
                    disabled={publishing}
                  >
                    {publishing ? <div className="spinner" /> : <><Check size={18} /> Publish Post</>}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setPreview(null); setShowGenerate(true); }}>
                    <RotateCcw size={16} />
                    Regenerate
                  </button>
                  <button className="btn btn-ghost" onClick={handleReset}>
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message" style={{ alignSelf: 'stretch' }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!preview && (
            <div className="chat-input-area">
              <div className="chat-input-row">
                <textarea
                  ref={inputRef}
                  className="input"
                  placeholder="Describe your feedback..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={aiLoading || generating}
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px', resize: 'none' }}
                />
                <button
                  className="btn btn-primary btn-icon"
                  onClick={handleSend}
                  disabled={!input.trim() || aiLoading}
                  style={{ width: '44px', height: '44px' }}
                >
                  <Send size={18} />
                </button>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)', textAlign: 'center' }}>
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
