import { useNavigate } from 'react-router-dom';
import VoteButton from './VoteButton';

export default function PostCard({ post }) {
  const navigate = useNavigate();

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
        <p className="post-card-body">{post.body}</p>

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
              by {post.expand.author.name || post.expand.author.email}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
