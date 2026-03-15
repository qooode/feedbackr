import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import VoteButton from './VoteButton';
import UserAvatar from './UserAvatar';
import FavoriteButton from './FavoriteButton';

export default function PostCard({ post }) {
  const navigate = useNavigate();

  const stripMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div
      className="card card-clickable post-card"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="post-card-votes">
        <VoteButton post={post} />
      </div>

      <div className="post-card-content">
        <h3 className="post-card-title">{post.title}</h3>

        <div className="post-card-meta">
          <span className={`badge badge-${post.category}`}>
            {post.category}
          </span>
          <span className={`badge badge-${post.status}`}>
            {post.status?.replace('_', ' ')}
          </span>
          {post.comments_count > 0 && (
            <span className="post-card-comments">
              <MessageCircle size={13} />
              {post.comments_count}
            </span>
          )}
          {post.expand?.author && (
            <span className="post-card-author">
              <UserAvatar user={post.expand.author} size="18px" />
              {post.expand.author.name || post.expand.author.username || 'Anonymous'}
            </span>
          )}
          {/* Secondary badges — shown on hover */}
          <span className="post-card-secondary-badges">
            <span className={`badge badge-priority-${post.priority}`}>
              {post.priority}
            </span>
            {post.platform && (
              <span className="badge badge-platform">
                {post.platform === 'all' ? 'All Platforms' : post.platform}
              </span>
            )}
          </span>
        </div>

        <p className="post-card-body">{stripMarkdown(post.body)}</p>
      </div>

      <div className="post-card-fav">
        <FavoriteButton postId={post.id} size="sm" />
      </div>
    </div>
  );
}
