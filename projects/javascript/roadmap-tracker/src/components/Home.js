import { Link, useNavigate } from 'react-router-dom';
import { useRoadmap } from '../hooks/useRoadmap.js';
import { getStatusColor } from '../utils';


function Home() {
  const { state, dispatch } = useRoadmap();
  const navigate = useNavigate();

  if (!state.roadmap) return <p>Загрузите JSON с roadmap</p>;

  return (
    <div className="grid">
      {state.roadmap.items.map(item => (
        <div key={item.id} className="card" onClick={() => navigate(`/item/${item.id}`)}
             style={{ borderLeft: `5px solid ${getStatusColor(item.status)}` }}>
          <h3>{item.title}</h3>
          <p>{item.status.replace('-', ' ').toUpperCase()}</p>
          {item.note && <small>Заметка: {item.note.slice(0, 50)}...</small>}
        </div>
      ))}
    </div>
  );
}

export default Home;