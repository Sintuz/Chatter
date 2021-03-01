require('dotenv').config();

const passport = require("passport");
const saml = require("passport-saml");

const fs = require("fs");
const path = require('path');

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});


const db = require('./db');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const app = express();
const server = app.listen(3000);
const io = require('socket.io')(server);

app.use(session({secret: 'xctg34fdtf367gsx67s32gf73d', resave: false, saveUninitialized: false}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('./public'));

const samlStrategy = new saml.Strategy(
    {
        protocol: "https://",
        host: process.env.WWW_HOST,
        path: "/login-baldini/callback",
        entryPoint: process.env.SAML_ENTRYPOINT,
        issuer: process.env.SAML_ISSUER,
        signatureAlgorithm: process.env.SAML_SIGNATURE_ALGORITHM,
        decryptionPvk: fs.readFileSync("./certs/key.pem", "utf8"),
        privateKey: fs.readFileSync("./certs/key.pem", "utf8"),
        logoutUrl: process.env.SAML_LOGOUT_URL
    },
    (profile, done) => {
        return done(null, profile);
    }
);

passport.use("samlStrategy", samlStrategy);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.get("/", ensureLoggedIn('/login-baldini'), (req, res) => {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});

app.get("/metadata", (req, res) => {
    res.type("application/xml");
    res.status(200);
    res.send(
        samlStrategy.generateServiceProviderMetadata(
            fs.readFileSync("./certs/cert.pem", "utf8"),
            fs.readFileSync("./certs/cert.pem", "utf8")
        )
    );
});

app.get("/login-baldini",
    passport.authenticate("samlStrategy", {failureRedirect: "/error", failureFlash: true}),
    (req, res) => {
        res.redirect("/");
    }
);

app.post("/login-baldini/callback",
    passport.authenticate("samlStrategy", {failureRedirect: "/error", failureFlash: true}),
    (req, res) => {
        res.redirect("/");
    }
);

app.get('/error', (req, res) => {
    res.send(req.flash('error'));
});

app.post('/get_chats', ensureLoggedIn('/login-baldini'), (req, res) => {
    let chats = db.getChats();

    chats.forEach((chat, i) => {
        chats[i].has_unread = db.getChatStatus(chat.id);
        chats[i].content = db.getMessages(chat.id, 0, 1)[0].content;
        chats[i].time = new Date(db.getLastMessageTime(chat.id));
        chats[i].visible = true;
    });

    res.send(chats);
});

app.post('/get_messages', ensureLoggedIn('/login-baldini'), (req, res) => {
    let body = req.body;
    let messages = db.getMessages(body.chat_id, parseInt(body.start), parseInt(body.end));

    messages.forEach((message, i) => {
        messages[i].time = new Date(messages[i].time);
    });

    res.send(messages);
});

function escapeMessage(message) {
    return message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/[^\A-Za-z0-9\,\.;:\! \+/\*=_@&#()-]/g, '');
}

bot.on('message', msg => {

    if (msg.text) {

        if (msg.text == '/start') {
            bot.sendMessage(msg.chat.id, 'Welcome to ITIS support chat, if you want to message the representatives continue to write in this chat');
            return;
        }

        let chat_id = msg.chat.id;
        let content = escapeMessage(msg.text);

        if (content.length > 0) {

            let id = db.getChatId(chat_id);
            if (id == 0) {
                id = db.addChatToDb(msg.chat);
                io.sockets.emit('chat', {'id': id});
            }

            db.insertTelegramMessage(id, content);
            io.sockets.emit('message', db.getMessages(id, 0, 1)[0]);

        }

    }
});

io.sockets.on('connection', (socket) => {

    socket.on('message', (data) => {
        io.sockets.emit('message', data);

        data.content = escapeMessage(data.content);

        if (data.content.length > 0) {
            db.insertMessage(data.chat_id, data.content);
            bot.sendMessage(db.getChatTelegramId(data.chat_id), data.content);
        }

    });

    socket.on('view-chat', (data) => {
        io.sockets.emit('view-chat', data);

        db.viewChat(data.chat_id);
    });
})

bot.on("polling_error", (msg) => console.log(msg));