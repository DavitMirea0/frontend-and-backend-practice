import React, { useEffect, useState } from 'react';
import './ProductsPage.css';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import { api } from '../../api';

export default function ProductsPage() {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('Все');
  const [sortBy, setSortBy]           = useState('default');
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalMode, setModalMode]     = useState('create');
  const [editingProduct, setEditing]  = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setProducts(await api.getProducts());
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setModalMode('create'); setEditing(null); setModalOpen(true); };
  const openEdit   = (p)  => { setModalMode('edit');   setEditing(p);    setModalOpen(true); };
  const closeModal = ()   => { setModalOpen(false); setEditing(null); };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить продукт?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error(err); alert('Ошибка удаления'); }
  };

  const handleSubmit = async (payload) => {
    try {
      if (modalMode === 'create') {
        const created = await api.createProduct(payload);
        setProducts(prev => [...prev, created]);
      } else {
        const updated = await api.updateProduct(payload.id, payload);
        setProducts(prev => prev.map(p => p.id === payload.id ? updated : p));
      }
      closeModal();
    } catch (err) { console.error(err); alert('Ошибка сохранения'); }
  };

  const categories = ['Все', ...new Set(products.map(p => p.category))];

  let visible = products.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
      (category === 'Все' || p.category === category)
    );
  });

  if (sortBy === 'price-asc')   visible = [...visible].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc')  visible = [...visible].sort((a, b) => b.price - a.price);
  if (sortBy === 'rating-desc') visible = [...visible].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <div className="page">
      <header className="hdr">
        <div className="hdr__inner">
          <div className="brand">
            <span className="brand__icon">💾</span>
            <span className="brand__name">SoftShop</span>
          </div>
          <span className="hdr__sub">Магазин программного обеспечения</span>
        </div>
      </header>

      <main className="main">
        <div className="container">

          <div className="toolbar">
            <h1 className="title">Каталог ПО <span className="count">({visible.length})</span></h1>
            <button className="btn btn--primary" onClick={openCreate}>+ Добавить</button>
          </div>

          <div className="controls">
            <input
              className="searchBox"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Поиск по названию или описанию..."
            />
            <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="default">По умолчанию</option>
              <option value="price-asc">Цена ↑</option>
              <option value="price-desc">Цена ↓</option>
              <option value="rating-desc">Рейтинг ↓</option>
            </select>
          </div>

          <div className="tabs">
            {categories.map(c => (
              <button
                key={c}
                className={`tab ${category === c ? 'tab--active' : ''}`}
                onClick={() => setCategory(c)}
              >{c}</button>
            ))}
          </div>

          {loading
            ? <div className="empty">Загрузка...</div>
            : <ProductsList products={visible} onEdit={openEdit} onDelete={handleDelete} />
          }
        </div>
      </main>

      <footer className="ftr">
        <div className="ftr__inner">© {new Date().getFullYear()} SoftShop — лицензионное ПО</div>
      </footer>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
