import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Lazy loading for pages (Code Splitting)
const HomePage = lazy(() => import('./pages/HomePage'));
const BooksPage = lazy(() => import('./pages/BooksPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));

function App() {
  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/">🏠 Home</Link>
          <Link to="/books">📚 Books</Link>
          <Link to="/tasks">📧 Tasks</Link>
        </nav>
        
        <div className="container">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/tasks" element={<TasksPage />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
}

export default App;