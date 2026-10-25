import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRoadmap } from '../hooks/useRoadmap.js'; // Этот путь правильный

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useRoadmap();
  const [editingNote, setEditingNote] = useState('');
  const item = state.roadmap?.items.find(i => i.id === id);

  useEffect(() => {
    if (item) setEditingNote(item.note || '');
  }, [item, id]);

  if (!item) return <p>Пункт не найден</p>;

  const updateItem = (updates) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, ...updates } });
  };

  const saveNote = () => {
    updateItem({ note: editingNote });
  };

  const statusOptions = ['not-started', 'in-progress', 'completed'];

  return (
    <div className="detail">
      <button onClick={() => navigate('/')}>Назад</button>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      {item.link && <a href={item.link} target="_blank" rel="noreferrer">Ссылка</a>}
      
      <section>
        <h3>Статус</h3>
        <select value={item.status} onChange={(e) => updateItem({ status: e.target.value })}>
          {statusOptions.map(s => <option key={s} value={s}>{s.replace('-', ' ').toUpperCase()}</option>)}
        </select>
      </section>

      <section>
        <h3>Дедлайн</h3>
        <input type="date" value={item.deadline || ''} onChange={(e) => updateItem({ deadline: e.target.value || null })} />
      </section>

      <section>
        <h3>Заметка</h3>
        <textarea value={editingNote} onChange={(e) => setEditingNote(e.target.value)} />
        <button onClick={saveNote}>Сохранить</button>
        <button onClick={() => { setEditingNote(''); updateItem({ note: '' }); }}>Удалить</button>
        {item.note && <p>Текущая: {item.note}</p>}
      </section>
    </div>
  );
}

export default ItemDetail;