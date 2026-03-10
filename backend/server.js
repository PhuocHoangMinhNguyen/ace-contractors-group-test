// Handling errors, outputs, and WebSocket for back-end

// Import app.js file.
const app = require("./app");
const debug = require("debug")("ace-contractors-group-test");
const http = require("http");

// To make sure that when we try to set up a port and 
// especially when we receive it through an enviroment variable,
// we make sure it is a valid number
const normalizePort = val => {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
};

// check which type of error occured and log something different 
// and exit gracefully from Node.js server.
const onError = error => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: { origin: CORS_ORIGIN }
});
app.set('io', io);

server.on("error", onError);
server.on("listening", onListening);
server.listen(port);