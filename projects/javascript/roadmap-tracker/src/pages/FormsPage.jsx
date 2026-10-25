import { useState } from 'react';
import TechnologyManager from '../components/TechnologyManager';
import DataImportExport from '../components/DataImportExport';
import './FormsPage.css';

function FormsPage() {
  const [activeTab, setActiveTab] = useState('manager');

  return (
    <div className="forms-page">
      <h1>📝 Формы и данные</h1>


      <div className="tabs">
        <button
          className={activeTab === 'manager' ? 'active' : ''}
          onClick={() => setActiveTab('manager')}
        >
          🎯 Управление
        </button>
        <button
          className={activeTab === 'import-export' ? 'active' : ''}
          onClick={() => setActiveTab('import-export')}
        >
          📁 Импорт/Экспорт
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'manager' && <TechnologyManager />}
        {activeTab === 'import-export' && <DataImportExport />}
      </div>
    </div>
  );
}

export default FormsPage;