import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Film } from 'lucide-react';

const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'];

function getExt(url) {
  return (url || '').split('.').pop()?.toLowerCase() || '';
}

function isVideo(url) {
  return VIDEO_EXTS.includes(getExt(url));
}

export default function Lightbox({ urls, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const total = urls.length;
  const current = urls[index];
  const currentIsVideo = isVideo(current);

  const goPrev = useCallback(() => {
    setLoaded(false);
    setZoomed(false);
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setLoaded(false);
    setZoomed(false);
    setIndex((i) => (i + 1) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="lightbox-topbar" onClick={(e) => e.stopPropagation()}>
        {total > 1 && (
          <span className="lightbox-counter">
            {index + 1} / {total}
          </span>
        )}
        <div className="lightbox-topbar-actions">
          <a
            href={current}
            target="_blank"
            rel="noopener noreferrer"
            className="lightbox-btn"
            title="Open original"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={18} />
          </a>
          <button className="lightbox-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {currentIsVideo ? (
          <video
            key={current}
            src={current}
            controls
            autoPlay
            className="lightbox-video"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            key={current}
            src={current}
            alt={`Attachment ${index + 1}`}
            className={`lightbox-image ${loaded ? 'loaded' : ''} ${zoomed ? 'zoomed' : ''}`}
            onLoad={() => setLoaded(true)}
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(!zoomed);
            }}
            draggable={false}
          />
        )}

        {!loaded && !currentIsVideo && (
          <div className="lightbox-loading">
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            className="lightbox-nav lightbox-nav-prev"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            title="Previous"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className="lightbox-nav lightbox-nav-next"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            title="Next"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="lightbox-thumbstrip" onClick={(e) => e.stopPropagation()}>
          {urls.map((url, i) => (
            <button
              key={i}
              className={`lightbox-thumb ${i === index ? 'active' : ''}`}
              onClick={() => { setLoaded(false); setZoomed(false); setIndex(i); }}
            >
              {isVideo(url) ? (
                <div className="lightbox-thumb-vid"><Film size={12} /></div>
              ) : (
                <img src={url} alt="" draggable={false} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
