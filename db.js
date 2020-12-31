require('dotenv').config();

const mySql = require('sync-mysql');

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

function getChats() {
    let query = 'SELECT id FROM chats';

    return db.query(query);
}

function getMessages(id, start, end) {
    let query = 'SELECT content FROM messages WHERE messages.chat_id=? ORDER BY time DESC LIMIT ?, ?';
    let args = [
        id,
        start,
        end,
    ];

    return db.query(query, args);
}

function getChatStatus(id) {
    let query = 'SELECT has_unread FROM chats WHERE chats.id=? ';
    let args = [
        id
    ];

    return db.query(query, args)[0].has_unread;
}

function getLastMessageTime(id) {
    let query = 'SELECT time FROM messages WHERE messages.chat_id=? ORDER BY messages.time DESC LIMIT 1';
    let args = [
        id
    ];

    return db.query(query, args)[0].time;
}

module.exports = {
    getChatId,
    addChatToDb,
    insertMessage,
    getChats,
    getMessages,
    getChatStatus,
    getLastMessageTime
};