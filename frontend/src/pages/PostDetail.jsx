import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Send, Pencil, Trash2, X, Check, Reply, CornerDownRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import pb from '../lib/pocketbase';
import VoteButton from '../components/VoteButton';
import UserAvatar from '../components/UserAvatar';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../hooks/useAuth';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null); // comment id being replied to
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const replyInputRef = useRef(null);

  // Edit post state
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [savingPost, setSavingPost] = useState(false);

  // Delete post state
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Delete comment state
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  // Focus reply input when replyingTo changes
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

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
      const result = await pb.collection('comments').getList(1, 200, {
        filter: `post = '${id.replace(/[^a-z0-9]/gi, '')}'`,
        expand: 'author',
        sort: 'created',
      });
      setComments(result.items);
    } catch {
      // Comments collection might not exist yet
    }
  };

  // Organize comments into threads
  const organizeComments = () => {
    const topLevel = [];
    const repliesByParent = {};

    for (const comment of comments) {
      const parentId = comment.parent;
      if (parentId) {
        if (!repliesByParent[parentId]) repliesByParent[parentId] = [];
        repliesByParent[parentId].push(comment);
      } else {
        topLevel.push(comment);
      }
    }

    return { topLevel, repliesByParent };
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

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || submittingReply || !replyingTo) return;

    setSubmittingReply(true);
    try {
      await pb.collection('comments').create({
        post: id,
        body: replyBody.trim(),
        parent: replyingTo,
      });
      setReplyBody('');
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyBody('');
    // Cancel any edit in progress
    setEditingCommentId(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyBody('');
  };

  // --- Post edit/delete ---

  const startEditPost = () => {
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditingPost(true);
  };

  const cancelEditPost = () => {
    setEditingPost(false);
    setEditTitle('');
    setEditBody('');
  };

  const saveEditPost = async () => {
    if (!editTitle.trim() || !editBody.trim() || savingPost) return;
    setSavingPost(true);
    try {
      await pb.collection('posts').update(id, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setEditingPost(false);
      fetchPost();
    } catch (err) {
      console.error('Edit post error:', err);
      alert(err?.response?.message || 'Failed to update post.');
    } finally {
      setSavingPost(false);
    }
  };

  const deletePost = async () => {
    if (deletingPost) return;
    setDeletingPost(true);
    try {
      await pb.collection('posts').delete(id);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Delete post error:', err);
      alert(err?.response?.message || 'Failed to delete post.');
      setDeletingPost(false);
      setConfirmDeletePost(false);
    }
  };

  // --- Comment edit/delete ---

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentBody(comment.body);
    // Cancel any reply in progress
    setReplyingTo(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentBody('');
  };

  const saveEditComment = async () => {
    if (!editCommentBody.trim() || savingComment) return;
    setSavingComment(true);
    try {
      await pb.collection('comments').update(editingCommentId, {
        body: editCommentBody.trim(),
      });
      setEditingCommentId(null);
      fetchComments();
    } catch (err) {
      console.error('Edit comment error:', err);
      alert(err?.response?.message || 'Failed to update comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (deletingComment) return;
    setDeletingComment(true);
    try {
      await pb.collection('comments').delete(commentId);
      setConfirmDeleteCommentId(null);
      fetchComments();
    } catch (err) {
      console.error('Delete comment error:', err);
      alert(err?.response?.message || 'Failed to delete comment.');
    } finally {
      setDeletingComment(false);
    }
  };

  const isPostOwner = user && post?.author === user.id;
  const canEditPost = isPostOwner || isAdmin;

  const isCommentOwner = (comment) => user && comment.author === user.id;
  const canEditComment = (comment) => isCommentOwner(comment) || isAdmin;

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

  // Total count of all comments (top-level + replies)
  const totalComments = comments.length;

  // Render a single comment (used for both top-level and replies)
  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        {isReply && (
          <CornerDownRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        )}
        <UserAvatar user={comment.expand?.author} size="22px" />
        <span className="comment-author">
          {comment.expand?.author?.name || comment.expand?.author?.username || 'Anonymous'}
        </span>
        {comment.is_ai_merged && (
          <span className="comment-ai-badge">AI Merged</span>
        )}
        <span className="comment-date">{timeAgo(comment.created)}</span>
        {comment.updated !== comment.created && (
          <span className="comment-edited-label">edited</span>
        )}

        {canEditComment(comment) && editingCommentId !== comment.id && (
          <div className="comment-actions">
            <button
              className="comment-action-btn"
              onClick={() => startEditComment(comment)}
              title="Edit"
            >
              <Pencil size={12} />
            </button>
            {confirmDeleteCommentId !== comment.id ? (
              <button
                className="comment-action-btn"
                onClick={() => setConfirmDeleteCommentId(comment.id)}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            ) : (
              <div className="confirm-delete-inline">
                <button
                  className="btn btn-destructive btn-sm"
                  onClick={() => deleteComment(comment.id)}
                  disabled={deletingComment}
                  style={{ padding: '2px 8px', height: '24px', fontSize: '11px' }}
                >
                  {deletingComment ? '...' : 'Delete'}
                </button>
                <button
                  className="comment-action-btn"
                  onClick={() => setConfirmDeleteCommentId(null)}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingCommentId === comment.id ? (
        <div className="comment-edit-form">
          <input
            className="input"
            value={editCommentBody}
            onChange={(e) => setEditCommentBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEditComment();
              }
              if (e.key === 'Escape') cancelEditComment();
            }}
            autoFocus
          />
          <div className="comment-edit-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={saveEditComment}
              disabled={savingComment || !editCommentBody.trim()}
              style={{ height: '28px', fontSize: '12px' }}
            >
              <Check size={12} />
              {savingComment ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={cancelEditComment}
              style={{ height: '28px', fontSize: '12px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={`comment-body ${isReply ? 'comment-body-reply' : ''}`}>
            {comment.body}
          </div>
          {/* Reply button — only on top-level comments (1 level max) */}
          {!isReply && isLoggedIn && editingCommentId !== comment.id && (
            <div className={`comment-body ${isReply ? 'comment-body-reply' : ''}`} style={{ paddingTop: 0 }}>
              <button
                className="comment-reply-btn"
                onClick={() => startReply(comment.id)}
              >
                <Reply size={12} />
                Reply
              </button>
            </div>
          )}
        </>
      )}

      {/* Inline reply input */}
      {!isReply && replyingTo === comment.id && (
        <div className="comment-reply-form">
          <CornerDownRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '10px' }} />
          <form onSubmit={handleReply} style={{ flex: 1, display: 'flex', gap: 'var(--space-2)' }}>
            <input
              ref={replyInputRef}
              className="input"
              type="text"
              placeholder={`Reply to ${comment.expand?.author?.name || comment.expand?.author?.username || 'this comment'}...`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelReply();
              }}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              disabled={!replyBody.trim() || submittingReply}
            >
              <Send size={12} />
              {submittingReply ? '...' : 'Reply'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={cancelReply}
            >
              <X size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );

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

  const { topLevel, repliesByParent } = organizeComments();

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
            {editingPost ? (
              <>
                <input
                  className="input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Post title..."
                  style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}
                />
                <textarea
                  className="input"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Post body..."
                  rows={10}
                  style={{ minHeight: '200px', fontFamily: 'var(--font-family)', lineHeight: 1.6 }}
                />
                <div className="post-edit-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveEditPost}
                    disabled={savingPost || !editTitle.trim() || !editBody.trim()}
                  >
                    <Check size={13} />
                    {savingPost ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={cancelEditPost}>
                    <X size={13} />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="post-detail-title-row">
                  <h1 className="post-detail-title">{post.title}</h1>
                  {canEditPost && (
                    <div className="post-owner-actions">
                      <button
                        className="btn btn-ghost btn-icon-sm"
                        onClick={startEditPost}
                        title="Edit post"
                      >
                        <Pencil size={14} />
                      </button>
                      {!confirmDeletePost ? (
                        <button
                          className="btn btn-ghost btn-icon-sm"
                          onClick={() => setConfirmDeletePost(true)}
                          title="Delete post"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <div className="confirm-delete-inline">
                          <span>Delete?</span>
                          <button
                            className="btn btn-destructive btn-sm"
                            onClick={deletePost}
                            disabled={deletingPost}
                          >
                            {deletingPost ? 'Deleting...' : 'Yes'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setConfirmDeletePost(false)}
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                  <span>{post.expand?.author?.name || post.expand?.author?.username || 'Anonymous'}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {timeAgo(post.created)}
                  </span>
                  {post.updated !== post.created && (
                    <>
                      <span style={{ color: 'var(--muted-foreground)' }}>·</span>
                      <span className="post-edited-label">edited</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {!editingPost && (
            <>
              <div className="card post-detail-vote-bar">
                <VoteButton post={post} />
                <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-sm)' }}>
                  {post.votes_count || 0} {(post.votes_count === 1) ? 'vote' : 'votes'}
                </span>
                <div style={{ marginLeft: 'auto' }}>
                  <FavoriteButton postId={post.id} />
                </div>
              </div>

              <div className="post-detail-body"><ReactMarkdown>{post.body}</ReactMarkdown></div>
            </>
          )}

          {/* Comments */}
          <div className="comments-section">
            <h2 className="comments-title">
              Comments ({totalComments})
            </h2>

            {topLevel.map((comment) => (
              <div key={comment.id} className="comment-thread">
                {renderComment(comment, false)}

                {/* Replies */}
                {repliesByParent[comment.id]?.map((reply) =>
                  renderComment(reply, true)
                )}
              </div>
            ))}

            {totalComments === 0 && (
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
