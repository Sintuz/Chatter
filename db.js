require('dotenv').config();

const mySql = require('sync-mysql');

// Connecting to db
const db = new mySql({
	host: process.env.DB_HOST,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME
});

function getChatId(chat_id) {
	// Don't redefine the table in the arguments.
	let sql = 'SELECT id FROM chats WHERE chat_id = ? LIMIT 1';
	let args = [chat_id];

	let res = db.query(sql, args);

	if (res.length == 0) {
		return 0;
	} else {
		return res[0].id;
	}
}

function getChatTelegramId(id) {
	let sql = 'SELECT chat_id FROM chats WHERE id = ? LIMIT 1';
	let args = [id];

	let res = db.query(sql, args);

	if (res.length == 0) {
		return 0;
	} else {
		return res[0].chat_id;
	}
}

function addChatToDb(chat) {
	let query = 'INSERT INTO chats (chat_id, first_name, last_name, username) VALUES (?, ?, ?, ?)';

	// Why didn't you set up "nullable" in the db?
	let args = [
		chat.id,
		chat.first_name ?? ' ',
		chat.last_name ?? ' ',
		chat.username ?? ' '
	];

	console.log(args)

	let res = db.query(query, args);

	return res.insertId;
}

function insertTelegramMessage(id, content) {
	let query = 'INSERT INTO messages (chat_id, content, from_telegram) VALUES (?, ?, true)';
	let args = [
		id,
		content,
	];

	db.query(query, args);
	
	query = 'UPDATE chats SET has_unread=true WHERE id = ? ';
	args = [
		id,
	];

	db.query(query, args);
}

function insertMessage(id, content) {
	inserting = true;
	let query = 'INSERT INTO messages (chat_id, content, from_telegram) VALUES (?, ?, false)';
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
	let query = 'SELECT chat_id, content, time, from_telegram FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?, ?';
	let args = [
		id,
		start,
		end,
	];

	return db.query(query, args);
}

function getChatStatus(id) {
	let query = 'SELECT has_unread FROM chats WHERE id = ?';
	let args = [
		id,
	];

	return db.query(query, args)[0].has_unread;
}

function viewChat(id) {
	let query = 'UPDATE chats SET has_unread=false WHERE id = ?';
	let args = [
		id,
	];

	db.query(query, args);
}

function getLastMessageTime(id) {
	let query = 'SELECT time FROM messages WHERE chat_id=? ORDER BY time DESC LIMIT 1';
	let args = [
		id,
	];

	return db.query(query, args)[0].time;
}

module.exports = {
	getChatId,
	getChatTelegramId,
	addChatToDb,
	insertTelegramMessage,
	insertMessage,
	getChats,
	getMessages,
	getChatStatus,
	viewChat,
	getLastMessageTime
};
