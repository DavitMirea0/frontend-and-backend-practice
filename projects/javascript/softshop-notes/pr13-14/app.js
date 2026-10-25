import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './styles.css';

const STORAGE_KEY = 'softshop-notes';
const VAPID_PUBLIC_KEY = 'BEmYxfNz1HCL7jXv-V1u52Qz_RTgms7qrOsYHtFHmmeCXu_tUdDu3-5ySbeA9tjjqvZ-zPk3BFXqVgPhZn0aaW4';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  const serverUrl = useMemo(() => (
    window.location.port === '3000'
      ? 'http://localhost:3001'
      : window.location.origin
  ), []);
  const socketRef = useRef(null);

  const [activeTab, setActiveTab] = useState('home');
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  });
  const [text, setText] = useState('');
  const [reminderText, setReminderText] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [quickText, setQuickText] = useState('');
  const [quickMinutes, setQuickMinutes] = useState('5');
  const [toast, setToast] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const socket = io(serverUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('taskAdded', (task) => setToast('Новая заметка: ' + task.text));
    socket.on('reminderScheduled', (r) => setToast('Напоминание запланировано: ' + r.text));
    return () => socket.disconnect();
  }, [serverUrl]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => { if (!cancelled) setPushEnabled(Boolean(sub)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const addNote = (noteText, reminderTimestamp = null) => {
    const n = { id: Date.now(), text: noteText, reminder: reminderTimestamp };
    setNotes((prev) => [...prev, n]);
    if (reminderTimestamp) {
      socketRef.current?.emit('newReminder', { id: n.id, text: n.text, reminderTime: reminderTimestamp });
    } else {
      socketRef.current?.emit('newTask', { text: n.text, timestamp: Date.now() });
    }
  };

  const handleAddSimple = (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    addNote(v);
    setText('');
  };

  const handleAddReminder = (e) => {
    e.preventDefault();
    const v = reminderText.trim();
    if (!v || !reminderTime) return;
    const ts = new Date(reminderTime).getTime();
    if (ts <= Date.now()) { alert('Дата должна быть в будущем'); return; }
    addNote(v, ts);
    setReminderText('');
    setReminderTime('');
  };

  const handleQuickReminder = (e) => {
    e.preventDefault();
    const v = quickText.trim();
    const mins = parseInt(quickMinutes, 10);
    if (!v || !mins || mins <= 0) return;
    const ts = Date.now() + mins * 60 * 1000;
    addNote(v, ts);
    setQuickText('');
    setQuickMinutes('5');
    setToast('Напоминание через ' + mins + ' мин!');
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEnablePush = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') { alert('Уведомления запрещены'); return; }
    if (Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') { alert('Нужно разрешить уведомления'); return; }
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      await fetch(serverUrl + '/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      setPushEnabled(true);
      setToast('Уведомления включены!');
    } catch (err) {
      console.error(err);
      alert('Ошибка включения уведомлений');
    }
  };

  const handleDisablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await fetch(serverUrl + '/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
      await sub.unsubscribe();
      setPushEnabled(false);
      setToast('Уведомления отключены');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="shell">
      <header className="hero">
        <p className="eyebrow">Практики 13-17</p>
        <h1>Мои заметки</h1>
        <p className="hero-text">Офлайн, App Shell, WebSocket и push-напоминания.</p>
        <div className="tabs">
          <button className={activeTab === 'home' ? 'tab active' : 'tab'} onClick={() => setActiveTab('home')}>Главная</button>
          <button className={activeTab === 'about' ? 'tab active' : 'tab'} onClick={() => setActiveTab('about')}>О приложении</button>
        </div>
      </header>

      <main className="container">
        {activeTab === 'home' ? (
          <>
            <section className="panel">
              <h2>Добавить заметку</h2>
              <form className="form-grid" onSubmit={handleAddSimple}>
                <textarea placeholder="Напиши заметку..." value={text} onChange={(e) => setText(e.target.value)} />
                <button type="submit">Добавить</button>
              </form>
            </section>

            <section className="panel">
              <h2>Добавить с напоминанием</h2>
              <form className="reminder-grid" onSubmit={handleAddReminder}>
                <input type="text" placeholder="Текст напоминания" value={reminderText} onChange={(e) => setReminderText(e.target.value)} required />
                <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} required />
                <button type="submit" className="success">Добавить с напоминанием</button>
              </form>
            </section>

            <section className="panel">
              <h2>Быстрое напоминание</h2>
              <form className="reminder-grid" onSubmit={handleQuickReminder}>
                <input type="text" placeholder="Текст" value={quickText} onChange={(e) => setQuickText(e.target.value)} required />
                <input type="number" min="1" max="1440" value={quickMinutes} onChange={(e) => setQuickMinutes(e.target.value)} required style={{textAlign:'center'}} />
                <button type="submit" style={{background:'#7c3aed'}}>Через N мин</button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Список заметок</h2>
                <span className="counter">{notes.length}</span>
              </div>
              <div className="notes">
                {notes.length === 0 ? (
                  <p className="empty">Заметок пока нет. Добавьте первую!</p>
                ) : (
                  notes.map((note) => (
                    <article className="note" key={note.id}>
                      <div>
                        <p>{note.text}</p>
                        {note.reminder
                          ? <small>Напоминание: {new Date(note.reminder).toLocaleString('ru-RU')}</small>
                          : <small>Без напоминания</small>
                        }
                      </div>
                      <button className="danger" onClick={() => deleteNote(note.id)}>Удалить</button>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="panel about">
            <h2>О приложении</h2>
            <p>Заметки, версия 2.0</p>
            <p>Офлайн-приложение с App Shell, WebSocket и push-напоминаниями.</p>
            <p>Практические занятия 13–17, МИРЭА, ИПТИП.</p>
          </section>
        )}
      </main>

      <footer className="footer-actions">
        {!pushEnabled ? (
          <button className="success" onClick={handleEnablePush}>Включить уведомления</button>
        ) : (
          <button className="danger" onClick={handleDisablePush}>Отключить уведомления</button>
        )}
      </footer>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

export default App;
