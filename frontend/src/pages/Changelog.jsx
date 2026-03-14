import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Tag, Clock, ChevronRight, Inbox } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import pb from '../lib/pocketbase';

export default function Changelog() {
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const fetchChangelogs = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('changelogs').getList(1, 50, {
        sort: '-created',
        expand: 'posts,author',
      });
      setChangelogs(result.items);
    } catch (err) {
      console.error('Failed to fetch changelogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Changelog</h1>
          <p className="page-subtitle">
            Stay up to date with all the latest updates, improvements, and fixes.
          </p>
        </div>

        {changelogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={40} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">No updates yet</h3>
            <p className="empty-state-text">
              Check back soon for the latest changes.
            </p>
          </div>
        ) : (
          <div className="changelog-timeline">
            {changelogs.map((log, index) => (
              <div key={log.id} className="changelog-entry" style={{ animationDelay: `${index * 0.08}s` }}>
                {/* Timeline dot */}
                <div className="changelog-timeline-dot">
                  <div className="changelog-dot" />
                  {index < changelogs.length - 1 && <div className="changelog-line" />}
                </div>

                {/* Content */}
                <div className="changelog-entry-content">
                  {/* Header */}
                  <div className="changelog-entry-header">
                    <span className="changelog-version-badge">
                      <Tag size={11} />
                      {log.version}
                    </span>
                    <span className="changelog-date">
                      <Clock size={11} />
                      {formatDate(log.created)}
                    </span>
                  </div>

                  <h2 className="changelog-entry-title">{log.title}</h2>

                  {/* Cover image */}
                  {log.image_url && (
                    <div className="changelog-entry-image">
                      <img src={log.image_url} alt={log.title} />
                    </div>
                  )}

                  {/* Body */}
                  {log.body && (
                    <div className="changelog-entry-body">
                      <ReactMarkdown>{log.body}</ReactMarkdown>
                    </div>
                  )}

                  {/* Linked posts */}
                  {log.expand?.posts && log.expand.posts.length > 0 && (
                    <div className="changelog-items">
                      <div className="changelog-items-header">
                        <Megaphone size={12} />
                        Included in this update
                      </div>
                      {log.expand.posts.map((post) => (
                        <Link
                          key={post.id}
                          to={`/post/${post.id}`}
                          className="changelog-item"
                        >
                          <span className={`changelog-item-dot changelog-item-dot-${post.category}`} />
                          <span className="changelog-item-title">{post.title}</span>
                          <span className={`badge badge-${post.category}`} style={{ fontSize: '10px' }}>
                            {post.category}
                          </span>
                          <ChevronRight size={12} className="changelog-item-arrow" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
