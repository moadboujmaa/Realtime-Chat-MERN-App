const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin,getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')
const PORT = 3000 || process.env.PORT

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCore bot'
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        // welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCore'))
    
        // broadcast where a user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`));

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

        

        // runs when client disconnect
        socket.on('disconnect', () => {
            const user = userLeave(socket.id)
            
            if (user) {
                io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))
            }
        })
    })



    // listen for chat message
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })
})

server.listen(PORT, () => console.log(`Server run on port ${PORT}`))