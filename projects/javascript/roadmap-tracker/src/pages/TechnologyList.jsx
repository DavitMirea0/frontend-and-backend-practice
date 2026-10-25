import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function TechnologyList() {
  const [technologies, setTechnologies] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('technologies');
    if (saved) {
      setTechnologies(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="page">
      <h1>📚 Все технологии</h1>
      
      <div className="technologies-grid">
        {technologies.map(tech => (
          <div key={tech.id} className="technology-item">
            <h3>{tech.title}</h3>
            <Link to={`/technology/${tech.id}`}>Подробнее →</Link>
          </div>
        ))}
      </div>

      {technologies.length === 0 && (
        <p>Технологий пока нет.</p>
      )}
    </div>
  );
}

export default TechnologyList;