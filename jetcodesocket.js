class JetcodeSocket {
    static JOIN_LOBBY = 'JOIN_LOBBY';
    static LEAVE_LOBBY = 'LEAVE_LOBBY';
    static SEND_DATA = 'SEND_DATA';

    static JOINED = 'JOINED';
    static RECEIVE_DATA = 'RECEIVE_DATA';
    static MEMBER_JOINED = 'MEMBER_JOINED';
    static MEMBER_LEFT = 'MEMBER_LEFT';
    static GAME_STARTED = 'GAME_STARTED';
    static GAME_STOPPED = 'GAME_STOPPED';
    static ERROR = 'ERROR';

    constructor(socketUrl = 'ws://localhost:17500') {
        this.socketUrl = socketUrl;
        this.socket = null;

        this.defaultParameters = {
            'LobbyAutoCreate': true,
            'MaxMembers': 2,
            'MinMembers': 2,
            'StartGameWithMembers' : 2
        }
    }

    connect(gameToken, lobbyId = null, inParameters = {}) {
        const parameters = { ...this.defaultParameters, ...inParameters};

        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.socketUrl);

            this.socket.onopen = () => {
                const connection = new JetcodeSocketConnection(
                    this.socket,
                    gameToken,
                    lobbyId,
                    parameters
                );

                connection.joinLobby(gameToken, lobbyId, parameters)
                    .then((assignedLobbyId) => {
                        connection.lobbyId = assignedLobbyId;
                        resolve(connection);
                    })
                    .catch(reject);
            };

            this.socket.onerror = (error) => {
                reject(error);
            };
        });
    }
}

class JetcodeSocketConnection {
    constructor(socket, gameToken, lobbyId = 0) {
        this.socket = socket;
        this.lobbyId = lobbyId;
        this.memberId = null;
        this._connects = {};

        this._connectActions = [
            JetcodeSocket.RECEIVE_DATA,
            JetcodeSocket.MEMBER_JOINED,
            JetcodeSocket.MEMBER_LEFT,
            JetcodeSocket.GAME_STARTED,
            JetcodeSocket.GAME_STOPPED,
            JetcodeSocket.ERROR
        ];

        this._listenSocket();
    }

    _listenSocket() {
        this.socket.onmessage = (event) => {
            const [action, parameters, value] = this._parse(event.data)

            if (action === JetcodeSocket.RECEIVE_DATA) {
                if (this._connects[JetcodeSocket.RECEIVE_DATA]) {
                    this._connects[JetcodeSocket.RECEIVE_DATA](value, parameters, parameters?.MemberId === this.memberId);
                }

            } else if (action === JetcodeSocket.MEMBER_JOINED) {
                if (this._connects[JetcodeSocket.MEMBER_JOINED]) {
                    this._connects[JetcodeSocket.MEMBER_JOINED](parameters, parameters?.MemberId === this.memberId);
                }

            } else if (action === JetcodeSocket.MEMBER_LEFT) {
                if (this._connects[JetcodeSocket.MEMBER_LEFT]) {
                    this._connects[JetcodeSocket.MEMBER_LEFT](parameters, parameters?.MemberId === this.memberId);
                }

            } else if (this._connects[action]) {
                this._connects[action](parameters);
            }
        }
    }

    connect(action, callback) {
        if (this._connectActions.indexOf(action) === false) {
            throw new Error('This actions is not defined.');
        }

        this._connects[action] = callback;
    }

    sendData(value, parameters={}) {
        if (!this.lobbyId) {
            throw new Error('You are not in the lobby!');
        }

        let request = `${JetcodeSocket.SEND_DATA}\n`;

        for (const [key, value] of Object.entries(parameters)) {
            request += key + '=' + value + '\n';
        }

        request += '\n' + value;

        this.socket.send(request);
    }

    joinLobby(gameToken, lobbyId, parameters = {}) {
        return new Promise((resolve, reject) => {
            if (!lobbyId) {
                lobbyId = 0;
            }

            let request = `${JetcodeSocket.JOIN_LOBBY}\n`;
            request += `GameToken=${gameToken}\n`;
            request += `LobbyId=${lobbyId}\n`;

            for (const [key, value] of Object.entries(parameters)) {
                request += `${key}=${value}\n`;
            }

            this.socket.send(request);

            this.connect(JetcodeSocket.JOINED, (responseParams) => {
                if (responseParams.LobbyId && responseParams.MemberId) {
                    this.lobbyId = responseParams.LobbyId;
                    this.memberId = responseParams.MemberId;
                    resolve(this.lobbyId);

                } else {
                    reject(new Error("Couldn't join the lobby"));
                }
            });
        });
    }

    leaveLobby() {
        if (!this.lobbyId) {
            return;
        }

        let request = `${JetcodeSocket.LEAVE_LOBBY}\nLobbyId=${this.lobbyId}\n`;
        this.socket.send(request);

        this.lobbyId = null;
    }

    _parse(data) {
        let parsable = data.split('\n');
        let action = parsable[0];
        let value = '';
        let parameters = [];

        let nextIs = 'parameters';
        for (let i = 1; i < parsable.length; i++) {
            const line = parsable[i];

            if (line === '' && nextIs === 'parameters') {
                nextIs = 'value';

            } else if (nextIs === 'parameters') {
                const splitted = line.split('=');

                const parameter = splitted[0];
                parameters[parameter] = splitted.length > 1 ? splitted[1] : null;

            } else if (nextIs === 'value') {
                value = value + line + "\n";
            }
        }

        if (value) {
            value = value.slice(0, -1);
        }

        return [action, parameters, value];
    }
}
