import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Check, RotateCcw, Eye, MessageSquare, X, AlertTriangle, MessageCircle, Edit3, AlertCircle, Loader2, ArrowRight, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage, generatePost, searchSimilar } from '../lib/api';
import AuthModal from '../components/AuthModal';
import pb from '../lib/pocketbase';

const CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PLATFORMS = [
  { value: 'all', label: 'All' },
  { value: 'iOS', label: 'iOS' },
  { value: 'iPadOS', label: 'iPadOS' },
  { value: 'macOS', label: 'macOS' },
  { value: 'tvOS', label: 'tvOS' },
];

export default function Submit() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const followupRef = useRef(null);

  const [input, setInput] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState('');

  // AI conversation
  const [messages, setMessages] = useState([]);
  const [aiActive, setAiActive] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [followupInput, setFollowupInput] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [aiOptions, setAiOptions] = useState([]);

  // Generated post
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState('preview');

  // Similar posts
  const [similarPosts, setSimilarPosts] = useState([]);
  const [similarDismissed, setSimilarDismissed] = useState(false);

  // Success
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Focus followup input when AI responds
  useEffect(() => {
    if (aiActive && !aiLoading && !showGenerate && followupRef.current) {
      followupRef.current.focus();
    }
  }, [aiActive, aiLoading, showGenerate, messages]);

  const charCount = input.length;
  const isReady = charCount >= 15;

  // Get latest AI message
  const latestAiMessage = [...messages].reverse().find(m => m.role === 'assistant');

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

  // Step 1 → Step 2: Send initial feedback to AI
  const handleInitialSubmit = async () => {
    if (!input.trim()) return;
    if (!isLoggedIn) { setShowAuth(true); return; }

    const userMessage = input.trim();
    setError('');
    setSimilarDismissed(false);
    setSimilarPosts([]);
    setAiActive(true);

    const initialMessages = [{ role: 'user', content: userMessage }];
    setMessages(initialMessages);
    setInput('');

    // Check similar in parallel
    searchSimilar(userMessage).then(r => {
      if (r.similar?.length > 0) setSimilarPosts(r.similar);
    }).catch(() => {});

    // Send to AI
    setAiLoading(true);
    setAiOptions([]);
    try {
      const response = await sendChatMessage(userMessage, [
        { role: 'user', content: userMessage },
      ]);
      setMessages([...initialMessages, { role: 'assistant', content: response.reply }]);
      if (response.options?.length > 0) setAiOptions(response.options);
      checkForReadiness(response.reply);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to get AI response.');
    } finally {
      setAiLoading(false);
    }
  };

  // Follow-up reply
  const handleFollowup = async () => {
    if (!followupInput.trim() || aiLoading) return;

    const userMessage = followupInput.trim();
    setFollowupInput('');
    setError('');

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    const history = newMessages.map(m => ({ role: m.role, content: m.content }));

    setAiLoading(true);
    setAiOptions([]);
    try {
      const response = await sendChatMessage(userMessage, history);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      if (response.options?.length > 0) setAiOptions(response.options);
      checkForReadiness(response.reply);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to send message.');
    } finally {
      setAiLoading(false);
    }
  };

  // Generate post from conversation
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const postData = await generatePost(history);
      setPreview(postData);
      setPreviewMode('preview');

      // Re-check similar in background (don't block the preview)
      searchSimilar(`${postData.title} ${postData.body}`).then(r => {
        if (r.similar?.length > 0) {
          setSimilarPosts(r.similar);
          setSimilarDismissed(false);
        }
      }).catch(() => {});
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
        platform: preview.platform || 'all',
        ai_transcript: messages.map(m => ({ role: m.role, content: m.content })),
      });
      setShowSuccess(true);
      setTimeout(() => navigate(`/post/${record.id}`), 1800);
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
      const userText = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      await pb.collection('comments').create({ post: postId, body: userText });
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
    setAiOptions([]);
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
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
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
          {showSuccess && (
            <div className="success-overlay">
              <div className="success-checkmark"><Check size={32} strokeWidth={3} /></div>
              <div className="success-title">Post Published!</div>
              <div className="success-subtitle">Redirecting you to your post...</div>
            </div>
          )}

          <div className="submit-hero">
            <h1 className="submit-hero-title">Submit Feedback</h1>
            <p className="submit-hero-subtitle">
              Describe what's on your mind. AI will ask follow-up questions to get the full picture, then structure it into a clear post.
            </p>
          </div>

          {/* Step 1: Initial input */}
          {!aiActive && !preview && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <textarea
                ref={textareaRef}
                className="compose-textarea"
                placeholder="What would you like to share? Describe a bug, suggest a feature, or tell us how something could be better..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
                autoFocus
              />
              <div className="compose-footer">
                <div className="compose-footer-left">
                  {charCount > 0 ? (
                    <span className={`compose-counter ${isReady ? 'ready' : ''}`}>
                      {charCount}
                      {!isReady && <span className="compose-counter-hint"> — add more detail</span>}
                    </span>
                  ) : (
                    <span className="compose-hint">
                      <Sparkles size={12} />
                      AI will ask follow-ups to get details for your dev team
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleInitialSubmit}
                  disabled={!input.trim()}
                >
                  Continue
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: AI Refine */}
          {aiActive && !preview && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Original feedback */}
              <div className="refine-quote">
                <div className="refine-quote-label">Your feedback</div>
                <p className="refine-quote-text">
                  {messages.find(m => m.role === 'user')?.content}
                </p>
              </div>

              {/* AI response */}
              {latestAiMessage && (
                <div className="refine-response">
                  <div className="refine-response-header">
                    <Sparkles size={12} />
                    <span>AI Assistant</span>
                  </div>
                  <div className="refine-response-body">
                    {latestAiMessage.content}
                  </div>
                </div>
              )}

              {/* AI quick-reply options */}
              {!aiLoading && aiOptions.length > 0 && !showGenerate && (
                <div className="refine-options">
                  <div className="refine-options-label">Quick reply</div>
                  <div className="refine-options-chips">
                    {aiOptions.map((option, i) => (
                      <button
                        key={i}
                        className="refine-option-chip"
                        onClick={() => {
                          setFollowupInput(option);
                          // Auto-send after a tiny delay so user sees it fill
                          setTimeout(() => {
                            setFollowupInput('');
                            setAiOptions([]);
                            const newMessages = [...messages, { role: 'user', content: option }];
                            setMessages(newMessages);
                            const history = newMessages.map(m => ({ role: m.role, content: m.content }));
                            setAiLoading(true);
                            sendChatMessage(option, history).then(response => {
                              setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
                              if (response.options?.length > 0) setAiOptions(response.options);
                              checkForReadiness(response.reply);
                            }).catch(err => {
                              setError(err?.message || 'Failed to send message.');
                            }).finally(() => {
                              setAiLoading(false);
                            });
                          }, 100);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {aiLoading && (
                <div className="refine-loading-inline">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Analyzing your feedback...</span>
                </div>
              )}

              {/* Previous exchanges */}
              {messages.filter(m => m.role === 'user').length > 1 && (
                <details className="refine-history">
                  <summary className="refine-history-toggle">
                    View full conversation ({messages.length} messages)
                  </summary>
                  <div className="refine-history-list">
                    {messages.slice(0, -1).map((msg, i) => (
                      <div key={i} className={`refine-history-item ${msg.role === 'assistant' ? 'is-ai' : ''}`}>
                        <span className="refine-history-role">{msg.role === 'assistant' ? 'AI' : 'You'}</span>
                        <p>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Follow-up input OR Generate button */}
              {!aiLoading && !showGenerate && (
                <div className="refine-reply">
                  <input
                    ref={followupRef}
                    className="input"
                    type="text"
                    placeholder="Answer the AI's questions..."
                    value={followupInput}
                    onChange={(e) => setFollowupInput(e.target.value)}
                    onKeyDown={handleFollowupKeyDown}
                  />
                  <div className="refine-reply-actions">
                    <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                      <RotateCcw size={12} />
                      Reset
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleFollowup}
                      disabled={!followupInput.trim()}
                    >
                      <Send size={12} />
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {showGenerate && !generating && (
                <div className="refine-ready">
                  <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
                    <Sparkles size={13} />
                    Generate Post
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                    Start Over
                  </button>
                </div>
              )}

              {generating && (
                <div className="refine-ready">
                  <button className="btn btn-primary btn-sm" disabled>
                    <Loader2 size={13} className="animate-spin" />
                    Generating...
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview & Publish */}
          {preview && similarPosts.length > 0 && !similarDismissed && (
            <div className="duplicate-recommendation">
              <div className="duplicate-recommendation-header">
                <div className="duplicate-recommendation-icon">
                  <Sparkles size={16} />
                </div>
                <div className="duplicate-recommendation-text">
                  <div className="duplicate-recommendation-title">
                    This feedback already exists!
                  </div>
                  <div className="duplicate-recommendation-subtitle">
                    I found {similarPosts.length === 1 ? 'a post' : 'posts'} that {similarPosts.length === 1 ? 'describes' : 'describe'} the same thing.
                    Adding your voice as a comment helps developers see demand without creating duplicates.
                  </div>
                </div>
                <button className="duplicate-recommendation-dismiss" onClick={() => setSimilarDismissed(true)}>
                  <X size={14} />
                </button>
              </div>
              <div className="duplicate-recommendation-list">
                {similarPosts.slice(0, 3).map((p) => (
                  <div key={p.id} className="duplicate-recommendation-item">
                    <div className="duplicate-recommendation-item-info">
                      <div className="duplicate-recommendation-item-title">{p.title}</div>
                      <div className="duplicate-recommendation-item-meta">
                        <span className={`badge badge-${p.category}`}>{p.category}</span>
                        {p.status && <span className={`badge badge-${p.status}`}>{p.status}</span>}
                        <span className="duplicate-recommendation-item-votes">{p.votes_count || 0} votes</span>
                      </div>
                    </div>
                    <div className="duplicate-recommendation-item-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/post/${p.id}`)}>
                        <Eye size={12} />
                        View
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToExisting(p.id)}
                        disabled={publishing}
                      >
                        <MessageCircle size={12} />
                        Add as Comment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="publish-card-header">
                <div className="publish-card-tag">
                  <Sparkles size={12} />
                  AI-Generated Post
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div className="filter-group">
                    <button
                      className={`filter-btn ${previewMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('preview')}
                    >
                      <Eye size={11} style={{ marginRight: '4px' }} />
                      Preview
                    </button>
                    <button
                      className={`filter-btn ${previewMode === 'edit' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('edit')}
                    >
                      <Edit3 size={11} style={{ marginRight: '4px' }} />
                      Edit
                    </button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setPreview(null); setShowGenerate(true); }}>
                    <RotateCcw size={12} />
                    Back
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
                    <span className="badge badge-platform">{preview.platform === 'all' ? 'All Platforms' : preview.platform}</span>
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
                            {pri.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="publish-meta-item">
                      <label className="publish-meta-label">Platform</label>
                      <div className="segmented-picker">
                        {PLATFORMS.map((plat) => (
                          <button
                            key={plat.value}
                            className={`segmented-option ${preview.platform === plat.value ? 'selected' : ''}`}
                            onClick={() => setPreview({ ...preview, platform: plat.value })}
                          >
                            {plat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="publish-actions">
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                  Start Over
                </button>
                <button
                  className={`btn btn-sm ${similarPosts.length > 0 && !similarDismissed ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Publishing...
                    </>
                  ) : similarPosts.length > 0 && !similarDismissed ? (
                    <>
                      <Check size={14} />
                      Publish Anyway
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Similar posts inline (during step 1) */}
          {!preview && !aiActive && similarPosts.length > 0 && !similarDismissed && (
            <div className="similar-inline">
              <div className="similar-inline-header">
                <AlertTriangle size={14} className="similar-inline-icon" />
                <span>
                  <strong>{similarPosts.length} similar {similarPosts.length === 1 ? 'post' : 'posts'}</strong> already exist
                </span>
                <button className="similar-inline-dismiss" onClick={() => setSimilarDismissed(true)}>
                  <X size={14} />
                </button>
              </div>
              <div className="similar-inline-list">
                {similarPosts.map((p) => (
                  <div key={p.id} className="similar-inline-item">
                    <div className="similar-inline-item-info">
                      <div className="similar-inline-item-title">{p.title}</div>
                      <div className="similar-inline-item-meta">
                        <span className={`badge badge-${p.category}`}>{p.category}</span>
                        <span className="similar-inline-item-votes">{p.votes_count || 0} votes</span>
                      </div>
                    </div>
                    <div className="similar-inline-item-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/post/${p.id}`)}>View</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddToExisting(p.id)} disabled={publishing}>
                        <MessageCircle size={12} /> +1 this
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar posts banner during AI refine */}
          {aiActive && !preview && similarPosts.length > 0 && !similarDismissed && (
            <div className="similar-inline">
              <div className="similar-inline-header">
                <AlertTriangle size={14} className="similar-inline-icon" />
                <span><strong>{similarPosts.length} similar</strong> — consider adding to existing</span>
                <button className="similar-inline-dismiss" onClick={() => setSimilarDismissed(true)}><X size={14} /></button>
              </div>
              <div className="similar-inline-list">
                {similarPosts.map((p) => (
                  <div key={p.id} className="similar-inline-item">
                    <div className="similar-inline-item-info">
                      <div className="similar-inline-item-title">{p.title}</div>
                    </div>
                    <div className="similar-inline-item-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/post/${p.id}`)}>View</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddToExisting(p.id)} disabled={publishing}>
                        <MessageCircle size={12} /> +1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="error-card">
              <div className="error-card-icon"><AlertCircle size={14} /></div>
              <div className="error-card-content">
                <div className="error-card-text">{error}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>
                  <X size={12} /> Dismiss
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
