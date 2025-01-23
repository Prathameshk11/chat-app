const socket = io("http://localhost:3000", {
  transports: ["websocket", "polling"],
})

// DOM Elements
const welcomeSection = document.getElementById("welcome-section")
const chatSection = document.getElementById("chat-section")
const usernameInput = document.getElementById("username-input")
const passwordInput = document.getElementById("password-input")
const signinButton = document.getElementById("signin-button")
const signupButton = document.getElementById("signup-button")
const signoutButton = document.getElementById("signout-button")
const authError = document.getElementById("auth-error")
const messageContainer = document.getElementById("message-container")
const messageInput = document.getElementById("message-input")
const sendButton = document.getElementById("send-button")
const newRoomInput = document.getElementById("new-room-input")
const createRoomButton = document.getElementById("create-room-button")
const currentRoomHeader = document.getElementById("current-room")
const roomMembers = document.getElementById("room-members")
const typingIndicator = document.getElementById("typing-indicator")
const onlineUsersList = document.getElementById("online-users-list")
const toggleSidebarButton = document.getElementById("toggle-sidebar")
const sidebar = document.getElementById("sidebar")
const emojiButton = document.getElementById("emoji-button")
const boldButton = document.getElementById("bold-button")
const italicButton = document.getElementById("italic-button")
const underlineButton = document.getElementById("underline-button")
const sidebarOverlay = document.querySelector(".sidebar-overlay")
const privateRoomCodeInput = document.getElementById("private-room-code")
const joinPrivateRoomButton = document.getElementById("join-private-room-button")
const publicRoomList = document.getElementById("public-room-list")
const privateRoomList = document.getElementById("private-room-list")

let currentUsername = ""
let currentRoom = ""
let typingTimeout = null
let emojiPicker = null


// Ensure correct initial visibility
welcomeSection.classList.add("active")
chatSection.classList.add("hidden")

// Sidebar toggle
toggleSidebarButton.addEventListener("click", toggleSidebar)

// Initialize emoji picker
emojiButton.addEventListener("click", () => {
  if (!emojiPicker) {
    emojiPicker = new EmojiMart.Picker({
      onEmojiSelect: (emoji) => {
        messageInput.value += emoji.native
        messageInput.focus()
      },
    })
    document.body.appendChild(emojiPicker)
  }
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none"
})

// Click outside emoji picker to close
document.addEventListener("click", (e) => {
  if (emojiPicker && !emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.style.display = "none"
  }
})

// Formatting buttons
boldButton.addEventListener("click", () => insertFormatting("**"))
italicButton.addEventListener("click", () => insertFormatting("*"))
underlineButton.addEventListener("click", () => insertFormatting("__"))

function insertFormatting(format) {
  const start = messageInput.selectionStart
  const end = messageInput.selectionEnd
  const text = messageInput.value
  const beforeText = text.substring(0, start)
  const selectedText = text.substring(start, end)
  const afterText = text.substring(end)

  messageInput.value = beforeText + format + selectedText + format + afterText
  messageInput.focus()
  messageInput.setSelectionRange(start + format.length, end + format.length)
}

// Connection handling
socket.on("connect", () => {
  console.log("Connected to server")
})

socket.on("connect_error", (error) => {
  console.error("Connection error:", error)
  showNotification("Connection error. Trying to reconnect...", "error")
})

// Authentication handling
signinButton.addEventListener("click", () => handleAuth("signin"))
signupButton.addEventListener("click", () => handleAuth("signup"))
signoutButton.addEventListener("click", handleSignout)

function handleAuth(action) {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  if (username && password) {
    socket.emit(action, { username, password }, (response) => {
      if (response.success) {
        currentUsername = username
        welcomeSection.classList.remove("active")
        welcomeSection.classList.add("hidden")
        chatSection.classList.remove("hidden")
        chatSection.classList.add("active")
        loadRooms()
        showNotification(`Welcome, ${username}!`, "success")

        // Join the "General" room after successful authentication
        joinRoom("General")
      } else {
        authError.textContent = response.message
        showNotification(response.message, "error")
      }
    })
  }
}

