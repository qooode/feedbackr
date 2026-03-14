import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import pb from '../lib/pocketbase';
import VoteButton from '../components/VoteButton';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';

export default function PostDetail() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const record = await pb.collection('posts').getOne(id, {
        expand: 'author',
      });
      setPost(record);
    } catch (err) {
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const result = await pb.collection('comments').getList(1, 100, {
        filter: `post = '${id.replace(/[^a-z0-9]/gi, '')}'`,
        expand: 'author',
      });
      setComments(result.items);
    } catch {
      // Comments collection might not exist yet
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim() || submitting) return;

    setSubmitting(true);
    try {
      await pb.collection('comments').create({
        post: id,
        body: commentBody.trim(),
      });
      setCommentBody('');
      fetchComments();
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Post not found</h3>
            <Link to="/" className="btn btn-primary">Back to Board</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="post-detail">
          <Link
            to="/"
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 'var(--space-8)' }}
          >
            <ArrowLeft size={14} />
            Back to Board
          </Link>

          <div className="post-detail-header">
            <h1 className="post-detail-title">{post.title}</h1>

            <div className="post-detail-badges">
              <span className={`badge badge-${post.category}`}>{post.category}</span>
              <span className={`badge badge-${post.status}`}>{post.status?.replace('_', ' ')}</span>
              <span className={`badge badge-priority-${post.priority}`}>{post.priority}</span>
              {post.platform && (
                <span className="badge badge-platform">
                  {post.platform === 'all' ? 'All Platforms' : post.platform}
                </span>
              )}
            </div>

            <div className="post-detail-author">
              <UserAvatar user={post.expand?.author} size="22px" />
              <span>{post.expand?.author?.name || post.expand?.author?.email || 'Anonymous'}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {timeAgo(post.created)}
              </span>
            </div>
          </div>

          <div className="card post-detail-vote-bar">
            <VoteButton post={post} />
            <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-sm)' }}>
              {post.votes_count || 0} {(post.votes_count === 1) ? 'vote' : 'votes'}
            </span>
          </div>

          <div className="post-detail-body"><ReactMarkdown>{post.body}</ReactMarkdown></div>

          {/* Comments */}
          <div className="comments-section">
            <h2 className="comments-title">
              Comments ({comments.length})
            </h2>

            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <UserAvatar user={comment.expand?.author} size="22px" />
                  <span className="comment-author">
                    {comment.expand?.author?.name || comment.expand?.author?.email || 'Anonymous'}
                  </span>
                  {comment.is_ai_merged && (
                    <span className="comment-ai-badge">AI Merged</span>
                  )}
                  <span className="comment-date">{timeAgo(comment.created)}</span>
                </div>
                <div className="comment-body">{comment.body}</div>
              </div>
            ))}

            {comments.length === 0 && (
              <p style={{
                color: 'var(--muted-foreground)',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-6) 0',
              }}>
                No comments yet. Be the first to share your thoughts.
              </p>
            )}

            {isLoggedIn ? (
              <form className="comment-form" onSubmit={handleComment}>
                <input
                  className="input"
                  type="text"
                  placeholder="Add a comment..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!commentBody.trim() || submitting}
                >
                  <Send size={13} />
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </form>
            ) : (
              <p style={{
                color: 'var(--muted-foreground)',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-6) 0',
                textAlign: 'center',
              }}>
                Sign in to leave a comment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
