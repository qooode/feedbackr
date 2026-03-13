import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Sparkles, Check, RotateCcw, Eye, Send, MessageSquare, X, AlertTriangle, MessageCircle, ChevronDown, Zap, PenLine, Edit3, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage, generatePost, searchSimilar } from '../lib/api';
import AuthModal from '../components/AuthModal';
import pb from '../lib/pocketbase';

const CATEGORIES = [
  { value: 'bug', label: 'Bug', color: '#ef4444' },
  { value: 'feature', label: 'Feature', color: '#a1a1aa' },
  { value: 'improvement', label: 'Improvement', color: '#71717a' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#52525b' },
  { value: 'medium', label: 'Medium', color: '#71717a' },
  { value: 'high', label: 'High', color: '#a1a1aa' },
  { value: 'critical', label: 'Critical', color: '#dc2626' },
];

export default function Submit() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const followupRef = useRef(null);
  const similarSectionRef = useRef(null);

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

  // Preview/Edit toggle
  const [previewMode, setPreviewMode] = useState('preview');

  // Similar posts
  const [similarPosts, setSimilarPosts] = useState([]);
  const [similarDismissed, setSimilarDismissed] = useState(false);
  const [checkingSimilar, setCheckingSimilar] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishedId, setPublishedId] = useState(null);

  // Focus followup input when AI becomes active
  useEffect(() => {
    if (aiActive && followupRef.current && !showGenerate && !generating) {
      followupRef.current.focus();
    }
  }, [aiActive, messages, showGenerate, generating]);

  // Auto-dismiss error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Current step for progress
  const currentStep = !aiActive ? 0 : preview ? 2 : 1;

  const handleInitialSubmit = async () => {
    if (!input.trim()) return;

    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    const userMessage = input.trim();
    setError('');
    setSimilarDismissed(false);
    setSimilarPosts([]);

    // Activate the AI panel
    setAiActive(true);
    const initialMessages = [{ role: 'user', content: userMessage }];
    setMessages(initialMessages);
    setInput('');

    // Check for similar posts immediately (in parallel with AI)
    setCheckingSimilar(true);
    searchSimilar(userMessage).then(result => {
      if (result.similar?.length > 0) {
        setSimilarPosts(result.similar);
      }
    }).catch(() => {}).finally(() => setCheckingSimilar(false));

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
      const postData = await generatePost(history);
      setPreview(postData);
      setPreviewMode('preview');

      // Re-check for similar posts using the structured title+body for better matching
      try {
        const result = await searchSimilar(`${postData.title} ${postData.body}`);
        if (result.similar?.length > 0) {
          setSimilarPosts(result.similar);
        }
      } catch {}
    } catch (err) {
      console.error('Generate error:', err);
      setError('Failed to generate post. Please try again.');
    } finally {
      setGenerating(false);
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
        ai_transcript: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      setPublishedId(record.id);
      setShowSuccess(true);

      // Navigate after showing success
      setTimeout(() => {
        navigate(`/post/${record.id}`);
      }, 1800);
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
        body: userMessages,
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
    setSimilarDismissed(false);
    setAiActive(false);
    setFollowupInput('');
    setInput('');
    setError('');
    setPreviewMode('preview');
  };

  const handleStepClick = (step) => {
    if (step === 0 && currentStep > 0) {
      handleReset();
    } else if (step === 1 && currentStep > 1) {
      setPreview(null);
      setShowGenerate(true);
      setPreviewMode('preview');
    }
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

  // Get the latest AI message for inline display
  const latestAiMessage = [...messages].reverse().find(m => m.role === 'assistant');

  const charCount = input.length;
  const charSufficient = charCount >= 30;

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
          {/* Success overlay */}
          {showSuccess && (
            <div className="success-overlay">
              <div className="success-checkmark">
                <Check size={32} strokeWidth={3} />
              </div>
              <div className="success-title">Post Published!</div>
              <div className="success-subtitle">Redirecting you to your post...</div>
            </div>
          )}

          {/* Hero */}
          <div className="submit-hero">
            <h1 className="submit-hero-title">Submit Feedback</h1>
            <p className="submit-hero-subtitle">
              Describe what's on your mind. AI will help refine your thoughts into a clear, actionable post.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="submit-steps">
            <div
              className={`submit-step ${currentStep >= 0 ? 'submit-step-active' : ''} ${currentStep > 0 ? 'submit-step-done' : ''} ${currentStep > 0 ? 'submit-step-clickable' : ''}`}
              onClick={() => handleStepClick(0)}
            >
              <div className="submit-step-dot">
                {currentStep > 0 ? <Check size={10} strokeWidth={3} /> : '1'}
              </div>
              <span className="submit-step-label">Describe</span>
            </div>
            <div className="submit-step-line" />
            <div
              className={`submit-step ${currentStep >= 1 ? 'submit-step-active' : ''} ${currentStep > 1 ? 'submit-step-done' : ''} ${currentStep > 1 ? 'submit-step-clickable' : ''}`}
              onClick={() => handleStepClick(1)}
            >
              <div className="submit-step-dot">
                {currentStep > 1 ? <Check size={10} strokeWidth={3} /> : '2'}
              </div>
              <span className="submit-step-label">Refine</span>
            </div>
            <div className="submit-step-line" />
            <div className={`submit-step ${currentStep >= 2 ? 'submit-step-active' : ''}`}>
              <div className="submit-step-dot">3</div>
              <span className="submit-step-label">Publish</span>
            </div>
          </div>

          {/* Step 1: Initial Input */}
          {!aiActive && (
            <div className="submit-input-card">
              <div className="submit-input-glow" />
              <textarea
                ref={textareaRef}
                className="submit-textarea-v2"
                placeholder="What would you like to share? Describe a bug, suggest a feature, or tell us how something could be better..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
              />
              <div className="submit-input-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="submit-input-hint">
                    <Sparkles size={12} />
                    <span>AI will review and help structure your feedback</span>
                  </div>
                  {charCount > 0 && charCount < 30 && (
                    <span className="submit-char-nudge">
                      — try adding a bit more detail
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`submit-char-count ${charCount > 0 ? 'has-content' : ''} ${charSufficient ? 'sufficient' : ''}`}>
                    {charCount > 0 ? charCount : ''}
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={handleInitialSubmit}
                    disabled={!input.trim()}
                  >
                    Continue
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Refine Phase */}
          {aiActive && !preview && (
            <div className="refine-section">
              {/* Inline duplicate banner at top */}
              {similarPosts.length > 0 && !similarDismissed && (
                <div
                  className="duplicate-banner"
                  onClick={() => similarSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <AlertTriangle size={14} className="duplicate-banner-icon" />
                  <span className="duplicate-banner-text">
                    <strong>{similarPosts.length} similar {similarPosts.length === 1 ? 'post' : 'posts'}</strong> found — scroll down to review
                  </span>
                  <ChevronDown size={14} className="duplicate-banner-arrow" />
                </div>
              )}

              {/* Your original feedback */}
              <div className="refine-original">
                <div className="refine-original-label">
                  <PenLine size={12} />
                  Your feedback
                </div>
                <p className="refine-original-text">
                  {messages.find(m => m.role === 'user')?.content}
                </p>
              </div>

              {/* AI Response — inline, rendered as markdown */}
              {latestAiMessage && (
                <div className="refine-ai-block">
                  <div className="refine-ai-header">
                    <div className="refine-ai-icon">
                      <Sparkles size={14} />
                    </div>
                    <span>AI Feedback</span>
                  </div>
                  <div className="refine-ai-body">
                    <ReactMarkdown>{latestAiMessage.content}</ReactMarkdown>
                  </div>

                  {/* Previous exchanges collapsed */}
                  {messages.filter(m => m.role === 'user').length > 1 && (
                    <details className="refine-history">
                      <summary className="refine-history-toggle">
                        View conversation ({messages.length} messages)
                      </summary>
                      <div className="refine-history-list">
                        {messages.slice(0, -1).map((msg, i) => (
                          <div key={i} className={`refine-history-item ${msg.role === 'assistant' ? 'refine-history-ai' : ''}`}>
                            <span className="refine-history-role">{msg.role === 'assistant' ? 'AI' : 'You'}</span>
                            <p>{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Skeleton loading state */}
              {aiLoading && (
                <div className="refine-loading">
                  <div className="refine-loading-header">
                    <div className="refine-loading-header-dot" />
                    <div className="refine-loading-header-text" />
                  </div>
                  <div className="refine-loading-body">
                    <div className="refine-skeleton-line" />
                    <div className="refine-skeleton-line" />
                    <div className="refine-skeleton-line" />
                    <div className="refine-skeleton-line" />
                  </div>
                  <div className="refine-loading-status">
                    <div className="refine-loading-dot" />
                    <div className="refine-loading-dot" />
                    <div className="refine-loading-dot" />
                    <span>AI is analyzing your feedback...</span>
                  </div>
                </div>
              )}

              {/* Follow-up or Generate */}
              {!aiLoading && !showGenerate && (
                <div className="refine-reply-card">
                  <textarea
                    ref={followupRef}
                    className="refine-reply-input"
                    placeholder="Add more details or answer the AI's question..."
                    value={followupInput}
                    onChange={(e) => setFollowupInput(e.target.value)}
                    onKeyDown={handleFollowupKeyDown}
                    rows={2}
                  />
                  <div className="refine-reply-bar">
                    <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                      <RotateCcw size={12} />
                      Start over
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleFollowup}
                      disabled={!followupInput.trim()}
                    >
                      Reply
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

              {showGenerate && !generating && (
                <div className="refine-ready">
                  <div className="refine-ready-icon">
                    <Zap size={18} />
                  </div>
                  <div className="refine-ready-text">
                    <strong>Ready to generate your post</strong>
                    <span>The AI has enough context to create a structured feedback post.</span>
                  </div>
                  <div className="refine-ready-actions">
                    <button className="btn btn-primary" onClick={handleGenerate}>
                      <Sparkles size={14} />
                      Generate Post
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                      Start Over
                    </button>
                  </div>
                </div>
              )}

              {generating && (
                <div className="refine-generating">
                  <div className="refine-generating-animation">
                    <div className="refine-generating-ring" />
                    <Sparkles size={16} className="refine-generating-icon" />
                  </div>
                  <span>Crafting your post...</span>
                </div>
              )}
            </div>
          )}

          {/* Similar Posts */}
          {similarPosts.length > 0 && !similarDismissed && !preview && (
            <div className="similar-card" ref={similarSectionRef}>
              <div className="similar-card-accent" />
              <div className="similar-card-header">
                <div className="similar-card-icon">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div className="similar-card-title">Similar feedback exists</div>
                  <div className="similar-card-desc">
                    Consider adding your voice to an existing post to help us prioritize.
                  </div>
                </div>
              </div>

              <div className="similar-card-list">
                {similarPosts.map((p) => (
                  <div key={p.id} className="similar-card-item">
                    <div className="similar-card-item-info">
                      <div className="similar-card-item-title">{p.title}</div>
                      <div className="similar-card-item-snippet">{p.body}</div>
                      <div className="similar-card-item-meta">
                        <span className={`badge badge-${p.category}`}>{p.category}</span>
                        <span className="similar-card-item-votes">▲ {p.votes_count || 0}</span>
                        {p.status && <span className={`badge badge-${p.status}`}>{p.status}</span>}
                      </div>
                    </div>
                    <div className="similar-card-item-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToExisting(p.id)}
                        disabled={publishing}
                      >
                        <MessageCircle size={12} />
                        Add my feedback
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/post/${p.id}`)}
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="similar-card-dismiss">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSimilarDismissed(true)}
                >
                  <X size={12} />
                  This is different — continue with new post
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Publish */}
          {preview && (
            <div className="publish-section">
              <div className="publish-card">
                <div className="publish-card-header">
                  <div className="publish-card-tag">
                    <Sparkles size={12} />
                    Generated Post
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="publish-view-toggle">
                      <button
                        className={`publish-view-toggle-btn ${previewMode === 'preview' ? 'active' : ''}`}
                        onClick={() => setPreviewMode('preview')}
                      >
                        <Eye size={11} />
                        Preview
                      </button>
                      <button
                        className={`publish-view-toggle-btn ${previewMode === 'edit' ? 'active' : ''}`}
                        onClick={() => setPreviewMode('edit')}
                      >
                        <Edit3 size={11} />
                        Edit
                      </button>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setPreview(null); setShowGenerate(true); }}>
                      <RotateCcw size={12} />
                      Regenerate
                    </button>
                  </div>
                </div>

                {previewMode === 'preview' ? (
                  <div className="publish-preview-rendered">
                    <div className="publish-preview-title">{preview.title}</div>
                    <div className="publish-preview-body">
                      <ReactMarkdown>{preview.body}</ReactMarkdown>
                    </div>
                    <div className="publish-preview-meta">
                      <span className={`badge badge-${preview.category}`}>{preview.category}</span>
                      <span className={`badge badge-priority-${preview.priority}`}>{preview.priority}</span>
                    </div>
                  </div>
                ) : (
                  <div className="publish-card-body">
                    <input
                      className="publish-title-input"
                      value={preview.title}
                      onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                      placeholder="Post title"
                    />

                    <textarea
                      className="publish-body-input"
                      value={preview.body}
                      onChange={(e) => setPreview({ ...preview, body: e.target.value })}
                      rows={5}
                      placeholder="Post body"
                    />

                    <div className="publish-meta-row">
                      <div className="publish-meta-item">
                        <label className="publish-meta-label">Category</label>
                        <div className="segmented-picker">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.value}
                              className={`segmented-option ${preview.category === cat.value ? 'selected' : ''}`}
                              onClick={() => setPreview({ ...preview, category: cat.value })}
                            >
                              <span className="segmented-dot" style={{ background: cat.color }} />
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="publish-meta-item">
                        <label className="publish-meta-label">Priority</label>
                        <div className="segmented-picker">
                          {PRIORITIES.map((pri) => (
                            <button
                              key={pri.value}
                              className={`segmented-option ${preview.priority === pri.value ? 'selected' : ''}`}
                              onClick={() => setPreview({ ...preview, priority: pri.value })}
                            >
                              <span className="segmented-dot" style={{ background: pri.color }} />
                              {pri.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final duplicate check on preview */}
                {similarPosts.length > 0 && (
                  <div className="publish-similar-notice">
                    <AlertTriangle size={13} />
                    <span>Similar posts exist — consider adding to an existing one:</span>
                    <div className="publish-similar-links">
                      {similarPosts.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleAddToExisting(p.id)}
                          disabled={publishing}
                        >
                          <MessageCircle size={11} />
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="publish-actions">
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                    Start Over
                  </button>
                  <button
                    className="btn btn-primary btn-lg publish-btn"
                    onClick={handlePublish}
                    disabled={publishing}
                  >
                    {publishing ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <Check size={16} />
                        Publish Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-card">
              <div className="error-card-icon">
                <AlertCircle size={14} />
              </div>
              <div className="error-card-content">
                <div className="error-card-text">{error}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>
                  <X size={12} />
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
