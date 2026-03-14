import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Check, RotateCcw, Eye, MessageSquare, X, AlertTriangle, MessageCircle, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { generatePost, searchSimilar } from '../lib/api';
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

export default function Submit() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [input, setInput] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState('');

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

  // Debounced similar post check
  useEffect(() => {
    if (input.length < 20) { setSimilarPosts([]); return; }
    const timer = setTimeout(() => {
      searchSimilar(input).then(r => {
        setSimilarPosts(r.similar?.length > 0 ? r.similar : []);
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [input]);

  const charCount = input.length;
  const isReady = charCount >= 30;

  const handleGenerate = async () => {
    if (!input.trim() || input.length < 20) return;
    if (!isLoggedIn) { setShowAuth(true); return; }

    setError('');
    setGenerating(true);

    const history = [
      { role: 'user', content: input.trim() },
      { role: 'assistant', content: `User submitted feedback: "${input.trim()}"` },
    ];

    try {
      const postData = await generatePost(history);
      setPreview(postData);
      setPreviewMode('preview');

      // Re-check similar with structured content
      try {
        const r = await searchSimilar(`${postData.title} ${postData.body}`);
        if (r.similar?.length > 0) {
          setSimilarPosts(r.similar);
          setSimilarDismissed(false);
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
        ai_transcript: [{ role: 'user', content: input }],
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
      await pb.collection('comments').create({ post: postId, body: input });
      navigate(`/post/${postId}`);
    } catch (err) {
      console.error('Merge error:', err);
      setError('Failed to add comment. Please try again.');
      setPublishing(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSimilarPosts([]);
    setSimilarDismissed(false);
    setError('');
    setPreviewMode('preview');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isReady && !generating) {
      e.preventDefault();
      handleGenerate();
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
              Describe what's on your mind. AI will structure it into a clear, actionable post.
            </p>
          </div>

          {/* COMPOSE */}
          {!preview ? (
            <div className="card" style={{ overflow: 'hidden' }}>
              <textarea
                ref={textareaRef}
                className="compose-textarea"
                placeholder="What would you like to share? Describe a bug, suggest a feature, or tell us how something could be better..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
                disabled={generating}
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
                      AI will categorize and structure your feedback
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleGenerate}
                  disabled={!isReady || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Generate Post
                    </>
                  )}
                </button>
              </div>

              {generating && (
                <div className="compose-progress-bar">
                  <div className="compose-progress-fill" />
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW & PUBLISH */
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
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>
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
                  </div>
                </div>
              )}

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
                  className="btn btn-primary btn-sm"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Publish Post
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Similar posts while typing */}
          {!preview && similarPosts.length > 0 && !similarDismissed && (
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
                        <span className="similar-inline-item-votes">▲ {p.votes_count || 0}</span>
                      </div>
                    </div>
                    <div className="similar-inline-item-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/post/${p.id}`)}>
                        View
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToExisting(p.id)}
                        disabled={publishing}
                      >
                        <MessageCircle size={12} />
                        +1 this
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!preview && isReady && !generating && (
            <div className="compose-shortcut-hint">
              <kbd>⌘</kbd> + <kbd>Enter</kbd> to generate
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
