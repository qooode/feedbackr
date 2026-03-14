import { useNavigate } from 'react-router-dom';
import VoteButton from './VoteButton';
import UserAvatar from './UserAvatar';

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
        <p className="post-card-body">{stripMarkdown(post.body)}</p>

        <div className="post-card-meta">
          <span className={`badge badge-${post.category}`}>
            {post.category}
          </span>
          <span className={`badge badge-${post.status}`}>
            {post.status?.replace('_', ' ')}
          </span>
          <span className={`badge badge-priority-${post.priority}`}>
            {post.priority}
          </span>
          {post.expand?.author && (
            <span className="post-card-author">
              <UserAvatar user={post.expand.author} size="18px" />
              {post.expand.author.name || post.expand.author.email}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
