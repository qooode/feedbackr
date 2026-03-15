import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Users,
  Zap,
  ArrowRight,
  Rocket,
  Plus,
} from 'lucide-react';
import pb from '../lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function CommunitySidebar() {
  const navigate = useNavigate();
  const [contributors, setContributors] = useState([]);

  const [shipped, setShipped] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      await Promise.all([
        fetchTopContributors(),
        fetchRecentlyShipped(),
        fetchCommunityStats(),
      ]);
    } catch (err) {
      console.warn('[Sidebar] partial data load:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopContributors = async () => {
    try {
      // Get posts with authors expanded, sorted by votes to find active contributors
      const result = await pb.collection('posts').getList(1, 200, {
        sort: '-votes_count',
        expand: 'author',
        fields: 'id,votes_count,expand.author.id,expand.author.name,expand.author.username,expand.author.email,expand.author.avatar,expand.author.collectionId,expand.author.collectionName',
      });

      // Aggregate by author
      const authorMap = {};
      result.items.forEach((post) => {
        const author = post.expand?.author;
        if (!author) return;
        if (!authorMap[author.id]) {
          authorMap[author.id] = {
            user: author,
            posts: 0,
            totalVotes: 0,
          };
        }
        authorMap[author.id].posts += 1;
        authorMap[author.id].totalVotes += post.votes_count || 0;
      });

      // Sort by total votes received, then by post count
      const sorted = Object.values(authorMap)
        .sort((a, b) => b.totalVotes - a.totalVotes || b.posts - a.posts)
        .slice(0, 5);

      setContributors(sorted);
    } catch (err) {
      console.warn('[Sidebar] contributors:', err);
    }
  };



  const fetchRecentlyShipped = async () => {
    try {
      const result = await pb.collection('posts').getList(1, 3, {
        filter: 'status = "done" || status = "released"',
        sort: '-updated',
      });
      setShipped(result.items);
    } catch (err) {
      console.warn('[Sidebar] shipped:', err);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      const [allPosts, shippedPosts] = await Promise.all([
        pb.collection('posts').getList(1, 1, {}),
        pb.collection('posts').getList(1, 1, {
          filter: 'status = "done" || status = "released"',
        }),
      ]);

      setStats({
        totalPosts: allPosts.totalItems,
        shipped: shippedPosts.totalItems,
      });
    } catch (err) {
      console.warn('[Sidebar] stats:', err);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  if (loading) {
    return (
      <aside className="community-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-loading">
            <div className="spinner" style={{ width: 16, height: 16 }} />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="community-sidebar">
      {/* Submit CTA */}
      <Link to="/submit" className="sidebar-cta">
        <div className="sidebar-cta-content">
          <Plus size={15} />
          <span>Submit Feedback</span>
        </div>
      </Link>

      {/* Top Contributors */}
      {contributors.length > 0 && (
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">
            <Users size={14} />
            <span>Top Contributors</span>
          </div>
          <div className="sidebar-widget-body">
            {contributors.map((entry, index) => (
              <div key={entry.user.id} className="sidebar-contributor">
                <span className="sidebar-contributor-rank">{index + 1}</span>
                <UserAvatar user={entry.user} size="24px" />
                <div className="sidebar-contributor-info">
                  <span className="sidebar-contributor-name">
                    {entry.user.name || entry.user.username || 'Anonymous'}
                  </span>
                  <span className="sidebar-contributor-stats">
                    {entry.totalVotes} {entry.totalVotes === 1 ? 'vote' : 'votes'} · {entry.posts} {entry.posts === 1 ? 'post' : 'posts'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Recently Shipped */}
      {shipped.length > 0 && (
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">
            <Rocket size={14} />
            <span>Recently Shipped</span>
          </div>
          <div className="sidebar-widget-body">
            {shipped.map((post) => (
              <div
                key={post.id}
                className="sidebar-shipped-item"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <CheckCircle2 size={14} className="sidebar-shipped-icon" />
                <div className="sidebar-shipped-content">
                  <span className="sidebar-shipped-title">{post.title}</span>
                  <span className="sidebar-shipped-time">{timeAgo(post.updated)}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/roadmap" className="sidebar-widget-footer-link">
            View Roadmap
            <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Community Stats */}
      {stats && (
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">
            <Zap size={14} />
            <span>Community</span>
          </div>
          <div className="sidebar-stats-grid">
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">{stats.totalPosts}</span>
              <span className="sidebar-stat-label">Submissions</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">{stats.shipped}</span>
              <span className="sidebar-stat-label">Shipped</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">{contributors.length}</span>
              <span className="sidebar-stat-label">Contributors</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">{shipped.length}</span>
              <span className="sidebar-stat-label">Released</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
