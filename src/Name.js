import React from 'react';

function Name({ ws }) {
  const [name, setName] = React.useState('');

  const submitName = (e) => {
    e.preventDefault();
    ws.send(JSON.stringify(['name', name]));
  };

  return (
    <>
      <h2>Please write your name</h2>
      <form onSubmit={submitName}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} />
        <button type="submit">Save name</button>
      </form>
    </>
  );
}

export default Name;
