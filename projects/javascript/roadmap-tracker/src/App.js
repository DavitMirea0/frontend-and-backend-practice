import { Routes, Route } from 'react-router-dom';
import { RoadmapProvider } from './context/RoadmapContext';
import Navigation from './components/Navigation.js';
import HomePage from './pages/HomePage';
import ItemDetailPage from './pages/ItemDetailPage';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';
import FormsPage from './pages/FormsPage';
import MuiPage from './pages/MuiPage'; 
import './App.css';

function App() {
  return (
    <RoadmapProvider>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/item/:techId" element={<ItemDetailPage />} />
            <Route path="/technology/:techId" element={<ItemDetailPage />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/forms" element={<FormsPage />} />
            <Route path="/mui" element={<MuiPage />} />  {/* 👈 Добавить */}
          </Routes>
        </main>
      </div>
    </RoadmapProvider>
  );
}

export default App;