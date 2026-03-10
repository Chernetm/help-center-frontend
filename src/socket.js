// socket.js

class WSWrapper {
  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.socket = null;
    this.queue = [];
    this.isConnected = false;
    this.connect();
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("✅ WS Connected");
      this.isConnected = true;

      while (this.queue.length > 0) {
        const msg = this.queue.shift();
        this.socket.send(JSON.stringify(msg));
      }

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

    this.socket.onclose = (event) => {
      console.log(`❌ WS Closed. Code: ${event.code}, Reason: ${event.reason}. Reconnecting in 3s...`);
      this.isConnected = false;
      this.emitEvent("disconnect");
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (err) => {
      console.error("WS Protocol Error Detected:", err);
    };
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);

    if (event === "connect" && this.isConnected) callback();
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    if (!callback) {
      delete this.listeners[event];
      return;
    }
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, payload) {
    const msg = { type: event, payload };
    if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    } else {
      console.log(`📦 WS not connected, queuing message: ${event}`);
      this.queue.push(msg);
    }
  }

  emitEvent(event, payload) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(payload));
  }
}

const socket = new WSWrapper("ws://localhost:8090/ws");
// const socket = new WSWrapper("wss://help-center-backend-1.onrender.com/ws");

export default socket;











// // Native WebSocket wrapper to mimic Socket.IO interface
// class WSWrapper {
//     constructor(url) {
//         this.url = url;
//         this.listeners = {};
//         this.socket = null;
//         this.queue = []; // Buffer messages if not connected
//         this.connect();
//     }

//     connect() {
//         this.socket = new WebSocket(this.url);

//         this.socket.onopen = () => {
//             console.log("WS Connected");
//             this.emitEvent("connect");
//             // Flush queue
//             while (this.queue.length > 0) {
//                 const msg = this.queue.shift();
//                 this.socket.send(JSON.stringify(msg));
//             }
//         };

//         this.socket.onmessage = (event) => {
//             try {
//                 const data = JSON.parse(event.data);
//                 if (data.type) {
//                     this.emitEvent(data.type, data.payload);
//                 }
//             } catch (e) {
//                 console.error("WS JSON Parse Error", e);
//             }
//         };

//         this.socket.onclose = () => {
//             console.log("WS Closed. Reconnecting in 3s...");
//             this.emitEvent("disconnect");
//             setTimeout(() => this.connect(), 3000);
//         };

//         this.socket.onerror = (err) => {
//             console.error("WS Error", err);
//         };
//     }

//     on(event, callback) {
//         if (!this.listeners[event]) {
//             this.listeners[event] = [];
//         }
//         this.listeners[event].push(callback);

//         // If it's a connect listener and we're already open, fire it!
//         if (event === "connect" && this.socket && this.socket.readyState === WebSocket.OPEN) {
//             callback();
//         }
//     }

//     off(event, callback) {
//         if (!this.listeners[event]) return;
//         this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
//     }

//     emit(event, payload) {
//         const msg = { type: event, payload };
//         if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//             this.socket.send(JSON.stringify(msg));
//         } else {
//             console.log("WS not open, queuing message:", event);
//             this.queue.push(msg);
//         }
//     }

//     emitEvent(event, payload) {
//         if (this.listeners[event]) {
//             this.listeners[event].forEach(cb => cb(payload));
//         }
//     }
// }
// const socket = new WSWrapper("ws://localhost:8090/ws");
// //wss://help-center-backend-1.onrender.com/ws

// export default socket;

// socket.js

// class WSWrapper {
//     constructor(url) {
//         this.url = url;
//         this.listeners = {};
//         this.socket = null;
//         this.queue = [];
//         this.isConnected = false;
//         this.connect();
//     }

//     connect() {
//         this.socket = new WebSocket(this.url);

//         this.socket.onopen = () => {
//             console.log("✅ WS Connected");
//             this.isConnected = true;

//             this.emitEvent("connect");

//             // Flush queued messages
//             while (this.queue.length > 0) {
//                 const msg = this.queue.shift();
//                 this.socket.send(JSON.stringify(msg));
//             }
//         };

//         this.socket.onmessage = (event) => {
//             try {
//                 const data = JSON.parse(event.data);
//                 if (data.type) {
//                     this.emitEvent(data.type, data.payload);
//                 }
//             } catch (e) {
//                 console.error("WS JSON Parse Error", e);
//             }
//         };

//         this.socket.onclose = () => {
//             console.log("❌ WS Closed. Reconnecting in 3s...");
//             this.isConnected = false;
//             this.emitEvent("disconnect");

//             setTimeout(() => {
//                 this.connect();
//             }, 3000);
//         };

//         this.socket.onerror = (err) => {
//             console.error("WS Error", err);
//         };
//     }

//     on(event, callback) {
//         if (!this.listeners[event]) {
//             this.listeners[event] = [];
//         }

//         this.listeners[event].push(callback);

//         // If already connected, trigger immediately
//         if (event === "connect" && this.isConnected) {
//             callback();
//         }
//     }

//     off(event, callback) {
//         if (!this.listeners[event]) return;

//         if (!callback) {
//             delete this.listeners[event];
//             return;
//         }

//         this.listeners[event] = this.listeners[event].filter(
//             (cb) => cb !== callback
//         );
//     }

//     emit(event, payload) {
//         const msg = { type: event, payload };

//         if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
//             this.socket.send(JSON.stringify(msg));
//         } else {
//             console.log("📦 WS not open, queueing:", event);
//             this.queue.push(msg);
//         }
//     }

//     emitEvent(event, payload) {
//         if (!this.listeners[event]) return;

//         this.listeners[event].forEach((cb) => cb(payload));
//     }
// }

// const socket = new WSWrapper("ws://localhost:8090/ws");
// // const socket = new WSWrapper("wss://help-center-backend-1.onrender.com/ws");

// export default socket;