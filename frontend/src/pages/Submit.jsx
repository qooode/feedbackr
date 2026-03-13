import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Check, RotateCcw, Eye, Send, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage, generatePost, searchSimilar } from '../lib/api';
import AuthModal from '../components/AuthModal';
import pb from '../lib/pocketbase';

export default function Submit() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const followupRef = useRef(null);
  const threadEndRef = useRef(null);

  const [input, setInput] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState('');

  // AI conversation state
  const [aiActive, setAiActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [followupInput, setFollowupInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Generated post preview
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  // Similar posts
  const [similarPosts, setSimilarPosts] = useState([]);

  // Auto-scroll conversation thread
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  // Focus followup input when AI becomes active
  useEffect(() => {
    if (aiActive && followupRef.current) {
      followupRef.current.focus();
    }
  }, [aiActive, messages]);

  const handleInitialSubmit = async () => {
    if (!input.trim()) return;

    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    const userMessage = input.trim();
    setError('');

    // Activate the AI panel
    setAiActive(true);
    const initialMessages = [{ role: 'user', content: userMessage }];
    setMessages(initialMessages);
    setInput('');

    // Send to AI
    setAiLoading(true);
    try {
      const response = await sendChatMessage(userMessage, [
        { role: 'user', content: userMessage },
      ]);

      setMessages([
        ...initialMessages,
        { role: 'assistant', content: response.reply },
      ]);

      checkForReadiness(response.reply);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to get AI response.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFollowup = async () => {
    if (!followupInput.trim() || aiLoading) return;

    const userMessage = followupInput.trim();
    setFollowupInput('');
    setError('');

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    const history = newMessages
      .map((m) => ({ role: m.role, content: m.content }));

    setAiLoading(true);
    try {
      const response = await sendChatMessage(userMessage, history);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply },
      ]);

      checkForReadiness(response.reply);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to send message.');
    } finally {
      setAiLoading(false);
      followupRef.current?.focus();
    }
  };

  const checkForReadiness = (reply) => {
    const lower = reply.toLowerCase();
    if (
      lower.includes('enough details') ||
      lower.includes('generate your feedback') ||
      lower.includes('let me generate') ||
      lower.includes('ready to generate')
    ) {
      setShowGenerate(true);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const [postData] = await Promise.all([
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
    try {
      const userMessages = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ');
      const result = await searchSimilar(userMessages);
      if (result.similar?.length > 0) {
        setSimilarPosts(result.similar);
      }
    } catch {
      // Non-critical
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
    setMessages([]);
    setPreview(null);
    setShowGenerate(false);
    setSimilarPosts([]);
    setAiActive(false);
    setFollowupInput('');
    setInput('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInitialSubmit();
    }
  };

  const handleFollowupKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFollowup();
    }
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <MessageSquare size={40} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">Sign in to submit feedback</h3>
            <p className="empty-state-text">
              Describe your idea and our AI will help structure it into a clear post.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowAuth(true)}>
              Sign In to Continue
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
        <div className="submit-layout">
          {/* Hero */}
          <div className="submit-hero">
            <h1 className="submit-hero-title">Submit Feedback</h1>
            <p className="submit-hero-subtitle">
              Describe what's on your mind. AI will help refine your thoughts into a clear, actionable post.
            </p>
          </div>

          {/* Main Textarea Card */}
          <div className="card submit-card">
            <div className="submit-card-inner">
              <textarea
                ref={textareaRef}
                className="submit-textarea"
                placeholder="What would you like to share? Describe a bug, suggest a feature, or tell us how something could be better..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={aiActive && !preview}
                rows={5}
              />
            </div>

            <div className="submit-footer">
              <div className="submit-footer-hint">
                <Sparkles size={13} />
                <span>AI will review and help structure your feedback</span>
              </div>
              <div className="submit-footer-actions">
                {aiActive && (
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                    <RotateCcw size={13} />
                    Reset
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleInitialSubmit}
                  disabled={!input.trim() || (aiActive && !preview)}
                >
                  <ArrowRight size={15} />
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* AI Conversation Panel */}
          {aiActive && !preview && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className="ai-panel-indicator" />
                <span className="ai-panel-label">AI Assistant</span>
              </div>

              {/* Threaded conversation */}
              <div className="conversation-thread">
                {messages.map((msg, i) => (
                  <div key={i} className="conversation-message">
                    <div className={`conversation-avatar ${msg.role === 'assistant' ? 'conversation-avatar-ai' : ''}`}>
                      {msg.role === 'assistant' ? '✦' : (user?.name || user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="conversation-content">
                      <div className="conversation-name">
                        {msg.role === 'assistant' ? 'AI' : 'You'}
                      </div>
                      <div className={`conversation-text ${msg.role === 'user' ? 'user-text' : ''}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Generate button row */}
              {showGenerate && !generating && (
                <div className="ai-panel-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
                    <Sparkles size={13} />
                    Generate Post
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                    <RotateCcw size={13} />
                    Start Over
                  </button>
                </div>
              )}

              {generating && (
                <div className="ai-panel-actions" style={{ justifyContent: 'center' }}>
                  <div className="spinner" />
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
                    Generating your post...
                  </span>
                </div>
              )}

              {/* Follow-up input */}
              {!showGenerate && !generating && (
                <div className="ai-followup">
                  <input
                    ref={followupRef}
                    className="input"
                    type="text"
                    placeholder="Reply to AI..."
                    value={followupInput}
                    onChange={(e) => setFollowupInput(e.target.value)}
                    onKeyDown={handleFollowupKeyDown}
                    disabled={aiLoading}
                  />
                  <button
                    className="btn btn-secondary btn-icon-sm"
                    onClick={handleFollowup}
                    disabled={!followupInput.trim() || aiLoading}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Similar Posts */}
          {similarPosts.length > 0 && !preview && (
            <div className="card similar-posts">
              <div className="similar-posts-title">
                <span>⚠</span>
                Similar posts already exist
              </div>
              {similarPosts.map((p) => (
                <div key={p.id} className="similar-post-item">
                  <div className="similar-post-info">
                    <div className="similar-post-name">{p.title}</div>
                    <div className="similar-post-snippet">{p.body}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
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
              <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
                Not a duplicate? Use "Generate Post" above to create a new post.
              </div>
            </div>
          )}

          {/* Preview Card */}
          {preview && (
            <div className="card preview-card">
              <div className="preview-header">
                <Sparkles size={13} />
                AI-Generated Preview
              </div>

              <div className="preview-inner">
                <input
                  className="input"
                  value={preview.title}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                  style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: '600',
                    marginBottom: 'var(--space-4)',
                    letterSpacing: '-0.02em',
                  }}
                />

                <textarea
                  className="input"
                  value={preview.body}
                  onChange={(e) => setPreview({ ...preview, body: e.target.value })}
                  rows={5}
                  style={{ marginBottom: 'var(--space-4)' }}
                />

                <div className="preview-badges">
                  <select
                    className="input"
                    value={preview.category}
                    onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                    style={{ width: 'auto' }}
                  >
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
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
              </div>

              <div className="preview-actions">
                <button
                  className="btn btn-primary"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <Check size={15} />
                      Publish
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setPreview(null); setShowGenerate(true); }}
                >
                  <RotateCcw size={13} />
                  Regenerate
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-message" style={{ marginTop: 'var(--space-4)' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
