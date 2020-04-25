import React from 'react';
import cn from 'classnames';
import Name from './Name';
import { Message } from './Message';
import './App.css';

const ws = new WebSocket('ws://127.0.0.1:8080');

function App() {
  const [text, setText] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const [id, setId] = React.useState();
  const [users, setUsers] = React.useState({});
  const [editMessage, setEditMessage] = React.useState();
  /**
   * @type {['users' | 'chat', Function]}
   */
  const [tab, setTab] = React.useState('users');

  React.useEffect(() => {
    // connectionRef.current = new WebSocket('ws://127.0.0.1:8080');
    ws.onmessage = function (m) {
      let data;
      try {
        data = JSON.parse(m.data);
        console.log(data);
      } catch (e) {
        console.error(e);
      }

      if (!data) return;

      switch (data[0]) {
        case 'history':
          setMessages(data[1]);
          break;
        case 'users':
          setId(data[2]);
          setUsers(data[1]);
          break;
        case 'message':
          setMessages(prevMessages => [...prevMessages, data[1]]);
          break;
        default:
          console.log('No case for ', data);
      }
    };
  }, []);

  const submitMessage = (e) => {
    e.preventDefault();

    ws.send(JSON.stringify(['message', text]));
    setText('');
  };
  const submitEdit = (e) => {
    e.preventDefault();

    ws.send(JSON.stringify(['edit', editMessage.id, editMessage.message]));
    setEditMessage(null);
  };

  const editHandler = (id) => {
    // ws.send(JSON.stringify(['message', text]));
    const messageToEdit = messages.find(m => m.id === id);

    if (messageToEdit) setEditMessage(JSON.parse(JSON.stringify(messageToEdit)));
  };

  const removeHandler = (id) => {
    ws.send(JSON.stringify(['remove', id]));
  };

  return (
    <>
      <header className="header">
        <h1>Status Meeting Standup</h1>
      </header>
      <main>
        {users[id] && users[id].name
          ? (<>
            <nav className="mainNav">
              <button type="button" className={cn('tab', { active: tab === 'users' })} onClick={() => setTab('users')}>
                {`Participants (${Object.keys(users).length})`}
              </button>
              <button type="button" className={cn('tab', { active: tab === 'chat' })} onClick={() => setTab('chat')}>Chat</button>
            </nav>
            <div className="sections">
              <section className={cn('section', 'users', { hidden: tab !== 'users' })}>
                <h2 className="visuallyHidden">User list</h2>
                <ul>
                  {Object.values(users).map(user => <li key={user.id}>{user.name}</li>)}
                </ul>
              </section>
              <section className={cn('section', 'chat', { hidden: tab !== 'chat' })}>
                <h2 className="visuallyHidden">Chat</h2>
                <ul>
                  {messages.map(m => <li key={m.id}>
                    <Message user={users[m.userId]} message={m} onEdit={editHandler} onRemove={removeHandler} />
                  </li>)}
                </ul>
                {editMessage
                  ? <form className="sendMessageForm" onSubmit={submitEdit}>
                      <input
                        type="text"
                        value={editMessage.message}
                        onChange={e => {
                          const {value} = e.target;
                          setEditMessage(prevEditMessage => ({ ...prevEditMessage, message: value }))}
                        }
                      />
                      <button type="submit" disabled={!editMessage.message === messages.find(m => m.id === editMessage.id)?.message}>🚀</button>
                    </form>
                  : <form className="sendMessageForm" onSubmit={submitMessage}>
                      <input type="text" value={text} onChange={e => setText(e.target.value)}/>
                      <button type="submit" disabled={!text}>🚀</button>
                    </form>
                }
              </section>
            </div>
          </>)
          : <Name ws={ws} />}
      </main>
    </>
  );
}

export default App;
