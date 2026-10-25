import React from 'react';

function HomePage() {
  return (
    <div>
      <h1>🚀 Fullstack Demo</h1>
      
      <div className="card">
        <h2>📖 GraphQL + Apollo Server</h2>
        <p>Books and authors management with GraphQL API</p>
        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
          <li>Query all books and authors</li>
          <li>Create new books and authors</li>
          <li>Nested resolvers for relationships</li>
        </ul>
      </div>
      
      <div className="card">
        <h2>🐰 RabbitMQ Message Queue</h2>
        <p>Async task processing with workers</p>
        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
          <li>Producer → Exchange → Queue → Consumers</li>
          <li>Multiple workers (3 instances)</li>
          <li>Retry logic with exponential backoff</li>
          <li>Dead Letter Queue for failed messages</li>
        </ul>
      </div>
      
      <div className="card">
        <h2>⚡ Vite + Code Splitting</h2>
        <p>Modern build tool with optimizations</p>
        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
          <li>Lazy loading for routes</li>
          <li>Manual chunks for vendor code</li>
          <li>Tree shaking and minification</li>
          <li>Bundle analyzer ready</li>
        </ul>
      </div>
    </div>
  );
}

export default HomePage;