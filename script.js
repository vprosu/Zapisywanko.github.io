// Global variables
let currentUser = null;
let currentCategory = '';
let messages = [];
let categories = ['Ogólne', 'Praca', 'Rozrywka'];
let darkMode = false;

// Preload sound files
const notificationSound = new Audio('powiadomienia.mp3');
const errorSound = new Audio('error.mp3');
const messageSound = new Audio('powiadomienia.mp3'); // Using the same sound for messages

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const chatContainer = document.getElementById('chatContainer');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const nicknameInput = document.getElementById('nicknameInput');
const setNicknameBtn = document.getElementById('setNicknameBtn');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const fileInput = document.getElementById('fileInput');
const categorySelect = document.getElementById('categorySelect');
const categoriesList = document.getElementById('categoriesList');
const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const loadingAnimation = document.getElementById('loadingAnimation');
const notificationContainer = document.getElementById('notificationContainer');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    renderCategories();
    renderCategoryOptions();
    
    // Check if user is already logged in (but still require password each time)
    if (localStorage.getItem('currentUser')) {
        currentUser = localStorage.getItem('currentUser');
        nicknameInput.value = currentUser;
    }
    
    // Always show login screen - password required every time
    loginContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    
    // Preload sounds
    notificationSound.load();
    errorSound.load();
    messageSound.load();
});

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
setNicknameBtn.addEventListener('click', setNickname);
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
fileInput.addEventListener('change', handleFileUpload);
addCategoryBtn.addEventListener('click', addCategory);
searchBtn.addEventListener('click', searchMessages);
themeToggle.addEventListener('click', toggleTheme);
logoutBtn.addEventListener('click', logout);

// Functions
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    // Simple password check (in a real app, this would be more secure)
    if (password === '0777_') {
        // Removed localStorage.setItem('isLoggedIn', 'true');
        showChatInterface();
        showNotification('Zalogowano pomyślnie!', 'success');
        playNotificationSound();
        showLoadingAnimation();
        setTimeout(() => {
            hideLoadingAnimation();
        }, 1500);
    } else {
        errorMessage.textContent = 'Nieprawidłowe hasło!';
        showNotification('Błąd logowania!', 'error');
        playErrorSound();
        // Add shake animation to login box
        const loginBox = document.querySelector('.login-box');
        loginBox.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginBox.style.animation = '';
        }, 500);
    }
}

function showChatInterface() {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
}

function showLoadingAnimation() {
    loadingAnimation.classList.remove('hidden');
}

function hideLoadingAnimation() {
    loadingAnimation.classList.add('hidden');
}

function setNickname() {
    const nickname = nicknameInput.value.trim();
    if (nickname) {
        currentUser = nickname;
        localStorage.setItem('currentUser', currentUser);
        showNotification(`Nick ustawiony na: ${nickname}`, 'success');
        playNotificationSound();
    } else {
        showNotification('Proszę wprowadzić nick!', 'error');
        playErrorSound();
    }
}

function sendMessage() {
    const messageText = messageInput.value.trim();
    const category = categorySelect.value || 'Ogólne';
    
    if (!currentUser) {
        showNotification('Proszę najpierw ustawić nick!', 'error');
        playErrorSound();
        return;
    }
    
    if (messageText || fileInput.files.length > 0) {
        const message = {
            id: Date.now(),
            user: currentUser,
            text: messageText,
            timestamp: new Date(),
            category: category,
            files: []
        };
        
        // Process uploaded files
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                message.files.push({
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
            }
        }
        
        messages.push(message);
        saveToLocalStorage();
        renderMessages();
        messageInput.value = '';
        fileInput.value = '';
        
        // Play message sent sound
        playMessageSound();
        showNotification('Wiadomość wysłana!', 'success');
    }
}

function handleFileUpload() {
    // File handling is done in sendMessage function
    // This is just a placeholder event listener
}

function addCategory() {
    const categoryName = newCategoryInput.value.trim();
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        saveToLocalStorage();
        renderCategories();
        renderCategoryOptions();
        newCategoryInput.value = '';
        showNotification(`Dodano kategorię: ${categoryName}`, 'success');
        playNotificationSound();
    } else if (categories.includes(categoryName)) {
        showNotification('Ta kategoria już istnieje!', 'error');
        playErrorSound();
    } else {
        showNotification('Proszę wprowadzić nazwę kategorii!', 'error');
        playErrorSound();
    }
}

function deleteCategory(categoryName) {
    if (categories.length <= 1) {
        showNotification('Nie można usunąć ostatniej kategorii!', 'error');
        playErrorSound();
        return;
    }
    
    if (confirm(`Czy na pewno chcesz usunąć kategorię "${categoryName}"?`)) {
        categories = categories.filter(cat => cat !== categoryName);
        saveToLocalStorage();
        renderCategories();
        renderCategoryOptions();
        showNotification(`Usunięto kategorię: ${categoryName}`, 'success');
        playNotificationSound();
    }
}

