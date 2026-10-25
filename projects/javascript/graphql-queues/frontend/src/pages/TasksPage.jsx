import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_TASKS = gql`
  query GetTasks {
    tasks {
      id
      type
      status
      createdAt
      processedAt
      retryCount
      payload {
        to
        subject
        email
        message
      }
    }
  }
`;

const CREATE_EMAIL_TASK = gql`
  mutation CreateEmailTask($to: String!, $subject: String!, $body: String!) {
    createEmailTask(to: $to, subject: $subject, body: $body) {
      id
      type
      status
      createdAt
    }
  }
`;

const CREATE_NOTIFICATION_TASK = gql`
  mutation CreateNotificationTask($email: String!, $message: String!) {
    createNotificationTask(email: $email, message: $message) {
      id
      type
      status
      createdAt
    }
  }
`;

function TasksPage() {
  const { loading, error, data, refetch } = useQuery(GET_TASKS, {
    pollInterval: 2000, // Poll every 2 seconds for updates
  });
  const [createEmailTask] = useMutation(CREATE_EMAIL_TASK);
  const [createNotificationTask] = useMutation(CREATE_NOTIFICATION_TASK);
  
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [notificationForm, setNotificationForm] = useState({ email: '', message: '' });

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <div className="loading">Error: {error.message}</div>;

  const handleSendEmail = async (e) => {
    e.preventDefault();
    await createEmailTask({
      variables: emailForm,
    });
    setEmailForm({ to: '', subject: '', body: '' });
    refetch();
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    await createNotificationTask({
      variables: notificationForm,
    });
    setNotificationForm({ email: '', message: '' });
    refetch();
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'status-pending',
      completed: 'status-completed',
      failed: 'status-failed',
    };
    return <span className={`task-status ${classes[status] || ''}`}>{status}</span>;
  };

  return (
    <div>
      <h1>📧 Async Task Processing</h1>
      
      <div className="card">
        <h2>✉️ Send Email (via RabbitMQ)</h2>
        <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            placeholder="To: user@example.com"
            value={emailForm.to}
            onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
            required
          />
          <input
            placeholder="Subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            required
          />
          <textarea
            placeholder="Message body"
            rows="3"
            value={emailForm.body}
            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
            required
          />
          <button type="submit">Queue Email Task</button>
        </form>
        <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
          ⚡ Note: Email tasks have 30% success rate to demonstrate retry logic!
        </small>
      </div>
      
      <div className="card">
        <h2>🔔 Send Notification</h2>
        <form onSubmit={handleSendNotification} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            placeholder="Email"
            type="email"
            value={notificationForm.email}
            onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.value })}
            required
          />
          <input
            placeholder="Message"
            value={notificationForm.message}
            onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
            required
          />
          <button type="submit">Queue Notification</button>
        </form>
      </div>
      
      <div className="card">
        <h2>📋 Task Queue Status</h2>
        <div className="task-list">
          {data?.tasks.length === 0 ? (
            <p>No tasks yet. Create one above!</p>
          ) : (
            data?.tasks.map(task => (
              <div key={task.id} className="task-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>
                    {task.type === 'email' ? '✉️ Email' : '🔔 Notification'}
                    {task.retryCount > 0 && ` (Retry: ${task.retryCount})`}
                  </strong>
                  {getStatusBadge(task.status)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  ID: {task.id}
                </div>
                {task.type === 'email' && task.payload.to && (
                  <div style={{ fontSize: '12px' }}>
                    To: {task.payload.to}<br />
                    Subject: {task.payload.subject}
                  </div>
                )}
                {task.type === 'notification' && task.payload.email && (
                  <div style={{ fontSize: '12px' }}>
                    To: {task.payload.email}<br />
                    Message: {task.payload.message}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  Created: {new Date(task.createdAt).toLocaleString()}
                  {task.processedAt && ` | Processed: ${new Date(task.processedAt).toLocaleString()}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="card">
        <h2>🏗️ Architecture</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', overflow: 'auto' }}>
{`Producer (Frontend/API) → Exchange → Queue → 3 Workers
                                    ↓
                              DLX → DLQ (Failed after 3 retries)`}
        </pre>
        <p style={{ marginTop: '10px' }}>
          🐰 RabbitMQ Dashboard: <a href="http://localhost:15672" target="_blank">http://localhost:15672</a> (guest/guest)
        </p>
        <p>
          📊 GraphQL Playground: <a href="http://localhost:4000/graphql" target="_blank">http://localhost:4000/graphql</a>
        </p>
      </div>
    </div>
  );
}

export default TasksPage;