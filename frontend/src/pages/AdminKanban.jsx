import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Shield, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';

const COLUMNS = [
  { id: 'new', label: 'New', color: 'var(--color-new)' },
  { id: 'in_review', label: 'In Review', color: 'var(--color-in-review)' },
  { id: 'processing', label: 'Processing', color: 'var(--color-processing)' },
  { id: 'done', label: 'Done', color: 'var(--color-done)' },
  { id: 'dropped', label: 'Dropped', color: 'var(--color-dropped)' },
  { id: 'later', label: 'Later', color: 'var(--color-later)' },
];

export default function AdminKanban() {
  const { isAdmin, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;
    fetchAllPosts();
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

  const getColumnPosts = (status) => {
    return posts.filter((p) => p.status === status);
  };

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

  // Not admin — redirect
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Shield size={48} />
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
      <div style={{ padding: '0 var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Drag and drop cards to update status. {posts.length} total posts.</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchAllPosts}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((column) => {
              const columnPosts = getColumnPosts(column.id);
              return (
                <div key={column.id} className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title" style={{ color: column.color }}>
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
                                  <span className={`badge badge-${post.category}`} style={{ fontSize: '0.625rem' }}>
                                    {post.category}
                                  </span>
                                  <span className={`badge badge-priority-${post.priority}`} style={{ fontSize: '0.625rem' }}>
                                    {post.priority}
                                  </span>
                                  <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                                    ▲ {post.votes_count || 0}
                                  </span>
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
      </div>
    </div>
  );
}
