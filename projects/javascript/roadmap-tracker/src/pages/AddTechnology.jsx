import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddTechnology() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not-started'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saved = localStorage.getItem('technologies');
    const technologies = saved ? JSON.parse(saved) : [];
    
    technologies.push({
      id: Date.now(),
      ...formData
    });
    
    localStorage.setItem('technologies', JSON.stringify(technologies));
    navigate('/technologies');
  };

  return (
    <div className="page">
      <h1>➕ Добавить технологию</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Добавить
        </button>
      </form>
    </div>
  );
}

export default AddTechnology;