const groupList = document.getElementById('group-list');
const messageList = document.getElementById('message-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const currentGroupName = document.getElementById('current-group-name');
const groupSidebar = document.getElementById('group-sidebar');
const logoutbtn = document.getElementById('logout');

const token = localStorage.getItem('token');
logoutbtn.addEventListener('click',()=>{
    localStorage.removeItem('token')
    return window.location.href = '/login.html'
})
if (!token) {
    window.location.href = '/login.html';
}

const socket = io({
    auth: {
        token
    }
});

let currentGroupId = null;

// Fetch groups and display them
async function fetchAndDisplayGroups() {
    try {
        const response = await fetch('/api/groups', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }
        const groups = await response.json();
        groupList.innerHTML = '';
        groups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.dataset.groupId = group._id;
            li.classList.add('cursor-pointer', 'p-2', 'hover:bg-gray-700', 'rounded');
            li.addEventListener('click', () => {
                currentGroupId = group._id;
                currentGroupName.textContent = group.name;
                fetchAndDisplayMessages(group._id);
            });
            groupList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
}

// Fetch messages for a group and display them
async function fetchAndDisplayMessages(groupId) {
    try {
        const response = await fetch(`/api/chats/${groupId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        const messages = await response.json();
        messageList.innerHTML = '';
        messages.forEach(message => {
            appendMessage(message);
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Append a message to the message list
function appendMessage(message) {
    const item = document.createElement('div');
    item.classList.add('mb-2');
    item.innerHTML = `<p><span class="font-bold">${message.sender.username}</span>: ${message.content}</p>`;
    messageList.appendChild(item);
    messageList.scrollTop = messageList.scrollHeight;
}

// Handle message form submission
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content || !currentGroupId) {
        return;
    }
    try {
        const response = await fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, group_id: currentGroupId })
        });
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        const message = await response.json();
        // The message will be received via socket and appended
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

// Socket.io event listeners
socket.on('connect', () => {
    console.log('Connected to socket server');
});

socket.on('hello', (arg) => {
    console.log(arg);
});

// Listen for new messages
socket.on('newMessage', (message) => {
    if (message.group === currentGroupId) {
        appendMessage(message);
    }
});


fetchAndDisplayGroups();
