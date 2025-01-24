const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const bcrypt = require("bcrypt")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

app.use(express.static("public"))

const users = new Map()
const rooms = new Map()
const privateRooms = new Map()

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

function createGeneralRoom() {
  if (!rooms.has("General")) {
    rooms.set("General", { name: "General", messages: [] })
  }
}

createGeneralRoom()

io.on("connection", (socket) => {
  console.log("New client connected")
  socket.join("General")
  socket.room = "General"
  updateRoomMembers("General")

  socket.on("signup", async ({ username, password }, callback) => {
    if (users.has(username)) {
      callback({ success: false, message: "Username already exists" })
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      users.set(username, hashedPassword)
      callback({ success: true })
    }
  })

  socket.on("signin", async ({ username, password }, callback) => {
    const hashedPassword = users.get(username)
    if (hashedPassword && (await bcrypt.compare(password, hashedPassword))) {
      socket.username = username
      callback({ success: true })
    } else {
      callback({ success: false, message: "Invalid username or password" })
    }
  })

  socket.on("signout", (callback) => {
    delete socket.username
    callback({ success: true })
  })

  socket.on("getRooms", (callback) => {
    const publicRooms = Array.from(rooms.values()).map((room) => ({
      name: room.name,
      isPrivate: false,
    }))

    const userPrivateRooms = Array.from(privateRooms.values())
      .filter((room) => socket.rooms.has(room.name))
      .map((room) => ({
        name: room.name,
        isPrivate: true,
        roomCode: room.roomCode,
      }))

    callback([...publicRooms, ...userPrivateRooms])
  })

  socket.on("createRoom", ({ roomName, isPrivate }, callback) => {
    if (rooms.has(roomName) || privateRooms.has(roomName)) {
      callback({ success: false, message: "Room already exists" })
    } else {
      if (isPrivate) {
        const roomCode = generateRoomCode()
        privateRooms.set(roomName, { name: roomName, roomCode, messages: [] })
        socket.join(roomName)
        io.to(socket.id).emit("roomCreated", { name: roomName, isPrivate: true, roomCode })
        callback({ success: true, roomCode })
      } else {
        rooms.set(roomName, { name: roomName, messages: [] })
        io.emit("roomCreated", { name: roomName, isPrivate: false })
        callback({ success: true })
      }
    }
  })

  socket.on("joinPrivateRoom", ({ roomCode, username }, callback) => {
    const room = Array.from(privateRooms.values()).find((r) => r.roomCode === roomCode)
    if (room) {
      socket.join(room.name)
      callback({ success: true, roomName: room.name, roomCode: room.roomCode })
    } else {
      callback({ success: false, message: "Invalid room code" })
    }
  })

  socket.on("joinRoom", ({ oldRoom, newRoom, username }, callback) => {
    if (oldRoom) {
      socket.leave(oldRoom)
      io.to(oldRoom).emit("message", {
        username: "System",
        message: `${username} has left the room.`,
        timestamp: new Date(),
      })
      updateRoomMembers(oldRoom)
    }
    socket.join(newRoom)
    socket.room = newRoom
    io.to(newRoom).emit("message", {
      username: "System",
      message: `${username} has joined the room.`,
      timestamp: new Date(),
    })
    updateRoomMembers(newRoom)

    // Send previous messages to the user
    const roomData = rooms.get(newRoom) || privateRooms.get(newRoom)
    const roomMessages = roomData ? roomData.messages : []
    const isPrivate = privateRooms.has(newRoom)
    const roomCode = isPrivate ? roomData.roomCode : null

    socket.emit("previousMessages", roomMessages)
    callback({ success: true, isPrivate, roomCode })
  })

  function updateRoomMembers(room) {
    const members = io.sockets.adapter.rooms.get(room)
    const count = members ? members.size : 0
    io.to(room).emit("roomMembersUpdate", { room, count })
  }

  socket.on("chatMessage", ({ room, message, username }) => {
    const newMessage = {
      username,
      message,
      timestamp: new Date(),
    }
    if (rooms.has(room)) {
      rooms.get(room).messages.push(newMessage)
    } else if (privateRooms.has(room)) {
      privateRooms.get(room).messages.push(newMessage)
    }
    io.to(room).emit("message", newMessage)
  })

  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("userTyping", { username, room })
  })

  socket.on("stopTyping", ({ room, username }) => {
    socket.to(room).emit("userStoppedTyping", { username, room })
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected")
    if (socket.username) {
      io.emit("message", {
        username: "System",
        message: `${socket.username} has disconnected.`,
        timestamp: new Date(),
      })
    }
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

