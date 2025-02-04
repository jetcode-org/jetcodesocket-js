# jetcodesocket-js

**jetcodesocket-js** is a JavaScript client library designed to simplify interaction with a JetcodeSocket server in multiplayer games. 
It provides a convenient interface for connecting to game lobbies, sending and receiving data, and managing game states.

## Key Features

- **Connect to Server**: Easily connect to a JetcodeSocket server.
- **Lobby Management**: Join existing lobbies or create new ones. The library automatically handles lobby state management.
- **Data Sending and Receiving**: The library supports to send game data to other participants.
- **Event Handling**: Subscribe to events to receive notifications about actions taken by other participants, such as member joining, member leaving, and game starting and more. 

## Classes

### `JetcodeSocket`

The main class for working with WebSocket connections.

#### Constructor

constructor(socketUrl = 'ws://localhost:17500')

- **socketUrl**: The URL of the JetcodeSocket server (default is `ws://localhost:17500`).

#### Methods

- **`connect(gameToken, lobbyId = null, inParameters = {})`**  
  Connects the client to the server and joins the specified lobby.  
  Returns a promise with the connection object.

### `JetcodeSocketConnection`

Class for managing the connection to the server and interacting with the lobby.

#### Constructor

constructor(socket, gameToken, lobbyId = 0)

- **socket**: The WebSocket object.
- **gameToken**: The game token.
- **lobbyId**: The ID of the lobby (default is 0).

#### Methods

- **`leaveLobby()`**  
  Allows the client to leave the current lobby.

- **`sendData(value, parameters = {})`**  
  Sends data to the current lobby. Parameters can include additional information about the message.

- **`connect(action, callback)`**  
  Subscribes a handler for a specific action (e.g., receiving data or notification of a participant joining).

## Events

The library supports the following events:

- **`JOIN_LOBBY`**: Request to join a lobby.
- **`LEAVE_LOBBY`**: Request to leave a lobby.
- **`SEND_DATA`**: Sending data in a lobby.
- **`JOINED`**: Successfully joined a lobby.
- **`RECEIVE_DATA`**: Receiving data from other participants.
- **`MEMBER_JOINED`**: Notification of a new participant in the lobby.
- **`MEMBER_LEFT`**: Notification of a participant leaving the lobby.
- **`GAME_STARTED`**: Notification that the game has started.
- **`GAME_STOPPED`**: Notification that the game has ended.
- **`ERROR`**: Error message.

## Example of usage:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JetcodeSocketJS</title>
</head>
<body>
    <button class="connect">Connect to common lobby</button>
    <button class="connect-lobby">Connect to selected lobby</button>
    <button class="send">Send data</button>
    <button class="disconnect">Disconnect from lobby</button>

    <script src="/home/nilov/projects/jetcodesocket-js/jetcodesocket.js"></script>
    <script>
        let connectButton = document.querySelector('.connect');
        let connectLobbyButton = document.querySelector('.connect-lobby');
        let sendButton = document.querySelector('.send');
        let disconnectButton = document.querySelector('.disconnect');
        let connection;

        async function onConnect() {
            connect(0);
        }

        async function onConnectLobby() {
            const lobby = prompt('Enter the lobby ID:');
            connect(lobby);
        }

        async function connect(lobby) {
            const socketUrl = 'ws://localhost:17500';
            const socket = new JetcodeSocket(socketUrl);

            try {
                connection = await socket.connect('aaaa-bbbb-cccc-dddd', lobby, {
                    MaxMembers: 2,
                    MinMembers: 2,
                    StartGameWithMembers: 2,
                    LobbyAutoCreate: true
                });

                console.log('Connection: ', connection);

                connection.connect(JetcodeSocket.MEMBER_JOINED, (parameters, isMe) => {
                    console.log('MEMBER_JOINED');
                    console.log('It\'s me: ' + isMe);
                    console.log('parameters: ', parameters);
                });

                connection.connect(JetcodeSocket.MEMBER_LEFT, (parameters, isMe) => {
                    console.log('MEMBER_LEFT');
                    console.log('It\'s me: ' + isMe);
                    console.log('parameters: ', parameters);
                });

                connection.connect(JetcodeSocket.GAME_STARTED, (parameters) => {
                    console.log('GAME_STARTED');
                    console.log('parameters: ', parameters);
                });

                connection.connect(JetcodeSocket.GAME_STOPPED, (parameters) => {
                    console.log('GAME_STOPPED');
                    console.log('parameters: ', parameters);
                });

                connection.connect(JetcodeSocket.RECEIVE_DATA, (value, parameters, isMe) => {
                    console.log('RECEIVE_DATA');
                    console.log('It\'s me: ' + isMe);
                    console.log('value: ' + value);
                    console.log('parameters: ', parameters);
                });

                connection.connect(JetcodeSocket.ERROR, (parameters) => {
                    console.log('ERROR');
                    console.log('parameters: ', parameters);
                });

            } catch(error) {
                console.error(error);
            }
        }

        async function onSendData() {
            try {
                connection.sendData('100', {
                    'parameter': 'x',
                    'sprite': 'tank1',
                });

            } catch(error) {
                console.error(error);
            }
        }

        async function onDisconnect() {
            try {
                connection.leaveLobby();

            } catch(error) {
                console.error(error);
            }
        }

        connectButton.addEventListener('click', onConnect);
        connectLobbyButton.addEventListener('click', onConnectLobby);
        sendButton.addEventListener('click', onSendData);
        disconnectButton.addEventListener('click', onDisconnect);
    </script>
</body>
</html>
```
