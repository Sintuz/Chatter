require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});


const db = require('./db');

const express = require('express');
const app = express();


app.use(express.static('./public'));

app.post('/get_chats', (req, res) => {
    let chats = db.getChats();

    chats.forEach((chat, i) => {
        chats[i].has_unread = db.getChatStatus(chat.id);
        chats[i].message = {
            content: db.getMessages(chat.id, 0, 1)[0].content,
            time: new Date(db.getLastMessageTime(chat.id))
        };
    });

    chats.sort((a,b) => (a.message.time>b.message.time)?-1:((a.message.time<b.message.time)?1:0));

    res.send(chats);
});


bot.on('message', msg => {
    if(msg.text=='/start') {
        bot.sendMessage(msg.chat.id, 'Welcome to ITIS support chat, if you want to message the representatives continue to write in this chat');
        return;
    }

    let chat_id = msg.chat.id;
    let content = msg.text;

    let id = db.getChatId(chat_id);
    if(id==0) {
        id = db.addChatToDb(msg.chat);
    }

    db.insertMessage(id, content);
});

bot.on("polling_error", (msg) => console.log(msg));

app.listen(3000);