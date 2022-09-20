// cấu hình server
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();
app.use(express.static('Asset'));

const server = http.createServer(app);
const io = new Server(server);
var users = [];

// server lắng nghe
server.listen(process.env.PORT || 3000,()=>{
    console.log('Server listening on port 3000');
});

app.get('/',(req, res)=>{
    res.sendFile(__dirname + '/index.html');
});

io.on('connection',(socket)=>{
    // Register
    socket.on('client-register-username',function(data){
        const listUserExists = users.find(function(item,index){
            return item.username === data;
        });
        if (listUserExists != undefined){
            socket.emit('server-send-register-fail');
        } else {
            socket.Username = data;
            var user = {
                socketid: socket.id,
                username: socket.Username
            };
            users.push(user);
            socket.emit('server-send-register-success',data);
            io.sockets.emit('server-send-list-user',users);
        }
    });

    //logout
    socket.on('logout',function(){
        users = users.filter((item,index)=>{
            return item.username !== socket.Username;
        });
        socket.broadcast.emit('server-send-list-user',users);
    });

    // typing
    socket.on('typing',function(data){
        socket.broadcast.emit('typing',data);
    });

    // stop typing
    socket.on('stop-typing',function(data){
        socket.broadcast.emit('stop-typing',data);
    });

    // chat
    socket.on('on-chat',(data)=>{
        var res = data;
        res.username = socket.Username;
        // io.emit('user-chat', res); //option 1
        io.sockets.emit('user-chat',res);
    });

    // tease
    socket.on('tease',function(data){
        io.to(data.socketid).emit('tease',socket.Username);
    });

    // socket disconnect server
    socket.on('disconnect', function() {
        users = users.filter((item,index)=>{
            return item.username !== socket.Username;
        });
        socket.broadcast.emit('server-send-list-user',users);
    });

    // chat private 
    socket.on('on-chat-private',(data)=>{
        socket.emit('user-chat-private',{ username: socket.Username, socketid: data.socketid, message: data.message});
        io.to(data.socketid).emit('user-chat-private',{ username: socket.Username, socketid: socket.id,message: data.message});
    });

    // typing private
    socket.on('typing-private',function(data){
        io.to(data.socketid).emit('typing-private',data);
    });

    // stop typing private
    socket.on('stop-typing-private',function(data){
        io.to(data.socketid).emit('stop-typing-private',data);
    });

});