function handleSignout() {
  socket.emit("signout", (response) => {
    if (response.success) {
      currentUsername = ""
      currentRoom = ""
      chatSection.classList.remove("active")
      chatSection.classList.add("hidden")
      welcomeSection.classList.remove("hidden")
      welcomeSection.classList.add("active")
      usernameInput.value = ""
      passwordInput.value = ""
      messageContainer.innerHTML = ""
      publicRoomList.innerHTML = ""
      privateRoomList.innerHTML = ""
      showNotification("You have been signed out.", "info")
    }
  })
}

// Message handling
sendButton.addEventListener("click", sendMessage)
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

messageInput.addEventListener("input", () => {
  if (currentRoom) {
    socket.emit("typing", { room: currentRoom, username: currentUsername })

    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", { room: currentRoom, username: currentUsername })
    }, 1000)
  }
})

function sendMessage() {
  const message = messageInput.value.trim()
  if (message && currentRoom) {
    socket.emit("chatMessage", { room: currentRoom, message, username: currentUsername })
    messageInput.value = ""
    socket.emit("stopTyping", { room: currentRoom, username: currentUsername })
  }
}

// Room management
createRoomButton.addEventListener("click", () => {
  const roomName = newRoomInput.value.trim()
  if (roomName) {
    const isPrivate = confirm("Do you want to make this room private?")
    socket.emit("createRoom", { roomName, isPrivate }, (response) => {
      if (response.success) {
        newRoomInput.value = ""
        if (isPrivate) {
          showNotification(`Private room "${roomName}" created! Room code: ${response.roomCode}`, "success", 10000)
          // Remove the following line to prevent duplicate addition
          // addRoomToList(roomName, true, privateRoomList, response.roomCode)
        } else {
          showNotification(`Room "${roomName}" created!`, "success")
          // Remove the following line to prevent duplicate addition
          // addRoomToList(roomName, false, publicRoomList)
        }
        joinRoom(roomName)
      } else {
        showNotification(response.message, "error")
      }
    })
  }
})

joinPrivateRoomButton.addEventListener("click", () => {
  const roomCode = privateRoomCodeInput.value.trim()
  if (roomCode) {
    socket.emit("joinPrivateRoom", { roomCode, username: currentUsername }, (response) => {
      if (response.success) {
        privateRoomCodeInput.value = ""
        addRoomToList(response.roomName, true, privateRoomList, response.roomCode)
        joinRoom(response.roomName)
      } else {
        showNotification(response.message, "error")
      }
    })
  }
})

function loadRooms() {
  socket.emit("getRooms", (rooms) => {
    updateRoomList(rooms)
  })
}

function updateRoomList(rooms) {
  publicRoomList.innerHTML = ""
  privateRoomList.innerHTML = ""

  // Always add the General room first
  addRoomToList("General", false, publicRoomList)

  rooms.forEach((room) => {
    if (room.isPrivate) {
      addRoomToList(room.name, true, privateRoomList, room.roomCode)
    } else if (room.name !== "General") {
      addRoomToList(room.name, false, publicRoomList)
    }
  })
}

function addRoomToList(roomName, isPrivate, listElement, roomCode) {
  const li = document.createElement("li")
  li.className = "room-item"
  li.setAttribute("data-room-name", roomName)
  if (roomName === currentRoom) li.classList.add("active")

  const roomInfo = document.createElement("div")
  roomInfo.className = "room-info"
  roomInfo.textContent = roomName

  const memberCount = document.createElement("span")
  memberCount.className = "member-count"
  memberCount.id = `room-${roomName}-count`
  memberCount.textContent = "0"

  li.appendChild(roomInfo)
  li.appendChild(memberCount)
  li.addEventListener("click", () => joinRoom(roomName))

  if (isPrivate && roomCode) {
    const codeSpan = document.createElement("span")
    codeSpan.className = "room-code"
    codeSpan.textContent = `Code: ${roomCode}`
    li.appendChild(codeSpan)
  }

  listElement.appendChild(li)
}

function joinRoom(room) {
  socket.emit("joinRoom", { oldRoom: currentRoom, newRoom: room, username: currentUsername }, (response) => {
    if (response.success) {
      currentRoom = room
      currentRoomHeader.textContent = room
      if (response.isPrivate && response.roomCode) {
        currentRoomHeader.textContent += ` (Code: ${response.roomCode})`
      }
      messageContainer.innerHTML = ""
      document.querySelectorAll(".room-item").forEach((item) => {
        item.classList.remove("active")
        if (item.querySelector(".room-info").textContent === room) {
          item.classList.add("active")
        }
      })
      toggleSidebar() // Close sidebar after joining a room
      showNotification(`Joined room: ${room}`, "success")
      scrollToBottom()
    }
  })
}

