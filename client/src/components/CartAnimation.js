import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import './CartAnimation.css';

export default function CartAnimation() {
  const { animating, animPos } = useCart();
  const [stage, setStage] = useState(0);
  // stage 0 = idle, 1 = product shrinks, 2 = box seals, 3 = truck drives off

  useEffect(() => {
    if (!animating) { setStage(0); return; }
    setStage(1);
    const t1 = setTimeout(() => setStage(2), 700);
    const t2 = setTimeout(() => setStage(3), 1400);
    const t3 = setTimeout(() => setStage(0), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [animating]);

  if (stage === 0) return null;

  const cx = animPos?.x || window.innerWidth / 2;
  const cy = animPos?.y || window.innerHeight / 2;

  return (
    <div className="ca-overlay">
      {/* Stage 1 — Product shrinks into box */}
      {stage === 1 && (
        <div className="ca-stage1" style={{ left: cx, top: cy }}>
          <div className="ca-product">🛍️</div>
          <div className="ca-arrow">↓</div>
          <div className="ca-box-open">📦</div>
        </div>
      )}

      {/* Stage 2 — Box seals and bounces */}
      {stage === 2 && (
        <div className="ca-stage2" style={{ left: cx, top: cy }}>
          <div className="ca-box-sealed">📦</div>
          <div className="ca-tape">✅ Packed!</div>
        </div>
      )}

      {/* Stage 3 — Truck picks up box and drives to cart */}
      {stage === 3 && (
        <div className="ca-stage3">
          <div className="ca-truck-wrap">
            <div className="ca-box-on-truck">📦</div>
            <div className="ca-truck">🚚</div>
          </div>
          <div className="ca-road" />
        </div>
      )}
    </div>
  );
}
