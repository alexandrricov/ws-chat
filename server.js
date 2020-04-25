const WebSocket = require('ws');

// const usersMap = new WeakMap();

const wss = new WebSocket.Server({ port: 8080 });
// const server = http.createServer();
// const wss = new WebSocket.Server({ noServer: true })

/**
 * Generate unique id
 * @returns {number} - Unique id
 */
const uniqueId = (() => {
  let idCounter = 0;

  return () => {
      return ++idCounter;
  }
})();

/**
 * @typedef {Object} RicovChatMessage
 * @property {number} id - id
 * @property {number} userId - user id
 * @property {'message'} type - message type
 * @property {string} message - message text
 * @property {string} date - message date
 * @property {boolean} modified
 * @property {boolean} deleted
 */
/**
 * @typedef {Object} RicovSystemMessage
 * @property {number} id - id
 * @property {number} userId - user id
 * @property {'system'} type - message type
 * @property {'join' | 'left'} message - message text
 * @property {string} date - message date
 */
/**
 * @typedef {RicovChatMessage | RicovSystemMessage} RicovMessage
 */

/**
 * @type {RicovMessage[]}
 */
let history = [];

/**
 * @typedef {Object} RicovUser
 * @property {number} id - id
 * @property {string} name - user name
 * @property {boolean} active - is user online
 */

/**
 *
 * @type {Object.<string, RicovUser>}
 */
const users = {};

wss.on('connection', function connection(ws, request) {
  /** @type {RicovUser} */
  const user = {
    id:  uniqueId(),
    name: '',
    active: false,
  };
  users[user.id] = user;

  /** @type {RicovSystemMessage} */
  const joinMessage = {
    id: uniqueId(),
    userId: user.id,
    type: 'system',
    message: 'join',
    date: new Date().toJSON(),
  };
  history.push(joinMessage);

  // ws.send(JSON.stringify(['user', user]));
  ws.send(JSON.stringify(['history', history]));
  ws.send(JSON.stringify(['users', users, user.id]));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== ws) {
      client.send(JSON.stringify(['message', joinMessage]));
    }
  });

  ws.on('message', function incoming(/** @type {string} */message) {
    console.log('received: %s', message);

    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (e) {
      console.error(e);
    }

    if (!parsed) {
      console.log('some error message format received:', message);
    }

    switch (parsed[0]) {
      case 'message': {
        /** @type {RicovChatMessage} */
        const newMessage = {
          id: uniqueId(),
          userId: user.id,
          type: 'message',
          message: parsed[1],
          date: new Date().toJSON(),
          modified: false,
          deleted: false,
        };
        history.push(newMessage);

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(['message', newMessage]));
          }
        });
        break;
      }
      case 'name': {
        if (user) {
          user.name = parsed[1];
        }

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(['users', users, user.id]));
          }
        });
        break;
      }
      case 'remove': {
        history.forEach(historyItem => {
          if (historyItem.id === parsed[1]) {
            historyItem.deleted = true;
          }
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(['history', history]));
          }
        });
        break;
      }
      case 'edit': {
        history.forEach(historyItem => {
          if (historyItem.id === parsed[1]) {
            historyItem.message = parsed[2];
          }
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(['history', history]));
          }
        });
        break;
      }
      default:
        console.log('No case defined for ', parsed)
    }
  });

  ws.on('open', function open() {
    console.log(`connected`);
    ws.send(JSON.stringify(['history', history]));
  });

  ws.on('close', function close() {
    console.log(`disconnected`);
    /** @type {RicovSystemMessage} */
    const leftMessage = {
      id: uniqueId(),
      userId: user.id,
      type: 'system',
      message: 'left',
      date: new Date().toJSON(),
    };
    history.push(leftMessage);

    user.active = false;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(JSON.stringify(['message', leftMessage]));
        client.send(JSON.stringify(['users', users, user.id]));
      }
    });

    ws.close()
  });
});
