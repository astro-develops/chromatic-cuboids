// import dependancies
const http = require("http");
const fs = require("fs");
const socketio = require('socket.io');
const trooter = require("./trooter");
const { genRandomToken } = trooter;

// the project tree (as the variable name would suggest)
const projectTree = {
    "/": (path, out, data) => {
        out.write(fs.readFileSync("./index.html", "utf8"));
    },
    "/API/": {
        ":ACTION": (path, out, data) => {

        },
        ":POST:": {
            
        },
        ":GET:": {
            ":ACTION": (path, out, data) => {
                out.writeHead(200, { "Content-Type": "application/json" });
            },
            
        }
    },
    "/CDN/": (path, out) => {
        let fileExt = path.split(".").reverse()[0];
        let filePath = path;
        
        if (fileExt !== "html" && fileExt !== "css" && fileExt !== "js") {
            out.setHeader("Cache-Control", "public, max-age=" + (60 * 60 * 24));
        }
        
        if (fileExt === "png") {
            filePath = "./images/" + filePath;
            out.writeHead(200, {"Content-Type": "image/png"});
        } else if (fileExt === "css") {
            filePath = "./" + filePath;
            out.writeHead(200, {"Content-Type": "text/css"});
        } else if (fileExt === "js") {
            filePath = "./" + filePath;
            out.writeHead(200, {"Content-Type": "text/javascript"});
        }

        // send file if it exists
        if (fs.existsSync(filePath)) {
            out.write(fs.readFileSync(filePath));
        } else {
            out.write("404 Not Found");
        }
    }
};

// create router
const router = new trooter.Router("non-secret-key-lol");
router.useTree(projectTree);

// create server
const httpServer = http.createServer(async (request, response) => {
    router.useRequest(request, response);
    
    let url = router.getURL();

    try {
        await router.handleRequest(url, { 
            
        });
    } catch (err) {
        console.log(err);
        response.end();
    }
    
}).listen(3000, () => {
    console.log("Server Online!");
});

// create socket
const io = socketio(httpServer, {
    cors: {
        origin: "https://chromatic-quadrilaterals-3d.vexcess.repl.co",
        methods: ["GET", "POST"]
    }
});

const sockets = new Map();
const users = new Map();
let chatHistory = [];

io.on('connection', socket => {    
    try {
        // store socket
        sockets.set(socket.id, socket);
        console.log("Socket Created: " + socket.id);

        // on join
        socket.on("join", data => {
            if (
                typeof data !== "object" || 
                typeof data.name !== "string"
            ) {
                return; // ignore invalid data
            }

            // store credentials
            socket.token = genRandomToken(16);

            // store user
            users.set(socket.token, {
                name: data.name
            });

            // send user auth token
            socket.emit("auth", {
                token: socket.token,
                timestamp: data.timestamp
            });

            // announce the new user
            socket.broadcast.emit("new-user", {
                name: data.name,
                timestamp: Date.now()
            });
        });

        // on join
        socket.on("update", data => {
            if (
                typeof data !== "object" ||
                typeof data.x !== "number" ||
                typeof data.y !== "number" ||
                typeof data.z !== "number" || 
                typeof data.token !== "string" ||
                data.token !== socket.token
            ) {
                return; // ignore invalid data
            }

            let user = users.get(d);
            user.x = x;
            user.y = y;
            user.z = z;
            users.set(socket.id, user);
        });

        // let everyone know when user has disconnected
        socket.on("disconnect", function () {
            let outgoing = {
                type: "recieve-announcement",
                data: socket.name + " has left the chat!",
                timestamp: Date.now()
            };
            socket.broadcast.emit("message", outgoing);

            // delete user and socket
            console.log("Socket Destroyed: " + socket.id);
            users.delete(socket.token)
            sockets.delete(socket.id);
        });
    } catch (err) {
        console.log(err);
    }
});

// update loop
setInterval(() => {
    // create array of users
    let usersArray = [];
    let iterator = users.entries();
    let user;
    do {
        user = iterator.next();
        if (!user.done) {
            usersArray.push(user.value[1]);
        }
    } while (!user.done);

    console.log(usersArray)

    // send users to all sockets
    iterator = sockets.entries();
    let socket;
    do {
        socket = iterator.next();
        if (!socket.done) {
            socket.value[1].emit("game-update", usersArray);
        }
    } while (!socket.done);
    
}, 1000 / 2);
