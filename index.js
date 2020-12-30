const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const mySql = require('sync-mysql');

const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

// connecting to db
const db = new mySql({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

function getChatId(chat_id) {
    let sql = 'SELECT id FROM chats WHERE chats.chat_id=? LIMIT 1';
    let args = [chat_id];

    let res = db.query(sql, args);

    if(res.length==0) {
        return 0;
    } else {
        console.log('chatExists', res);
        console.log('chatExists', res[0].id);
        return res[0].id;
    }
}

function addChatToDb(chat) {
    let query = 'INSERT INTO chats (chat_id, first_name, last_name) VALUES (?, ?, ?)';
    let args = [
        chat.id, 
        chat.first_name, 
        chat.last_name
    ];

    let res = db.query(query, args);

    return res.insertId;
}

function insertMessage(id, content) {
    let query = 'INSERT INTO messages (chat_id, content) VALUES (?, ?)';
    let args = [
        id,
        content,
    ];

    db.query(query, args);
}

bot.on('message', msg => {
    if(msg.text=='/start') {
        bot.sendMessage(msg.chat.id, 'Welcome to ITIS support chat, if you want to message the representatives continue to write in this chat');
        return;
    }

    let chat_id = msg.chat.id;
    let content = msg.text;

    let id = getChatId(chat_id);
    if(id==0) {
        id = addChatToDb(msg.chat);
    }

    insertMessage(id, content);
});

bot.on("polling_error", (msg) => console.log(msg));