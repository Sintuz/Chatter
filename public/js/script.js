const socket = io.connect('http://localhost:3000');
let chats;
const packet_size=20;
let start;
let selectedChat=0;

function sortByDate(obj) {
    return obj.sort((a,b) => (a.time>b.time)?-1:((a.time<b.time)?1:0));
}

function findIndexChat(id) {
    for(let i=0; i<chats.length; i++) {
        if(chats[i].id==id) {
            return i;
        }
    }
}

function updateChatList() {
    chats = sortByDate(chats);
    $('#chat-list').empty();
    for(let i=0;i<chats.length;i++) {
        if(chats[i].visible) {
            $('#chat-list').append(
                `
                <div id="chat-${chats[i].id}" index="${i}" class="chat" onclick="selectChat(this)">
                    <p class="chat-name">#${chats[i].id}</p>
                    <p id="last-message-${chats[i].id}" class="last-message">${
                        chats[i].content.length<20?chats[i].content:chats[i].content.substr(0,17)+'...'
                    }</p>
                    <span id="bullet-${chats[i].id}" class="not-read-bullet fas fa-circle"></span>
                </div>
                `
            );
            if(chats[i].has_unread) {
                $(`#bullet-${chats[i].id}`).css('visibility', 'visible');
            }
        }
    }
}

function newMessage(message) {
    let date = new Date(message.time);
    let now = new Date(Date.now());

    let time = '';

    if(date.getDay() == now.getDay() && date.getMonth() == now.getMonth() && date.getFullYear() == now.getFullYear()) {
        time = `${date.getHours()}:${date.getMinutes()}`
    } else if(date.getFullYear() == now.getFullYear()) {
        time = `${date.getDay()}-${date.getMonth()}`
    } else {
        time = `${date.getDay()}-${date.getMonth()}-${date.getFullYear()}`
    }



    return `
    <div class="message">
        <div class="baloon ${message.from_telegram?"received":"sent"}">
            <p class="message-content">${message.content}</p>
            <p class="time">${time}</p>
        </div>
    </div>
    `
}

function getNextMessages(id) {

    $.post('get_messages', 
    {
        "chat_id": id,
        "start": start,
        "end": start+packet_size-1
    }, 
    (data) => {
        let messages = data;

        messages.forEach((message) => {
            $("#chat-messages").prepend(newMessage(message));
        });
    });
}

function selectChat(self) {
    $('#chat-name').text($(self).children('.chat-name').html());
    $("#chat-messages").empty();

    selectedChat = parseInt(self.id.substring(5));

    socket.emit('view-chat', {'chat_id': selectedChat});
    
    $.post('get_messages',
    {
        "chat_id": selectedChat,
        "start": 0,
        "end": packet_size-1
    }, 
    (data) => {
        let messages = data;

        messages.forEach((message) => {
            $("#chat-messages").prepend(newMessage(message));
        });

        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
    });

    start=packet_size;

}

function updateSearchList() {
    let toSearch = $('#search-input').val();
    if(toSearch!='') {
        console.log(toSearch)
        chats.forEach((el, i) => {
            if(chats[i].id.toString().includes(toSearch)) {
                chats[i].visible = true;
            } else {
                chats[i].visible = false;
            }
        });
    } else {
        chats.forEach((el, i) => {
            chats[i].visible = true;
        });
    }

    updateSearchList();
}

function sendMessage() {
    let content = $('#message-input').val();
    if(selectedChat!=0 && content != '') {
        $('#message-input').val('');
        let message = {
            'content': content,
            'chat_id': selectedChat,
            'from_telegram': false,
            'time': new Date(),
        };
        socket.emit('message', message)
    }
}

socket.on('chat', (data) => {

    console.log(chats)
    chats.unshift({
        'id': data.id,
        'time': new Date(),
        'visible': true
    });

    console.log(chats)

});

socket.on('message', (data) => {

    let chat_i = findIndexChat(data.chat_id);

    let chat = chats.splice(chat_i, 1)[0];

    chat.content = data.content;
    chat.time = data.time;

    if(data.chat_id==selectedChat) {
        $("#chat-messages").append(newMessage(data));
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
        start++;
    } else if(data.from_telegram) {
        chat.has_unread = true;
    }

    chats.unshift(chat);

    updateChatList();

});

socket.on('view-chat', (data) => {
    let chat_i = findIndexChat(data.chat_id);

    chats[chat_i].has_unread = false;

    updateChatList();
});

$(document).ready(() => {

    //$('#search-input').on('', updateSearchList);

    $.post('/get_chats', (data) => {
        chats=data;
        updateChatList();
    });

    $('#message-input').on('keyup', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            sendMessage();
        }
    });

});