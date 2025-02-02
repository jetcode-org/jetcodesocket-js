class JetcodeSocket {
    static LOBBY_LEAVE = 'ACTION_LOBBY_LEAVE';
    static RECEIVE_DATA = 'ACTION_RECEIVE_DATA';
    static LOBBY_NEW_MEMBER = 'ACTION_LOBBY_NEW_MEMBER';
    static GAME_STARTED = 'ACTION_GAME_STARTED';
    static GAME_STOPPED = 'ACTION_GAME_STOPPED';

    constructor(socketUrl = 'ws://localhost:17500') {
        this.socketUrl = socketUrl;
        this.socket = null;
    }

    connect(gameToken, lobbyId, parameters = {}) {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.socketUrl);

            this.socket.onopen = () => {
                resolve(new JetcodeSocketConnection(this.socket, gameToken, lobbyId, parameters, 200, true));
            };

            this.socket.onerror = (error) => {
                reject(error);
            };
        });
    }
}

class JetcodeSocketConnection {
    constructor(socket, gameToken, lobbyId, parameters, statusCode, successfull) {
        this.socket = socket;
        this.statusCode = statusCode;
        this.successfull = successfull;
        this._connects = {};

        this._listenSocket();
    }

    _listenSocket() {
        this.socket.onmessage = (event) => {
            const [action, parameters, name, category, value] = this._parse(event.data)

                // console.log(this._connects);

            switch (action) {
                case JetcodeSocket.GAME_STARTED:
                    this._connects[JetcodeSocket.GAME_STARTED](parameters);
                    break
                case JetcodeSocket.RECEIVE_DATA:
                    if (this._connects[JetcodeSocket.RECEIVE_DATA]) {
                        this._connects[JetcodeSocket.RECEIVE_DATA](name, value, category, parameters);
                    }
                    break
                case JetcodeSocket.LOBBY_NEW_MEMBER:
                    this._connects[JetcodeSocket.LOBBY_NEW_MEMBER](parameters);
                    break
                case JetcodeSocket.LOBBY_LEAVE:
                    this._connects[JetcodeSocket.LOBBY_LEAVE](parameters);
                    break
                case JetcodeSocket.GAME_STOPPED:
                    this._connects[JetcodeSocket.GAME_STOPPED](parameters);
                    break
            }


            // console.log("Received message: " + event.data);
            // console.log(action, parameters, name, category, value)
            // console.log(action)
        }
    }

    connect(action, callback) {
        this._connects[action] = callback;
    }

    sendData(name, value, category=null, parametrs={}) {
        let request = 'ACTION_RECEIVE_DATA\n';
        for (const [key, value] of Object.entries(parametrs)) {
            request += key + '=' + value + '\n';
        }
        request += '\n' + name + '\n' + category + '\n' + value;
        this.socket.send(request);
    }

    _parse(data) {
        let parsable = data.split('\n');
        let action = parsable[0];
        let category = '';
        let name = '';
        let value = '';
        let parameters = [];
        let nextIs = 'parametrs';
        for (let i = 1; i < parsable.length; i++) {
            const line = parsable[i];
            if (line === '' && nextIs === 'parametrs') {
                nextIs = 'name';
                continue;
            }
            if (nextIs === 'parametrs') {
                const splitted = line.split('=');
                const parametr = splitted[0];
                let paramValue = null;
                if (splitted.length > 1) {
                    paramValue = splitted[1];
                }
                parameters[parametr] = paramValue;
            } else if (nextIs === 'name') {
                name = line;
                nextIs = 'category';
            } else if (nextIs === 'category') {
                category = line;
                nextIs = 'value';
            } else if (nextIs === 'value') {
                value = value + line + "\n";
            }
        }
        return [action, parameters, name, category, value];
    }
}