// Message display
socket.on("message", (data) => {
  displayMessage(data)
})

socket.on("previousMessages", (messages) => {
  messageContainer.innerHTML = ""
  messages.forEach((message) => {
    displayMessage(message)
  })
  scrollToBottom()
})

function displayMessage(data) {
  const messageElement = document.createElement("div")
  messageElement.className = `message ${data.username === currentUsername ? "own" : "other"}`

  const messageHeader = document.createElement("div")
  messageHeader.className = "message-header"

  const usernameSpan = document.createElement("span")
  usernameSpan.className = "username"
  usernameSpan.textContent = data.username

  const timestampSpan = document.createElement("span")
  timestampSpan.className = "timestamp"
  timestampSpan.textContent = new Date(data.timestamp).toLocaleTimeString()

  const contentDiv = document.createElement("div")
  contentDiv.className = "message-content"
  contentDiv.innerHTML = formatMessage(data.message)

  messageHeader.appendChild(usernameSpan)
  messageHeader.appendChild(timestampSpan)
  messageElement.appendChild(messageHeader)
  messageElement.appendChild(contentDiv)

  messageContainer.appendChild(messageElement)
  scrollToBottom()
}

// Typing indicators
socket.on("userTyping", ({ username, room }) => {
  if (room === currentRoom && username !== currentUsername) {
    typingIndicator.textContent = `${username} is typing...`
  }
})

socket.on("userStoppedTyping", ({ username, room }) => {
  if (room === currentRoom && username !== currentUsername) {
    typingIndicator.textContent = ""
  }
})

// Room updates
socket.on("roomMembersUpdate", ({ room, count }) => {
  const countElement = document.getElementById(`room-${room}-count`)
  if (countElement) {
    countElement.textContent = count
  }
  if (room === currentRoom) {
    roomMembers.textContent = `${count} members`
  }
})

// Online users
socket.on("onlineUsers", (users) => {
  onlineUsersList.innerHTML = ""
  users.forEach((user) => {
    const userBadge = document.createElement("div")
    userBadge.className = "user-badge"
    userBadge.textContent = user
    onlineUsersList.appendChild(userBadge)
  })
})

// Real-time room updates
socket.on("roomCreated", (room) => {
  const listElement = room.isPrivate ? privateRoomList : publicRoomList
  // Check if the room already exists in the list before adding it
  if (!document.querySelector(`#${listElement.id} .room-item[data-room-name="${room.name}"]`)) {
    addRoomToList(room.name, room.isPrivate, listElement, room.roomCode)
  }
})

// Utility functions
function formatMessage(message) {
  return message
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
    .replace(/(^|\s)(#[a-zA-Z\d]+)/g, '$1<span class="hashtag">$2</span>')
    .replace(/\n/g, "<br>")
}

function showNotification(message, type = "info", duration = 3000) {
  const notification = document.getElementById("notification")
  notification.textContent = message
  notification.className = `notification ${type}`
  notification.style.display = "block"

  setTimeout(() => {
    notification.style.display = "none"
  }, duration)
}

function scrollToBottom() {
  messageContainer.scrollTop = messageContainer.scrollHeight
}

// Handle user disconnect
window.addEventListener("beforeunload", () => {
  socket.emit("userDisconnecting", { username: currentUsername, room: currentRoom })
})

// Initial focus on username input
usernameInput.focus()

function toggleSidebar() {
  sidebar.classList.toggle("active")
  chatSection.classList.toggle("sidebar-open")
  if (window.innerWidth <= 768) {
    sidebarOverlay.style.display = sidebar.classList.contains("active") ? "block" : "none"
  }
}

const closeSidebarButton = document.createElement("button")
closeSidebarButton.id = "close-sidebar"
closeSidebarButton.innerHTML = "&times;"
closeSidebarButton.addEventListener("click", (e) => {
  e.stopPropagation()
  toggleSidebar()
})
sidebar.insertBefore(closeSidebarButton, sidebar.firstChild)

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    sidebar.classList.remove("active")
    chatSection.classList.remove("sidebar-open")
    sidebarOverlay.style.display = "none"
  }
})

sidebarOverlay.addEventListener("click", toggleSidebar)

