# Chat Application 🚀

Live Demo: [**Chat App on Render**](https://chat-app-986h.onrender.com) 🌐

---

## **Overview**
This is a real-time chat application built using **HTML**, **CSS**, and **JavaScript**. The project provides an intuitive and responsive platform for users to create and join chat rooms, exchange messages, and communicate in real-time. The application leverages **WebSockets** for instant communication and ensures a secure, user-friendly chat experience.

---

## **Features**

### **User Interface**
- Clean and visually appealing UI designed with HTML and CSS.
- Responsive layout optimized for all devices and screen sizes.
- Chat room interface includes:
  - Dynamic list of available rooms.
  - Real-time message display.
  - Message input field with formatting support.

### **Real-Time Communication**
- Powered by **JavaScript** and **WebSockets** for seamless updates.
- Join chat rooms and send messages instantly without page reloads.

### **User Authentication**
- Username and password input fields for sign-in/sign-up.
- Prevents impersonation or duplicate usernames in the same room.

### **Room Management**
- **General Room:** Public and accessible to all users by default.
- **Private Rooms:** Secure rooms that require a unique code for access.
- Easily create new public or private rooms.
- Dynamic display and updating of room information.

### **Chat Functionality**
- Real-time text message sending with sender's name and timestamps.
- Basic text formatting (bold, italics, links) in messages.
- Notifications for new messages in active rooms.

### **Enhanced User Experience**
- Smooth scrolling for chat messages.
- Error messages for edge cases:
  - Sending an empty message.
  - Attempting to join a room without inputting details.

### **Security**
- Basic validation for username/password input.
- Duplicate prevention for usernames within the same room.

---

## **Known Issues**
### **Welcome Page User Behavior**
On the welcome page, users are expected to input a **username** and **password**, then click "Sign Up" to register. However:
- Users often expect the "Sign Up" button to redirect them to a dedicated sign-up page instead of registering directly.  
This is a UI issue caused by the static HTML structure and needs improvement to provide better user flow.

---

## **Technology Stack**
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
- **Backend:** Node.js with Express for server setup.
- **Real-Time Communication:** WebSocket (via `socket.io`).

---

## **Getting Started**

### **Prerequisites**
Ensure the following are installed on your system:
- **Node.js** (to run the WebSocket server).
- A modern web browser (to access and test the application).

### **Setup**

1. Clone this repository:
   ```bash
   git clone https://github.com/Prathameshk11/chat-app.git
   cd chat-application
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Access the app:
   Open your browser and navigate to `http://localhost:3000` or the deployed link: [https://chat-app-986h.onrender.com](https://chat-app-986h.onrender.com).

---

## **Usage**
1. Enter a unique **username** and **password** on the welcome page.
2. Click **Sign Up** to register or **Sign In** to log into an existing account.
3. Join the **General Room** or create a new public/private room:
   - **Public Room:** Accessible to all users.
   - **Private Room:** Join by entering the unique room code.

4. Start chatting in real-time!

---

