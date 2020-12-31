let chats;

function updateChatList() {
    $('#chat-list').empty();
    for(let i=0;i<chats.length;i++) {
        $('#chat-list').append(
            `
            <div id="chat-${chats[i].id}" class="chat" onclick="console.log(this)">
                <p class="chat-name">#${chats[i].id}</p>
                <p id="last-message-${chats[i].id}" class="last-message">${
                    chats[i].message.content.length<20?chats[i].message.content:chats[i].message.content.substr(0,17)+'...'
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

$(document).ready(() => {

    $.post('/get_chats', (data, status) => {
        chats=data;
        updateChatList();
    });

});