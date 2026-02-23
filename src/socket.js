// Native WebSocket wrapper to mimic Socket.IO interface
class WSWrapper {
    constructor(url) {
        this.url = url;
        this.listeners = {};
        this.socket = null;
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("WS Connected");
            this.emitEvent("connect");
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type) {
                    this.emitEvent(data.type, data.payload);
                }
            } catch (e) {
                console.error("WS JSON Parse Error", e);
            }
        };

        this.socket.onclose = () => {
            console.log("WS Closed. Reconnecting in 3s...");
            this.emitEvent("disconnect");
            setTimeout(() => this.connect(), 3000);
        };

        this.socket.onerror = (err) => {
            console.error("WS Error", err);
        };
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, payload) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({ type: event, payload });
            this.socket.send(msg);
        } else {
            console.warn("WS not open, cannot emit", event);
        }
    }

    emitEvent(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(payload));
        }
    }
}
const socket = new WSWrapper("wss://help-center-backend-1.onrender.com/ws");
//wss://help-center-backend-1.onrender.com/ws

export default socket;