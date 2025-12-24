# 🚀 DevChat - Advanced Developer Social Engine (Backend)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://www.mongodb.com/)

**DevChat** is a high-performance, feature-rich social networking backend engineered specifically for developers. It powers real-time interactions, AI-driven content safety, and premium analytics for a modern professional community.

---

## 🌟 Premium Engineering Highlights

- **🤖 AI Content Moderation:** Automated safety engine that filters platform content using intelligent keyword analysis and safety protocols.
- **📈 Advanced Analytics:** Real-time profile view tracking with premium access logic, allowing users to monitor their professional reach.
- **🎤 Voice Messaging:** Integrated audio processing pipeline for real-time voice notes in private chats.
- **⚡ Real-time Architecture:** Event-driven communication powered by **Socket.io** for instant messaging, like updates, and notifications.
- **🛡️ Secure Auth System:** robust JWT-based authentication with secure cookie handling and encrypted password hashing.
- **☁️ Cloud Asset Pipeline:** Seamless image and audio management via **Cloudinary** integration.

---

## 🛠️ Tech Stack & Architecture

- **Runtime:** Node.js (Express.js Framework)
- **Database:** MongoDB (Mongoose ORM)
- **Real-time:** Socket.IO
- **Storage:** Cloudinary (Media Assets)
- **Security:** JWT, Bcrypt, CORS, Express-Validator
- **Payments:** Razorpay Integration (Premium Membership)

---

## 🧱 Key Modules & Routes

### 🔐 Authentication
- `POST /login` - Secure entry
- `POST /logout` - Graceful exit
- `POST /signup` - New user onboarding

### 📝 Content Engine
- `GET /postFeed` - Optimized feed with **Server-side Pagination**
- `POST /posts` - Create post with **AI Content Safety Check**
- `POST /posts/:postId/save` - Bookmark system

### 👁️ Analytics & Social
- `POST /profile/view/:userId` - Track engagement
- `GET /profile/analytics` - Fetch professional reach data
- `PATCH /profile/edit` - Dynamic user profile management

### 💬 Real-time Chat
- `GET /chat/:id` - Fetch history
- `POST /chat/upload-audio` - Process voice notes

---

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Muhammedkans/DevChat-new.git
   cd devChat-Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_uri
   JWT_TOKEN=your_jwt_secret
   CLOUDINARY_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **Muhammed Kans**.
