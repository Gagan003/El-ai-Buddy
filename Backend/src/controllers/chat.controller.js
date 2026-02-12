const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');


async function createChat(req, res) {

    const { title } = req.body;
    const user = req.user;
    const chatTitle = (title && typeof title === 'string' && title.trim()) ? title.trim().slice(0, 200) : 'New Chat';

    const chat = await chatModel.create({
        user: user._id,
        title: chatTitle
    });

    res.status(201).json({
        message: "Chat created successfully",
        chat: {
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }
    });

}

async function getChats(req, res) {
    const user = req.user;
    const userId = user._id;

    const chats = await chatModel.aggregate([
        { $match: { user: userId } },
        { $lookup: { from: 'messages', localField: '_id', foreignField: 'chat', as: 'msgs' } },
        { $addFields: { messageCount: { $size: '$msgs' } } },
        { $project: { msgs: 0 } },
        { $sort: { lastActivity: -1 } }
    ]);

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats: chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            messageCount: chat.messageCount || 0,
            user: chat.user
        }))
    });
}

async function deleteAllChats(req, res) {
    const user = req.user;
    const chats = await chatModel.find({ user: user._id });
    const chatIds = chats.map(c => c._id);
    await messageModel.deleteMany({ chat: { $in: chatIds } });
    await chatModel.deleteMany({ user: user._id });
    res.status(200).json({ message: "All chats deleted successfully" });
}

async function deleteChat(req, res) {
    const { id } = req.params;
    const user = req.user;
    const chat = await chatModel.findOne({ _id: id, user: user._id });
    if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
    }
    await messageModel.deleteMany({ chat: chat._id });
    await chatModel.deleteOne({ _id: id, user: user._id });
    res.status(200).json({ message: "Chat deleted successfully" });
}

async function updateChat(req, res) {
    const { id } = req.params;
    const { title } = req.body;
    const user = req.user;
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
    }
    const chat = await chatModel.findOneAndUpdate(
        { _id: id, user: user._id },
        { $set: { title: title.trim().slice(0, 200), lastActivity: new Date() } },
        { new: true }
    );
    if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
    }
    res.status(200).json({
        message: "Chat updated successfully",
        chat: { _id: chat._id, title: chat.title, lastActivity: chat.lastActivity }
    });
}

async function getMessages(req, res) {

    const chatId = req.params.id;

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages: messages
    })

}

module.exports = {
    createChat,
    getChats,
    getMessages,
    deleteAllChats,
    deleteChat,
    updateChat
};