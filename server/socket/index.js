const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");
const UserModel = require("../models/UserModel");
const { ConversationModel, MessageModel } = require("../models/ConversationModel");
const getConversation = require("../helpers/getConversation");

const app = express();

/*** Socket server setup ***/
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// ऑनलाइन यूज़र ट्रैक करने के लिए सेट
const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("Connect User:", socket.id);

  const token = socket.handshake.auth?.token;

  try {
    // टोकन से यूज़र डिटेल लाने की कोशिश
    const user = await getUserDetailsFromToken(token);

    if (user && user._id) {
      // रूम क्रिएट करें और यूज़र को जोड़े
      socket.join(user._id.toString());
      onlineUser.add(user._id.toString());

      io.emit("onlineUser", Array.from(onlineUser));
    } else {
      console.error("⛔ टोकन से यूज़र नहीं मिला");
      socket.disconnect(); // गलत टोकन पर कनेक्शन बंद कर दें
      return;
    }

    /*** मैसेज पेज हैंडलिंग ***/
    socket.on("message-page", async (userId) => {
      console.log("UserId:", userId);
      const userDetails = await UserModel.findById(userId).select("-password");

      const payload = {
        _id: userDetails?._id,
        name: userDetails?.name,
        email: userDetails?.email,
        profile_pic: userDetails?.profile_pic,
        online: onlineUser.has(userId),
      };
      socket.emit("message-user", payload);

      // पुराने मैसेज लोड करें
      const getConversationMessage = await ConversationModel.findOne({
        $or: [
          { sender: user?._id, receiver: userId },
          { sender: userId, receiver: user?._id },
        ],
      })
        .populate("messages")
        .sort({ updatedAt: -1 });

      socket.emit("message", getConversationMessage?.messages || []);
    });

    /*** नया मैसेज हैंडलिंग ***/
    socket.on("new message", async (data) => {
      let conversation = await ConversationModel.findOne({
        $or: [
          { sender: data?.sender, receiver: data?.receiver },
          { sender: data?.receiver, receiver: data?.sender },
        ],
      });

      // अगर कन्वर्सेशन नहीं है, नई कन्वर्सेशन बनाएं
      if (!conversation) {
        const createConversation = await ConversationModel({
          sender: data?.sender,
          receiver: data?.receiver,
        });
        conversation = await createConversation.save();
      }

      const message = new MessageModel({
        text: data.text,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        msgByUserId: data?.msgByUserId,
      });
      const saveMessage = await message.save();

      await ConversationModel.updateOne(
        { _id: conversation?._id },
        { $push: { messages: saveMessage?._id } }
      );

      const getConversationMessage = await ConversationModel.findOne({
        $or: [
          { sender: data?.sender, receiver: data?.receiver },
          { sender: data?.receiver, receiver: data?.sender },
        ],
      })
        .populate("messages")
        .sort({ updatedAt: -1 });

      io.to(data?.sender).emit("message", getConversationMessage?.messages || []);
      io.to(data?.receiver).emit("message", getConversationMessage?.messages || []);

      // अपडेटेड कन्वर्सेशन भेजें
      const conversationSender = await getConversation(data?.sender);
      const conversationReceiver = await getConversation(data?.receiver);

      io.to(data?.sender).emit("conversation", conversationSender);
      io.to(data?.receiver).emit("conversation", conversationReceiver);
    });

    /*** साइडबार कन्वर्सेशन ***/
    socket.on("sidebar", async (currentUserId) => {
      console.log("Current user:", currentUserId);

      const conversation = await getConversation(currentUserId);

      socket.emit("conversation", conversation);
    });

    /*** मैसेज "Seen" हैंडलिंग ***/
    socket.on("seen", async (msgByUserId) => {
      let conversation = await ConversationModel.findOne({
        $or: [
          { sender: user?._id, receiver: msgByUserId },
          { sender: msgByUserId, receiver: user?._id },
        ],
      });

      const conversationMessageId = conversation?.messages || [];

      await MessageModel.updateMany(
        { _id: { $in: conversationMessageId }, msgByUserId: msgByUserId },
        { $set: { seen: true } }
      );

      // अपडेटेड कन्वर्सेशन भेजें
      const conversationSender = await getConversation(user?._id?.toString());
      const conversationReceiver = await getConversation(msgByUserId);

      io.to(user?._id?.toString()).emit("conversation", conversationSender);
      io.to(msgByUserId).emit("conversation", conversationReceiver);
    });

    /*** डिस्कनेक्शन हैंडलिंग ***/
    socket.on("disconnect", () => {
      onlineUser.delete(user?._id?.toString());
      console.log("🔴 Disconnect user:", socket.id);
    });

  } catch (error) {
    console.error("🚨 यूज़र डिटेल लाते समय एरर:", error.message);
    socket.disconnect();
  }
});

module.exports = {
  app,
  server,
};
