import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Shield, RefreshCw, Megaphone, X, Check, Tag, Send, ChevronDown, ChevronUp, Trash2, Eye, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';
import UserAvatar from '../components/UserAvatar';
import pb from '../lib/pocketbase';

const COLUMNS = [
  { id: 'new', label: 'New' },
  { id: 'in_review', label: 'In Review' },
  { id: 'processing', label: 'Processing' },
  { id: 'done', label: 'Done' },
  { id: 'dropped', label: 'Dropped' },
  { id: 'later', label: 'Later' },
];

export default function AdminKanban() {
  const { user, isAdmin, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Changelog composer state
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [changelogVersion, setChangelogVersion] = useState('');
  const [changelogTitle, setChangelogTitle] = useState('');
  const [changelogBody, setChangelogBody] = useState('');
  const [changelogImage, setChangelogImage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Past changelogs
  const [changelogs, setChangelogs] = useState([]);
  const [showChangelogs, setShowChangelogs] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;
    fetchAllPosts();
    fetchChangelogs();
  }, [isLoggedIn, isAdmin]);

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('posts').getList(1, 200, {
        sort: '-created',
        expand: 'author',
      });
      setPosts(result.items);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangelogs = async () => {
    try {
      const result = await pb.collection('changelogs').getList(1, 50, {
        sort: '-created',
        expand: 'posts',
      });
      setChangelogs(result.items);
    } catch (err) {
      // Collection might not exist yet
      console.error('Failed to fetch changelogs:', err);
    }
  };

  const getColumnPosts = (status) => {
    return posts.filter((p) => p.status === status);
  };

  const donePosts = getColumnPosts('done');

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    const postId = draggableId;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    // Persist to PocketBase
    try {
      await pb.collection('posts').update(postId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchAllPosts(); // Revert on error
    }
  };

  const togglePostSelection = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const selectAllDone = () => {
    const doneIds = donePosts.map((p) => p.id);
    setSelectedPosts(doneIds);
  };

  const deselectAll = () => {
    setSelectedPosts([]);
  };

  const openComposer = () => {
    setShowComposer(true);
    // Auto-select all done posts
    selectAllDone();
  };

  const publishChangelog = async () => {
    if (!changelogVersion.trim() || !changelogTitle.trim() || selectedPosts.length === 0) return;

    setPublishing(true);
    try {
      // 1. Create the changelog
      await pb.collection('changelogs').create({
        version: changelogVersion.trim(),
        title: changelogTitle.trim(),
        body: changelogBody.trim(),
        image_url: changelogImage.trim(),
        posts: selectedPosts,
        author: user.id,
        published: true,
      });

      // 2. Move all selected posts to "released" status
      await Promise.all(
        selectedPosts.map((postId) =>
          pb.collection('posts').update(postId, { status: 'released' })
        )
      );

      // 3. Reset state
      setShowComposer(false);
      setSelectedPosts([]);
      setChangelogVersion('');
      setChangelogTitle('');
      setChangelogBody('');
      setChangelogImage('');
      setPreviewMode(false);

      // 4. Refresh
      fetchAllPosts();
      fetchChangelogs();
    } catch (err) {
      console.error('Failed to publish changelog:', err);
    } finally {
      setPublishing(false);
    }
  };

  const deleteChangelog = async (id) => {
    if (!confirm('Delete this changelog? The linked posts will remain in "released" status.')) return;
    try {
      await pb.collection('changelogs').delete(id);
      fetchChangelogs();
    } catch (err) {
      console.error('Failed to delete changelog:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Not admin
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Shield size={40} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">Admin Access Required</h3>
            <p className="empty-state-text">
              This page is only accessible to administrators.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Go to Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ padding: '0 var(--space-6)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-8)',
        }}>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Drag and drop cards to update status. {posts.length} total posts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {donePosts.length > 0 && (
              <button className="btn btn-primary" onClick={openComposer}>
                <Megaphone size={13} />
                Publish Update ({donePosts.length})
              </button>
            )}
            <button className="btn btn-secondary" onClick={fetchAllPosts}>
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* Changelog Composer Modal */}
        {showComposer && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowComposer(false)}>
            <div className="changelog-composer">
              <div className="changelog-composer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Megaphone size={16} />
                  <span>Publish Changelog Update</span>
                </div>
                <button
                  className="btn btn-ghost btn-icon-sm"
                  onClick={() => setShowComposer(false)}
                  style={{ border: 'none' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="changelog-composer-body">
                {/* Version & Title */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>
                    <label className="changelog-label">Version</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="v1.2.0"
                      value={changelogVersion}
                      onChange={(e) => setChangelogVersion(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="changelog-label">Title</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="What's new in this update..."
                      value={changelogTitle}
                      onChange={(e) => setChangelogTitle(e.target.value)}
                    />
                  </div>
                </div>

                {/* Body */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <label className="changelog-label" style={{ marginBottom: 0 }}>Description</label>
                    <div className="publish-view-toggle" style={{ transform: 'scale(0.9)' }}>
                      <button
                        className={`publish-view-toggle-btn ${!previewMode ? 'active' : ''}`}
                        onClick={() => setPreviewMode(false)}
                      >
                        Edit
                      </button>
                      <button
                        className={`publish-view-toggle-btn ${previewMode ? 'active' : ''}`}
                        onClick={() => setPreviewMode(true)}
                      >
                        <Eye size={11} /> Preview
                      </button>
                    </div>
                  </div>
                  {previewMode ? (
                    <div className="changelog-preview-rendered">
                      {changelogBody.trim() ? (
                        <ReactMarkdown>{changelogBody}</ReactMarkdown>
                      ) : (
                        <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontSize: 'var(--font-size-sm)' }}>
                          Nothing to preview — write something above.
                        </p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      className="input"
                      placeholder="Describe the update in detail... (supports Markdown)"
                      value={changelogBody}
                      onChange={(e) => setChangelogBody(e.target.value)}
                      rows={5}
                      style={{ minHeight: '120px', resize: 'vertical' }}
                    />
                  )}
                </div>

                {/* Image URL */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="changelog-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ImageIcon size={11} /> Cover Image (optional)
                    </span>
                  </label>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://example.com/screenshot.png"
                    value={changelogImage}
                    onChange={(e) => setChangelogImage(e.target.value)}
                  />
                  {changelogImage.trim() && (
                    <div className="changelog-image-preview">
                      <img
                        src={changelogImage.trim()}
                        alt="Preview"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        onLoad={(e) => { e.target.style.display = 'block'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Post selection */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <label className="changelog-label" style={{ marginBottom: 0 }}>
                      Include Items ({selectedPosts.length} selected)
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={selectAllDone} style={{ fontSize: '11px' }}>
                        Select all
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={deselectAll} style={{ fontSize: '11px' }}>
                        Deselect all
                      </button>
                    </div>
                  </div>

                  <div className="changelog-post-list">
                    {donePosts.length === 0 ? (
                      <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        No items in "Done" column. Move items to Done first.
                      </p>
                    ) : (
                      donePosts.map((post) => (
                        <label key={post.id} className={`changelog-post-item ${selectedPosts.includes(post.id) ? 'selected' : ''}`}>
                          <div className="changelog-post-check">
                            <input
                              type="checkbox"
                              checked={selectedPosts.includes(post.id)}
                              onChange={() => togglePostSelection(post.id)}
                              style={{ display: 'none' }}
                            />
                            <div className={`changelog-checkbox ${selectedPosts.includes(post.id) ? 'checked' : ''}`}>
                              {selectedPosts.includes(post.id) && <Check size={10} />}
                            </div>
                          </div>
                          <div className="changelog-post-info">
                            <span className="changelog-post-title">{post.title}</span>
                            <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: '2px' }}>
                              <span className={`badge badge-${post.category}`} style={{ fontSize: '10px' }}>
                                {post.category}
                              </span>
                              <span className={`badge badge-priority-${post.priority}`} style={{ fontSize: '10px' }}>
                                {post.priority}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                                ▲ {post.votes_count || 0}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="changelog-composer-footer">
                <button className="btn btn-ghost" onClick={() => setShowComposer(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={publishChangelog}
                  disabled={!changelogVersion.trim() || !changelogTitle.trim() || selectedPosts.length === 0 || publishing}
                >
                  <Send size={13} />
                  {publishing ? 'Publishing...' : `Publish Update (${selectedPosts.length} items)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((column) => {
              const columnPosts = getColumnPosts(column.id);
              return (
                <div key={column.id} className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title">
                      {column.label}
                    </span>
                    <span className="kanban-column-count">{columnPosts.length}</span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-column-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      >
                        {columnPosts.map((post, index) => (
                          <Draggable key={post.id} draggableId={post.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                onClick={() => navigate(`/post/${post.id}`)}
                              >
                                <div className="kanban-card-title">{post.title}</div>
                                <div className="kanban-card-meta">
                                  <span className={`badge badge-${post.category}`} style={{ fontSize: '10px' }}>
                                    {post.category}
                                  </span>
                                  <span className={`badge badge-priority-${post.priority}`} style={{ fontSize: '10px' }}>
                                    {post.priority}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                                    ▲ {post.votes_count || 0}
                                  </span>
                                  {post.expand?.author && (
                                    <span style={{ marginLeft: 'auto' }}>
                                      <UserAvatar user={post.expand.author} size="18px" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {/* Past Changelogs Section */}
        <div style={{ marginTop: 'var(--space-8)' }}>
          <button
            className="changelog-history-toggle"
            onClick={() => setShowChangelogs(!showChangelogs)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Tag size={14} />
              <span>Published Changelogs ({changelogs.length})</span>
            </div>
            {showChangelogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showChangelogs && (
            <div className="changelog-history-list">
              {changelogs.length === 0 ? (
                <p style={{
                  color: 'var(--muted-foreground)',
                  fontSize: 'var(--font-size-sm)',
                  padding: 'var(--space-6)',
                  textAlign: 'center',
                }}>
                  No changelogs published yet.
                </p>
              ) : (
                changelogs.map((log) => (
                  <div key={log.id} className="changelog-history-item">
                    <div className="changelog-history-item-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="changelog-version-badge">
                          <Tag size={10} />
                          {log.version}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--foreground)' }}>
                          {log.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
                          {formatDate(log.created)}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
                          · {log.expand?.posts?.length || 0} items
                        </span>
                        <button
                          className="btn btn-ghost btn-icon-sm"
                          onClick={() => deleteChangelog(log.id)}
                          style={{ border: 'none', color: 'var(--muted-foreground)' }}
                          title="Delete changelog"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {log.body && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--muted-foreground)',
                        padding: '0 var(--space-4)',
                        paddingBottom: 'var(--space-3)',
                        lineHeight: 1.5,
                      }}>
                        {log.body.length > 200 ? log.body.slice(0, 200) + '...' : log.body}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
