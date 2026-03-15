import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, MessageCircle, Inbox, Map } from 'lucide-react';
import pb from '../lib/pocketbase';
import VoteButton from '../components/VoteButton';

const ROADMAP_COLUMNS = [
  {
    id: 'planned',
    label: 'Planned',
    statuses: ['in_review', 'later'],
    description: 'Accepted and on the roadmap',
    accent: '#a78bfa',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    statuses: ['processing'],
    description: 'Actively being worked on',
    accent: '#60a5fa',
  },
  {
    id: 'complete',
    label: 'Complete',
    statuses: ['done', 'released'],
    description: 'Shipped and available',
    accent: '#4ade80',
  },
];

export default function Roadmap() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchRoadmapPosts();
  }, []);

  const fetchRoadmapPosts = async () => {
    setLoading(true);
    try {
      // Fetch all posts that belong on the roadmap (exclude "new" and "dropped")
      const result = await pb.collection('posts').getList(1, 200, {
        filter: 'status = "in_review" || status = "later" || status = "processing" || status = "done" || status = "released"',
        sort: '-votes_count',
        expand: 'author',
      });
      setPosts(result.items);
    } catch (err) {
      console.error('Failed to fetch roadmap posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColumnPosts = (column) => {
    return posts.filter((p) => {
      const matchesStatus = column.statuses.includes(p.status);
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  };

  const totalRoadmapPosts = posts.length;
  const categories = ['all', 'bug', 'feature', 'improvement'];

  if (loading) {
    return (
      <div className="page">
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Roadmap</h1>
          <p className="page-subtitle">
            See what we're working on, what's planned, and what's been shipped.
          </p>
        </div>

        {/* Filter + Stats */}
        <div className="roadmap-toolbar">
          <div className="roadmap-filter-group">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <span className="roadmap-total">
            {totalRoadmapPosts} {totalRoadmapPosts === 1 ? 'item' : 'items'} on the roadmap
          </span>
        </div>

        {/* Roadmap columns */}
        {totalRoadmapPosts === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Map size={40} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">Roadmap is empty</h3>
            <p className="empty-state-text">
              No feedback items have been reviewed yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="roadmap-board">
            {ROADMAP_COLUMNS.map((column) => {
              const columnPosts = getColumnPosts(column);
              return (
                <div key={column.id} className="roadmap-column">
                  <div className="roadmap-column-header">
                    <div className="roadmap-column-header-top">
                      <span
                        className="roadmap-column-dot"
                        style={{ background: column.accent }}
                      />
                      <span className="roadmap-column-title">{column.label}</span>
                      <span className="roadmap-column-count">{columnPosts.length}</span>
                    </div>
                    <span className="roadmap-column-desc">{column.description}</span>
                  </div>

                  <div className="roadmap-column-cards">
                    {columnPosts.length === 0 ? (
                      <div className="roadmap-empty-col">
                        <Inbox size={16} strokeWidth={1.5} />
                        <span>Nothing here yet</span>
                      </div>
                    ) : (
                      columnPosts.map((post) => (
                        <div
                          key={post.id}
                          className="roadmap-card"
                          onClick={() => navigate(`/post/${post.id}`)}
                        >
                          <div className="roadmap-card-content">
                            <div className="roadmap-card-title">{post.title}</div>
                            <div className="roadmap-card-meta">
                              <span className={`badge badge-${post.category}`}>
                                {post.category}
                              </span>
                              {post.platform && post.platform !== 'all' && (
                                <span className="badge badge-platform">
                                  {post.platform}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="roadmap-card-stats">
                            <div className="roadmap-card-votes">
                              <ChevronUp size={14} />
                              <span>{post.votes_count || 0}</span>
                            </div>
                            {post.comments_count > 0 && (
                              <div className="roadmap-card-comments">
                                <MessageCircle size={12} />
                                <span>{post.comments_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
