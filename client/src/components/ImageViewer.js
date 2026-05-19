import React, { useState, useRef } from 'react';
import './ImageViewer.css';

export default function ImageViewer({ images, initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  const img = images[current];

  const zoomIn  = () => setZoom(z => Math.min(z + 0.5, 4));
  const zoomOut = () => { setZoom(z => { const nz = Math.max(z - 0.5, 1); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; }); };
  const reset   = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const prev = () => { setCurrent(c => (c - 1 + images.length) % images.length); reset(); };
  const next = () => { setCurrent(c => (c + 1) % images.length); reset(); };

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => setDragging(false);

  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  return (
    <div className="iv-overlay" onClick={onClose}>
      <div className="iv-container" onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button className="iv-close" onClick={onClose}>✕</button>

        {/* Controls */}
        <div className="iv-controls">
          <button onClick={zoomOut} disabled={zoom <= 1} title="Zoom Out">🔍−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zoom >= 4} title="Zoom In">🔍+</button>
          <button onClick={reset} title="Reset">↺</button>
        </div>

        {/* Image */}
        <div
          className="iv-img-wrap"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={img}
            alt="product"
            className="iv-img"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: dragging ? 'none' : 'transform 0.2s ease'
            }}
            draggable={false}
          />
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button className="iv-nav iv-prev" onClick={prev}>‹</button>
            <button className="iv-nav iv-next" onClick={next}>›</button>
            <div className="iv-dots">
              {images.map((_, i) => (
                <span key={i} className={`iv-dot ${i === current ? 'active' : ''}`} onClick={() => { setCurrent(i); reset(); }} />
              ))}
            </div>
          </>
        )}

        {/* Hint */}
        <div className="iv-hint">Scroll to zoom • Drag to pan • Click outside to close</div>
      </div>
    </div>
  );
}