function searchMessages() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        const filteredMessages = messages.filter(msg => 
            msg.text.toLowerCase().includes(searchTerm) ||
            msg.user.toLowerCase().includes(searchTerm) ||
            msg.category.toLowerCase().includes(searchTerm) ||
            msg.files.some(file => file.name.toLowerCase().includes(searchTerm))
        );
        renderMessages(filteredMessages);
        showNotification(`Znaleziono ${filteredMessages.length} wiadomości`, 'info');
    } else {
        renderMessages();
        showNotification('Wyświetlanie wszystkich wiadomości', 'info');
    }
}

function toggleTheme() {
    darkMode = !darkMode;
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
        localStorage.setItem('darkMode', 'true');
        showNotification('Tryb ciemny włączony', 'info');
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
        localStorage.setItem('darkMode', 'false');
        showNotification('Tryb jasny włączony', 'info');
    }
    playNotificationSound();
}

function logout() {
    if (confirm('Czy na pewno chcesz się wylogować?')) {
        // Removed localStorage.removeItem('isLoggedIn');
        showNotification('Wylogowano pomyślnie', 'info');
        playNotificationSound();
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

function renderMessages(messagesToShow = null) {
    const messagesToRender = messagesToShow || messages;
    messagesArea.innerHTML = '';
    
    if (messagesToRender.length === 0) {
        messagesArea.innerHTML = '<p class="no-messages">Brak wiadomości</p>';
        return;
    }
    
    messagesToRender.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.user === currentUser ? 'own' : ''}`;
        
        const date = new Date(message.timestamp);
        const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        let filesHtml = '';
        if (message.files.length > 0) {
            filesHtml = '<div class="message-files">';
            message.files.forEach(file => {
                filesHtml += `
                    <div class="message-file">
                        📎 <a href="#" onclick="downloadFile('${file.name}')">${file.name}</a>
                        <span> (${formatFileSize(file.size)})</span>
                    </div>
                `;
            });
            filesHtml += '</div>';
        }
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span>${message.user}</span>
                <span class="message-timestamp">${dateString}</span>
            </div>
            <div class="message-content">
                ${message.text ? `<p>${escapeHtml(message.text)}</p>` : ''}
                ${filesHtml}
            </div>
            ${message.user === currentUser ? `
                <div class="message-actions">
                    <button class="edit-btn" onclick="editMessage(${message.id})">Edytuj</button>
                    <button class="delete-btn" onclick="deleteMessage(${message.id})">Usuń</button>
                </div>
            ` : ''}
        `;
        
        messagesArea.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function renderCategories() {
    categoriesList.innerHTML = '';
    categories.forEach(category => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn" onclick="deleteCategory('${category}')">×</button>
        `;
        li.onclick = (e) => {
            if (e.target !== li.querySelector('.delete-category-btn')) {
                currentCategory = category;
                renderCategories();
                filterMessagesByCategory(category);
            }
        };
        if (currentCategory === category) {
            li.classList.add('active');
        }
        categoriesList.appendChild(li);
    });
}

function renderCategoryOptions() {
    categorySelect.innerHTML = '<option value="">Bez kategorii</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function filterMessagesByCategory(category) {
    if (category) {
        const filteredMessages = messages.filter(msg => msg.category === category);
        renderMessages(filteredMessages);
    } else {
        renderMessages();
    }
}

function editMessage(id) {
    const message = messages.find(msg => msg.id === id);
    if (message && message.user === currentUser) {
        const newText = prompt('Edytuj wiadomość:', message.text);
        if (newText !== null) {
            message.text = newText;
            saveToLocalStorage();
            renderMessages();
            showNotification('Wiadomość zaktualizowana!', 'success');
            playNotificationSound();
        }
    }
}

function deleteMessage(id) {
    if (confirm('Czy na pewno chcesz usunąć tę wiadomość?')) {
        messages = messages.filter(msg => msg.id !== id || msg.user !== currentUser);
        saveToLocalStorage();
        renderMessages();
        showNotification('Wiadomość usunięta!', 'success');
        playNotificationSound();
    }
}

function downloadFile(fileName) {
    showNotification(`Plik "${fileName}" został pobrany!`, 'success');
    playNotificationSound();
    // In a real implementation, this would trigger actual file download
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function saveToLocalStorage() {
    localStorage.setItem('messages', JSON.stringify(messages));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
}

function loadFromLocalStorage() {
    const storedMessages = localStorage.getItem('messages');
    const storedCategories = localStorage.getItem('categories');
    const storedDarkMode = localStorage.getItem('darkMode');
    const storedCurrentUser = localStorage.getItem('currentUser');
    
    if (storedMessages) messages = JSON.parse(storedMessages);
    if (storedCategories) categories = JSON.parse(storedCategories);
    if (storedDarkMode === 'true') {
        darkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    if (storedCurrentUser) currentUser = storedCurrentUser;
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    
    // Add icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    notification.innerHTML = `
        <span class="icon">${icon}</span>
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Sound System
function playNotificationSound() {
    // Play actual notification sound file
    try {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
        console.log('Could not play notification sound');
    }
}

function playErrorSound() {
    // Play actual error sound file
    try {
        errorSound.currentTime = 0;
        errorSound.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
        console.log('Could not play error sound');
    }
}

function playMessageSound() {
    // Play actual message sound file
    try {
        messageSound.currentTime = 0;
        messageSound.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
        console.log('Could not play message sound');
    }
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);