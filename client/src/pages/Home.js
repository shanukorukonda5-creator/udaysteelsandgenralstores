import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CATEGORIES = [
  { name: 'All',               icon: '🏪', sub: [] },
  { name: 'Mixer Grinders',    icon: '🌪️', sub: [] },
  { name: 'Rice Cookers',      icon: '🍚', sub: [] },
  { name: 'Iron Boxes',        icon: '🧺', sub: [] },
  { name: 'Grinders',          icon: '⚙️',  sub: [] },
  { name: 'Pressure Cookers',  icon: '🫕', sub: [] },
  { name: 'Gas Stoves',        icon: '🔥', sub: ['2 Burners', '4 Burners'] },
  { name: 'Fans',              icon: '✇', sub: ['Ceiling Fans', 'Stand Fans', 'Table Fans'] },
  { name: 'USA Products',      icon: '✈️', sub: [] },
  { name: 'Dosa Tawas',        icon: '🍳', sub: [] },
  { name: 'Induction Stoves',  icon: '⚡', sub: [] },
  { name: 'Others',            icon: '🍽️', sub: [] },
];

const FLOATS = ['🌪️','🍚','🧺','⚙️','🫕','🔥','✇','✈️','🍳','🍽️'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [subCategory, setSubCategory] = useState('');
  const [openSub, setOpenSub] = useState('');

  const activeCat = CATEGORIES.find(c => c.name === category);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (category !== 'All') params.category = subCategory || category;
        const res = await axios.get('/api/products', { params });
        setProducts(res.data);
      } catch {}
      setLoading(false);
    };
    const timer = setTimeout(fetch, 300);
    return () => clearTimeout(timer);
  }, [search, category, subCategory]);

  const handleCatClick = (cat) => {
    if (cat.sub.length > 0) {
      setOpenSub(openSub === cat.name ? '' : cat.name);
    } else {
      setCategory(cat.name);
      setSubCategory('');
      setOpenSub('');
    }
  };

  const handleSubClick = (catName, sub) => {
    setCategory(catName);
    setSubCategory(sub);
    setOpenSub('');
  };

  const displayTitle = subCategory || (category === 'All' ? 'All Products' : category);

  return (
    <div className="home">
      {/* Hero */}
      <div className="hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-floats">
          {FLOATS.map((e, i) => (
            <span key={i} className="float-item" style={{
              left: `${5 + i * 10}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.3}s`,
              fontSize: `${1.8 + (i % 3) * 0.6}rem`,
              opacity: 0.75
            }}>{e}</span>
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-badge">✨ Welcome to Our Store</div>
          <h1 className="hero-title">
            <span className="highlight">Uday Steels</span> &<br />
            General Stores
          </h1>
          <p className="hero-sub">  Uday Steels & General Stores offers Mixer Grinders, Rice Cookers,
  Gas Stoves, Induction Stoves, Fans, Pressure Cookers,
  RO Water Purifiers and Home Appliances at the best prices.</p>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-num">500+</div><div className="hero-stat-label">Products</div></div>
            <div className="hero-stat"><div className="hero-stat-num">1000+</div><div className="hero-stat-label">Happy Customers</div></div>
            <div className="hero-stat"><div className="hero-stat-num">100%</div><div className="hero-stat-label">Genuine Quality</div></div>
          </div>
          <div className="about-store">
  <h2>About Uday Steels & General Stores</h2>
  <p>
    Uday Steels & General Stores is your trusted destination for
    Mixer Grinders, Rice Cookers, Gas Stoves, Induction Stoves,
    Pressure Cookers, Fans, RO Water Purifiers and Home Appliances.
  </p>
</div>

<div className="store-features">
  <div className="feature-card">
    <span>🌪️</span>
    <h3>Mixer Grinders</h3>
    <p>Premium quality mixer grinders.</p>
  </div>

  <div className="feature-card">
    <span>🍚</span>
    <h3>Rice Cookers</h3>
    <p>Easy and efficient cooking solutions.</p>
  </div>

  <div className="feature-card">
    <span>🔥</span>
    <h3>Gas Stoves</h3>
    <p>Reliable and durable gas stoves.</p>
  </div>

  <div className="feature-card">
    <span>⚡</span>
    <h3>Induction Stoves</h3>
    <p>Modern energy-efficient cooking appliances.</p>
  </div>
</div>

<div className="contact-store">
  <h2>Contact Uday Steels & General Stores</h2>
  <p>📍 Infront of sivalayam beside SBI atm,Main Road Tiruvuru</p>
  <p>📞 9951185422</p>
</div>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="categories-scroll">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="cat-wrap">
              <button
                className={`cat-btn ${category === cat.name ? 'active' : ''}`}
                onClick={() => handleCatClick(cat)}
              >
                <span className="cat-icon">{cat.icon}</span>
                {cat.name}
                {cat.sub.length > 0 && (
                  <span className="cat-arrow">{openSub === cat.name ? '▲' : '▼'}</span>
                )}
              </button>
              {/* Sub-categories dropdown */}
              {cat.sub.length > 0 && openSub === cat.name && (
                <div className="sub-dropdown">
                  {cat.sub.map(sub => (
                    <button
                      key={sub}
                      className={`sub-btn ${subCategory === sub ? 'active' : ''}`}
                      onClick={() => handleSubClick(cat.name, sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="products-section">
        <div className="section-header">
          <h2 className="section-title">{displayTitle}</h2>
          <span className="product-count">{products.length} items</span>
        </div>

        {loading ? (
          <div className="products-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 380 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '5rem' }}>🔍</div>
            <p>No products found. Try a different category!</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p, i) => (
              <div key={p._id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
