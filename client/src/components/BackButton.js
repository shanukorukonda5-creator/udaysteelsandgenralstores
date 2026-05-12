import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button className="back-btn" onClick={() => navigate(-1)}>
      <span className="back-arrow">←</span>
      <span className="back-label">Back</span>
    </button>
  );
}
