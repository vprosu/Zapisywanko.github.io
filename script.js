// Global variables
let currentUser = null;
let currentCategory = '';
let messages = [];
let categories = ['Ogólne', 'Praca', 'Rozrywka', 'WYKONANE'];
let darkMode = false;
let deletedMessages = []; // For trash functionality
let unreadMessages = {}; // Track unread messages per category
let scrollInterval = null; // For continuous scrolling
let volumeLevel = 50; // Default volume level
let selectedFiles = []; // For file attachments
let inTrashMode = false; // To track if we're viewing trash
let socket = null; // Socket.IO connection
let recentActions = []; // To track recent user actions

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
const messagesContainer = document.querySelector('.messages-container');
const volumeSlider = document.getElementById('volumeSlider');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImage = document.getElementById('previewImage');
const closeModal = document.querySelector('.close-modal');
const trashBinBtn = document.getElementById('trashBinBtn');
const countdownTimer = document.getElementById('countdownTimer');
const userActivityList = document.getElementById('userActivityList');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    loadFromLocalStorage();
    renderCategories();
    renderCategoryOptions();
    
    // Set volume level from localStorage
    if (volumeSlider) {
        volumeSlider.value = volumeLevel;
        updateVolume();
        
        // Add event listener for volume changes
        volumeSlider.addEventListener('input', function() {
            volumeLevel = parseInt(this.value);
            updateVolume();
            saveToLocalStorage(); // Automatically save volume setting
        });
    }
    
    // Add event listener for image preview modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            imagePreviewModal.classList.remove('show');
            setTimeout(() => {
                imagePreviewModal.classList.add('hidden');
            }, 300);
        });
    }
    
    // Close modal when clicking outside
    if (imagePreviewModal) {
        imagePreviewModal.addEventListener('click', function(e) {
            if (e.target === imagePreviewModal) {
                imagePreviewModal.classList.remove('show');
                setTimeout(() => {
                    imagePreviewModal.classList.add('hidden');
                }, 300);
            }
        });
    }
    
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
    
    // Start countdown timer
    startCountdownTimer();
    
    // Start user activity tracking
    startUserActivityTracking();
    
    // Add page visibility tracking
    addPageVisibilityTracking();
    
    console.log('App initialized with categories:', categories);
    console.log('Current category:', currentCategory);
});

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
setNicknameBtn.addEventListener('click', setNickname);
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', function(e) {
    // Handle Enter key for sending messages (keydown is more reliable)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
fileInput.addEventListener('change', handleFileSelection);
addCategoryBtn.addEventListener('click', addCategory);
searchBtn.addEventListener('click', searchMessages);
themeToggle.addEventListener('click', toggleTheme);
logoutBtn.addEventListener('click', logout);
trashBinBtn.addEventListener('click', enterTrashMode);

// Functions
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    // Simple password check (in a real app, this would be more secure)
    if (password === '0777_') {
        // Initialize Socket.IO connection
        initializeSocket();
        
        showChatInterface();
        showNotification('Zalogowano pomyślnie!', 'success');
        playNotificationSound();
        showLoadingAnimation();
        
        // Show countdown timer after login
        if (countdownTimer) {
            countdownTimer.style.display = 'block';
        }
        
        setTimeout(() => {
            hideLoadingAnimation();
            updateUnreadIndicator();
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

function initializeSocket() {
    // In a real implementation, you would connect to your server
    // For now, we'll simulate the connection
    console.log('Initializing Socket.IO connection...');
    
    // Simulate connection success
    setTimeout(() => {
        showNotification('Połączono z serwerem!', 'success');
        playNotificationSound();
    }, 1000);
    
    // In a real app, you would have:
    /*
    socket = io(); // Connect to the server
    
    socket.on('connect', () => {
        console.log('Connected to server');
        // Notify server that user has joined
        socket.emit('user-join', { nickname: currentUser });
    });
    
    socket.on('initial-data', (data) => {
        categories = data.categories;
        messages = data.messages;
        renderCategories();
        renderCategoryOptions();
        if (currentCategory) {
            filterMessagesByCategory(currentCategory);
        }
    });
    
    socket.on('category-created', (categoryData) => {
        if (!categories.includes(categoryData.name)) {
            categories.push(categoryData.name);
            renderCategories();
            renderCategoryOptions();
            showNotification(`Użytkownik ${categoryData.creator} utworzył kategorię: ${categoryData.name}`, 'info');
            playNotificationSound();
        }
    });
    
    socket.on('new-message', (message) => {
        messages.push(message);
        if (message.category === currentCategory) {
            renderMessages();
            // Play message sound for new messages from other users
            if (message.user !== currentUser) {
                playMessageSound();
            }
        }
        updateUnreadCounts();
        renderCategories();
        updateUnreadIndicator();
        updateUserActivity();
    });
    
    socket.on('notification', (data) => {
        showNotification(data.message, data.type);
        if (data.type === 'info') {
            playNotificationSound();
        } else if (data.type === 'error') {
            playErrorSound();
        }
    });
    
    socket.on('users-update', (users) => {
        // Update user activity display
        updateUserActivityWithUsers(users);
    });
    */
}

function showChatInterface() {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Always set the first category as default if none is selected
    if (categories.length > 0 && !currentCategory) {
        currentCategory = categories[0];
    }
    
    // Render categories and show messages for current category
    renderCategories();
    if (currentCategory) {
        filterMessagesByCategory(currentCategory);
    }
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

function handleFileSelection(e) {
    selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
        showNotification(`Wybrano ${selectedFiles.length} plik(i/ów)`, 'info');
    }
}

function sendMessage() {
    const messageText = messageInput.value.trim();
    // Ensure we always have a category
    const category = currentCategory || categories[0] || 'Ogólne';
    
    if (!currentUser) {
        showNotification('Proszę najpierw ustawić nick!', 'error');
        playErrorSound();
        return;
    }
    
    // Special handling for WYKONANE category
    if (category === 'WYKONANE') {
        showGraphicsForm();
        return;
    }
    
    // Allow sending messages with either text or files
    if (messageText || selectedFiles.length > 0) {
        // Check if message is vertical (contains many newlines relative to characters)
        const isNewlineVertical = isNewlineOrientation(messageText);
        const isRotatedVertical = isRotatedOrientation(messageText);
        
        const message = {
            id: Date.now(),
            user: currentUser,
            text: messageText,
            timestamp: new Date(),
            category: category,
            files: [],
            read: true, // Sender's messages are automatically read
            vertical: isNewlineVertical || isRotatedVertical, // Mark message as vertical
            rotated: isRotatedVertical // Mark message as rotated
        };
        
        // Process selected files
        if (selectedFiles.length > 0) {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                // Create a data URL for the file to store it
                const reader = new FileReader();
                reader.onload = function(e) {
                    message.files.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result // Store the file data
                    });
                    
                    // If this is the last file, save the message
                    if (i === selectedFiles.length - 1) {
                        messages.push(message);
                        saveToLocalStorage();
                        renderMessages();
                        messageInput.value = '';
                        fileInput.value = '';
                        selectedFiles = []; // Clear selected files
                        
                        // Play message sent sound
                        playMessageSound();
                        showNotification('Wiadomość wysłana!', 'success');
                        
                        // Automatically scroll to the new message
                        setTimeout(() => {
                            messagesArea.scrollTop = messagesArea.scrollHeight;
                        }, 100);
                        
                        // Update unread counts for other users
                        updateUnreadCounts();
                        renderCategories();
                        updateUnreadIndicator();
                        
                        // Update user activity
                        updateUserActivity();
                    }
                };
                reader.readAsDataURL(file);
            }
        } else {
            // No files, just send the text message
            messages.push(message);
            saveToLocalStorage();
            renderMessages();
            messageInput.value = '';
            
            // Play message sent sound
            playMessageSound();
            showNotification('Wiadomość wysłana!', 'success');
            
            // Automatically scroll to the new message
            setTimeout(() => {
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }, 100);
            
            // Update unread counts for other users
            updateUnreadCounts();
            renderCategories();
            updateUnreadIndicator();
            
            // Update user activity
            updateUserActivity();
        }
    } else {
        showNotification('Nie można wysłać pustej wiadomości!', 'error');
        playErrorSound();
    }
}

function addCategory() {
    const categoryName = newCategoryInput.value.trim();
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        saveToLocalStorage();
        renderCategories();
        renderCategoryOptions();
        newCategoryInput.value = '';
        showNotification(`Kategoria "${categoryName}" została dodana!`, 'success');
        playNotificationSound();
        
        // Notify other users about new category (in a real app, this would go to a server)
        notifyNewCategory(categoryName);
        
        // Add to recent actions
        addRecentAction(`${currentUser} utworzył zadanie: ${categoryName}`, 'category-create');
    } else if (categories.includes(categoryName)) {
        showNotification('Kategoria o tej nazwie już istnieje!', 'error');
        playErrorSound();
    } else {
        showNotification('Proszę wprowadzić nazwę kategorii!', 'error');
        playErrorSound();
    }
}

// Function to notify about new categories (simulated)
function notifyNewCategory(categoryName) {
    // In a real implementation, this would send a message to a server
    // which would then broadcast to all connected clients
    console.log(`New category created: ${categoryName}`);
    
    // For now, we'll just update the user activity to show this action
    updateUserActivity();
}

function searchMessages() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
        const filteredMessages = messages.filter(msg => 
            msg.text && msg.text.toLowerCase().includes(searchTerm)
        );
        renderMessages(filteredMessages);
        showNotification(`Znaleziono ${filteredMessages.length} wiadomości`, 'info');
        playNotificationSound();
    } else {
        // If search term is empty, show all messages in current category
        filterMessagesByCategory(currentCategory);
    }
}

function toggleTheme() {
    darkMode = !darkMode;
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
        showNotification('Tryb ciemny włączony', 'info');
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
        showNotification('Tryb jasny włączony', 'info');
    }
    playNotificationSound();
    saveToLocalStorage();
}

function logout() {
    // Removed localStorage.removeItem('isLoggedIn');
    loginContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    document.getElementById('password').value = '';
    errorMessage.textContent = '';
    
    // Hide countdown timer on logout
    if (countdownTimer) {
        countdownTimer.style.display = 'none';
    }
    
    showNotification('Wylogowano pomyślnie!', 'success');
    playNotificationSound();
}

function deleteCategory(categoryName) {
    showConfirmationModal(
        'Usuwanie kategorii',
        `Czy na pewno chcesz usunąć kategorię "${categoryName}"? Wszystkie wiadomości w tej kategorii zostaną przeniesione do kategorii "Ogólne".`,
        () => {
            // Move all messages from this category to "Ogólne"
            messages.forEach(message => {
                if (message.category === categoryName) {
                    message.category = 'Ogólne';
                }
            });
            
            // Remove the category from the categories array
            categories = categories.filter(cat => cat !== categoryName);
            
            // If we're currently viewing the deleted category, switch to "Ogólne"
            if (currentCategory === categoryName) {
                currentCategory = 'Ogólne';
            }
            
            // Save changes and update UI
            saveToLocalStorage();
            renderCategories();
            renderCategoryOptions();
            
            // If we're viewing the category that was deleted or moved to, update the messages display
            if (currentCategory === 'Ogólne' || currentCategory === categoryName) {
                filterMessagesByCategory(currentCategory);
            }
            
            showNotification(`Kategoria "${categoryName}" została usunięta!`, 'success');
            playNotificationSound();
            
            // Add to recent actions with a more contextual message
            addRecentAction(`${currentUser} zakończył kategorię: ${categoryName}`, 'category-delete');
        }
    );
}

function renderMessages(messagesToRender = messages) {
    messagesArea.innerHTML = '';
    
    // Add trash header when in trash mode
    if (inTrashMode) {
        const trashHeader = document.createElement('div');
        trashHeader.className = 'trash-header';
        trashHeader.innerHTML = `
            <h2>🗑️ Kosz</h2>
            <button class="back-to-chat-btn" onclick="exitTrashMode()">← Wróć do czatu</button>
        `;
        messagesArea.appendChild(trashHeader);
        
        // Check if trash is empty
        if (deletedMessages.length === 0) {
            const emptyTrash = document.createElement('div');
            emptyTrash.className = 'empty-trash';
            emptyTrash.innerHTML = '<p>Kosz jest pusty</p>';
            messagesArea.appendChild(emptyTrash);
            return;
        }
    }
    
    if (messagesToRender.length === 0 && !inTrashMode) {
        messagesArea.innerHTML = '<p class="no-messages">Brak wiadomości</p>';
        return;
    }
    
    const messagesToDisplay = inTrashMode ? deletedMessages : messagesToRender;
    
    messagesToDisplay.forEach(message => {
        let messageElement = document.createElement('div');
        // Set initial classes including vertical/rotated classes
        messageElement.className = `message ${message.user === currentUser ? 'own' : ''} ${message.vertical ? 'vertical-text' : ''} ${message.rotated ? 'rotated-text' : ''}`;
        
        const date = new Date(message.timestamp);
        const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Show deletion date for trash messages
        let additionalInfo = '';
        if (inTrashMode && message.deletedAt) {
            const deleteDate = new Date(message.deletedAt);
            const deleteDateString = `${deleteDate.toLocaleDateString()} ${deleteDate.toLocaleTimeString()}`;
            additionalInfo = `<div class="deletion-info">Usunięto: ${deleteDateString}</div>`;
        }
        
        let filesHtml = '';
        if (message.files.length > 0) {
            filesHtml = '<div class="message-files">';
            message.files.forEach(file => {
                // Check if file is an image
                const isImage = file.type.startsWith('image/');
                const fileIcon = isImage ? '📷' : '📄';
                
                if (isImage) {
                    // For images, show a preview
                    filesHtml += `
                        <div class="message-file image-file">
                            <img src="${file.data}" alt="${file.name}" onclick="showImagePreview('${file.data}', '${file.name}')">
                            <div class="file-info">
                                <span class="file-icon">${fileIcon}</span>
                                <div class="file-details">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-size">(${formatFileSize(file.size)})</div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // For other files
                    filesHtml += `
                        <div class="message-file">
                            <div class="file-info">
                                <span class="file-icon">${fileIcon}</span>
                                <div class="file-details">
                                    <a href="${file.data}" download="${file.name}" class="file-name">${file.name}</a>
                                    <div class="file-size">(${formatFileSize(file.size)})</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            filesHtml += '</div>';
        }
        
        // Different actions for trash mode
        let messageActions = '';
        if (inTrashMode) {
            messageActions = `
                <div class="message-actions">
                    <button class="restore-btn" onclick="restoreMessage(${message.id})">↩️ Przywróć</button>
                    <button class="delete-permanent-btn" onclick="deleteMessagePermanently(${message.id})">❌ Usuń trwale</button>
                </div>
            `;
        } else {
            messageActions = message.user === currentUser ? `
                <div class="message-actions">
                    <button class="edit-btn" onclick="editMessage(${message.id})">✏️ Edytuj</button>
                    <button class="delete-btn" onclick="deleteMessage(${message.id})">❌ Usuń</button>
                </div>
            ` : '';
        }
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span>${message.user}</span>
                <span class="message-timestamp">${dateString}</span>
            </div>
            ${additionalInfo}
            <div class="message-content">
                ${message.text ? `<p>${escapeHtml(message.text)}</p>` : ''}
                ${filesHtml}
            </div>
            ${messageActions}
        `;
        
        // For vertical or rotated text, preserve whitespace
        if (message.vertical || message.rotated) {
            const contentElement = messageElement.querySelector('.message-content p');
            if (contentElement) {
                contentElement.style.whiteSpace = 'pre';
            }
        }
        
        messagesArea.appendChild(messageElement);
        
        // Mark message as read if it's in the current category (only for non-trash mode)
        if (!inTrashMode && message.category === currentCategory && !message.read && message.user !== currentUser) {
            message.read = true;
        }
    });
    
    
    // Always scroll to bottom when rendering messages
    setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);
    
    // Update unread counts and indicator (only for non-trash mode)
    if (!inTrashMode) {
        updateUnreadCounts();
        renderCategories();
        updateUnreadIndicator();
    }
}

function renderCategories() {
    categoriesList.innerHTML = '';
    categories.forEach(category => {
        const li = document.createElement('li');
        li.className = 'category-item';
        
        // Get unread count for this category
        const unreadCount = unreadMessages[category] || 0;
        const unreadDisplay = unreadCount > 9 ? '+9' : (unreadCount > 0 ? unreadCount : '');
        
        li.innerHTML = `
            < <span>${category}</span>
            ${unreadDisplay ? `<span class="unread-count">${unreadDisplay}</span>` : ''}
            <button class="delete-category-btn" onclick="deleteCategory('${category}')">×</button>
        `;
        
        if (unreadCount > 0) {
            li.classList.add('has-unread');
        }
        
        li.onclick = (e) => {
            if (e.target !== li.querySelector('.delete-category-btn')) {
                currentCategory = category;
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
    console.log('Filtering messages by category:', category);
    currentCategory = category;
    if (category) {
        const filteredMessages = messages.filter(msg => msg.category === category);
        renderMessages(filteredMessages);
        // Mark all messages in this category as read
        messages.forEach(msg => {
            if (msg.category === category && msg.user !== currentUser) {
                msg.read = true;
            }
        });
        saveToLocalStorage();
        updateUnreadCounts();
        renderCategories(); // Re-render categories to update active state
        updateUnreadIndicator();
    } else {
        renderMessages();
    }
}

function deleteMessage(id) {
    showConfirmationModal(
        'Usuwanie wiadomości',
        'Czy na pewno chcesz trwale usunąć tę wiadomość?',
        () => {
            const messageIndex = messages.findIndex(msg => msg.id === id && msg.user === currentUser);
            if (messageIndex !== -1) {
                // Move message to trash instead of deleting permanently
                const deletedMessage = {...messages[messageIndex]};
                deletedMessage.deletedAt = new Date(); // Add deletion timestamp
                deletedMessages.push(deletedMessage);
                messages.splice(messageIndex, 1);
                saveToLocalStorage();
                renderMessages();
                showNotification('Wiadomość przeniesiona do kosza!', 'success');
                playNotificationSound();
                
                // Add to recent actions
                addRecentAction(`${currentUser} usunął wiadomość`, 'delete');
            }
        }
    );
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
    localStorage.setItem('deletedMessages', JSON.stringify(deletedMessages));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    localStorage.setItem('volumeLevel', volumeLevel.toString()); // Save volume level
}

function loadFromLocalStorage() {
    console.log('Loading from localStorage...');
    const storedMessages = localStorage.getItem('messages');
    const storedDeletedMessages = localStorage.getItem('deletedMessages');
    const storedCategories = localStorage.getItem('categories');
    const storedDarkMode = localStorage.getItem('darkMode');
    const storedCurrentUser = localStorage.getItem('currentUser');
    const storedUnreadMessages = localStorage.getItem('unreadMessages');
    const storedVolumeLevel = localStorage.getItem('volumeLevel'); // Load volume level
    
    if (storedMessages) {
        messages = JSON.parse(storedMessages);
        // Ensure vertical and rotated properties are properly set
        messages.forEach(msg => {
            if (msg.vertical === undefined) msg.vertical = false;
            if (msg.rotated === undefined) msg.rotated = false;
        });
        console.log('Loaded messages:', messages.length);
    }
    if (storedDeletedMessages) {
        deletedMessages = JSON.parse(storedDeletedMessages);
        // Ensure vertical and rotated properties are properly set
        deletedMessages.forEach(msg => {
            if (msg.vertical === undefined) msg.vertical = false;
            if (msg.rotated === undefined) msg.rotated = false;
        });
        console.log('Loaded deleted messages:', deletedMessages.length);
    }
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
        console.log('Loaded categories:', categories);
    }
    if (storedDarkMode === 'true') {
        darkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    if (storedCurrentUser) {
        currentUser = storedCurrentUser;
        console.log('Loaded currentUser:', currentUser);
    }
    if (storedUnreadMessages) unreadMessages = JSON.parse(storedUnreadMessages);
    if (storedVolumeLevel) volumeLevel = parseInt(storedVolumeLevel); // Set volume level
    
    // Ensure we always have at least the default categories
    if (categories.length === 0) {
        categories = ['Ogólne', 'Praca', 'Rozrywka'];
    }
    
    console.log('Final categories:', categories);
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
    
    // Auto remove after 1.5 seconds (even shorter duration)
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300); // Faster removal animation
    }, 1500); // Even shorter display time (1.5 seconds instead of 3)
}

// Confirmation Modal System
function showConfirmationModal(title, message, onConfirm) {
    // Remove any existing modals
    const existingModal = document.querySelector('.confirmation-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    
    modal.innerHTML = `
        <div class="confirmation-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirmation-actions">
                <button class="confirm-btn">Potwierdź</button>
                <button class="cancel-btn">Anuluj</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const closeFn = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    };
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeFn();
    });
    
    cancelBtn.addEventListener('click', closeFn);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFn();
        }
    });
}

// Unread Messages System
function updateUnreadCounts() {
    // Reset unread counts
    unreadMessages = {};
    categories.forEach(category => {
        unreadMessages[category] = 0;
    });
    
    // Count unread messages per category (excluding current user's messages)
    messages.forEach(message => {
        if (!message.read && message.user !== currentUser) {
            if (unreadMessages[message.category] !== undefined) {
                unreadMessages[message.category]++;
            } else {
                unreadMessages[message.category] = 1;
            }
        }
    });
}

function updateUnreadIndicator() {
    // Remove existing indicator
    const existingIndicator = document.querySelector('.unread-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create new indicator if there are unread messages in current category
    if (currentCategory && unreadMessages[currentCategory] > 0) {
        const unreadCount = unreadMessages[currentCategory];
        const indicator = document.createElement('div');
        indicator.className = 'unread-indicator';
        indicator.innerHTML = `📌 Masz ${unreadCount} nieprzeczytanych wiadomości w kategorii "${currentCategory}"`;
        
        indicator.addEventListener('click', () => {
            // Scroll to bottom to see new messages
            messagesArea.scrollTop = messagesArea.scrollHeight;
            // Mark messages as read
            messages.forEach(msg => {
                if (msg.category === currentCategory && msg.user !== currentUser) {
                    msg.read = true;
                }
            });
            saveToLocalStorage();
            updateUnreadCounts();
            renderCategories();
            updateUnreadIndicator();
            showNotification('Wiadomości oznaczone jako przeczytane', 'success');
        });
        
        document.body.appendChild(indicator);
    }
}

// Volume Control System
function updateVolume() {
    const volume = volumeLevel / 100;
    notificationSound.volume = volume;
    errorSound.volume = volume;
    messageSound.volume = volume;
}

// Image Preview System
function showImagePreview(imageUrl, imageName) {
    previewImage.src = imageUrl;
    document.querySelector('.modal-caption').textContent = imageName;
    imagePreviewModal.classList.remove('hidden');
    setTimeout(() => {
        imagePreviewModal.classList.add('show');
    }, 10);
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

// Add trash mode functions
function enterTrashMode() {
    inTrashMode = true;
    renderMessages();
    showNotification('Widok kosza', 'info');
}

function exitTrashMode() {
    inTrashMode = false;
    renderMessages();
    showNotification('Wrócono do czatu', 'info');
}

function restoreMessage(id) {
    const messageIndex = deletedMessages.findIndex(msg => msg.id === id);
    if (messageIndex !== -1) {
        const restoredMessage = deletedMessages[messageIndex];
        delete restoredMessage.deletedAt; // Remove deletion timestamp
        messages.push(restoredMessage);
        deletedMessages.splice(messageIndex, 1);
        saveToLocalStorage();
        renderMessages();
        showNotification('Wiadomość przywrócona!', 'success');
        playNotificationSound();
    }
}

function deleteMessagePermanently(id) {
    showConfirmationModal(
        'Trwałe usunięcie',
        'Czy na pewno chcesz trwale usunąć tę wiadomość? Tej operacji nie można cofnąć.',
        () => {
            deletedMessages = deletedMessages.filter(msg => msg.id !== id);
            saveToLocalStorage();
            renderMessages();
            showNotification('Wiadomość trwale usunięta!', 'success');
            playNotificationSound();
        }
    );
}

// Add the editMessage function
function editMessage(id) {
    const message = messages.find(msg => msg.id === id);
    if (message && message.user === currentUser) {
        // Create a modal for editing the message
        showEditModal(message);
    }
}

// Add the showEditModal function
function showEditModal(message) {
    // Remove any existing modals
    const existingModal = document.querySelector('.edit-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    
    modal.innerHTML = `
        <div class="edit-content">
            <h3>Edytuj wiadomość</h3>
            <textarea id="editMessageText" rows="4">${escapeHtml(message.text)}</textarea>
            <div class="edit-actions">
                <button class="save-btn">Zapisz</button>
                <button class="cancel-btn">Anuluj</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    const saveBtn = modal.querySelector('.save-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const textarea = modal.querySelector('#editMessageText');
    
    const closeFn = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    };
    
    saveBtn.addEventListener('click', () => {
        const newText = textarea.value.trim();
        if (newText || message.files.length > 0) {
            // Update the message
            message.text = newText;
            message.timestamp = new Date(); // Update timestamp
            saveToLocalStorage();
            renderMessages();
            showNotification('Wiadomość zaktualizowana!', 'success');
            playNotificationSound();
            closeFn();
            
            // Add to recent actions
            addRecentAction(`${currentUser} edytował wiadomość`, 'edit');
        } else {
            showNotification('Nie można zapisać pustej wiadomości!', 'error');
            playErrorSound();
        }
    });
    
    cancelBtn.addEventListener('click', closeFn);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFn();
        }
    });
    
    // Focus the textarea
    textarea.focus();
}

// Function to get appropriate icon for action type
function getActionIcon(actionType) {
    switch (actionType) {
        case 'category':
        case 'category-create':
            return '📁';
        case 'category-delete':
            return '✅';  // Changed from 🗑️ to ✅ to indicate completion
        case 'message':
            return '💬';
        case 'delete':
            return '❌';
        case 'edit':
            return '✏️';  // Added icon for edit actions
        default:
            return '🔹';
    }
}

// Function to add recent actions
function addRecentAction(description, type) {
    const action = {
        id: Date.now(),
        description: description,
        type: type,
        timestamp: new Date(),
        user: currentUser
    };
    
    recentActions.push(action);
    
    // Update user activity display
    updateUserActivity();
    
    // Remove action after 10 seconds
    setTimeout(() => {
        recentActions = recentActions.filter(a => a.id !== action.id);
        updateUserActivity();
    }, 10000);
}

// Enhanced user activity tracking
function startUserActivityTracking() {
    // Update user activity every 30 seconds
    setInterval(updateUserActivity, 30000);
    
    // Initial update
    updateUserActivity();
}

// Add page visibility tracking
function addPageVisibilityTracking() {
    // Update user's last seen time when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && currentUser) {
            // Page is now visible, update user's last seen time
            updateCurrentUserLastSeen();
        }
    });
    
    // Also update when user interacts with the page
    document.addEventListener('mousemove', function() {
        if (currentUser) {
            updateCurrentUserLastSeen();
        }
    });
    
    document.addEventListener('keypress', function() {
        if (currentUser) {
            updateCurrentUserLastSeen();
        }
    });
    
    // Initial update when page loads
    if (currentUser) {
        updateCurrentUserLastSeen();
    }
}

// Update current user's last seen time
function updateCurrentUserLastSeen() {
    // Update the last seen time for current user in messages
    let userFound = false;
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].user === currentUser) {
            messages[i].timestamp = new Date().toISOString();
            userFound = true;
            break;
        }
    }
    
    // If user not found in messages, we'll update in the next updateUserActivity call
    if (userFound) {
        saveToLocalStorage();
        // Update the activity display
        updateUserActivity();
    }
}

// Enhanced user activity tracking
function updateUserActivity() {
    // Get unique users from messages and categories
    const users = {};
    
    // Collect users from messages
    messages.forEach(message => {
        if (!users[message.user]) {
            users[message.user] = {
                name: message.user,
                lastSeen: message.timestamp,
                messageCount: 0,
                actions: []
            };
        }
        users[message.user].messageCount++;
        
        // Update last seen to the most recent message
        if (new Date(message.timestamp) > new Date(users[message.user].lastSeen)) {
            users[message.user].lastSeen = message.timestamp;
        }
        
        // Add action
        users[message.user].actions.push({
            type: 'message',
            timestamp: message.timestamp,
            details: message.text ? message.text.substring(0, 30) + '...' : 'Wiadomość z plikiem'
        });
    });
    
    // Collect users from categories (simulate category creators)
    categories.forEach(category => {
        // For demo purposes, we'll associate categories with the current user
        // In a real app, this would come from server data
        if (currentUser && !users[currentUser]) {
            users[currentUser] = {
                name: currentUser,
                lastSeen: new Date().toISOString(),
                messageCount: 0,
                actions: []
            };
        }
        
        if (currentUser && users[currentUser]) {
            users[currentUser].actions.push({
                type: 'category',
                timestamp: new Date().toISOString(),
                details: `Utworzono zadanie: ${category}`
            });
        }
    });
    
    // Add current user if not in messages or categories (ensures user is always shown as active)
    if (currentUser && !users[currentUser]) {
        users[currentUser] = {
            name: currentUser,
            lastSeen: new Date().toISOString(), // Always show current user as recently active
            messageCount: 0,
            actions: []
        };
    }
    
    // Convert to array and sort by last seen
    const userList = Object.values(users).sort((a, b) => 
        new Date(b.lastSeen) - new Date(a.lastSeen)
    );
    
    renderUserActivity(userList);
}

function renderUserActivity(userList) {
    if (!userActivityList) return;
    
    userActivityList.innerHTML = '';
    
    userList.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-activity-item';
        
        // Check if user is currently online (last seen within last 5 minutes)
        const lastSeenDate = new Date(user.lastSeen);
        const now = new Date();
        const isOnline = (now - lastSeenDate) < (5 * 60 * 1000); // 5 minutes
        
        userElement.classList.add(isOnline ? 'online' : 'offline');
        
        // Format last seen time
        const timeDiff = Math.floor((now - lastSeenDate) / (1000 * 60)); // minutes
        let lastSeenText;
        if (timeDiff < 1) {
            lastSeenText = 'Teraz';
        } else if (timeDiff < 60) {
            lastSeenText = `${timeDiff} min temu`;
        } else {
            const hours = Math.floor(timeDiff / 60);
            lastSeenText = `${hours} godz temu`;
        }
        
        // Get recent actions (limit to 2 most recent)
        const recentActionsForUser = user.actions.slice(-2);
        let actionsHtml = '';
        
        // Add global recent actions for this user
        const userRecentActions = recentActions.filter(action => action.user === user.name);
        const allActions = [...recentActionsForUser, ...userRecentActions.map(action => ({
            type: action.type,
            timestamp: action.timestamp,
            details: action.description
        }))].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);
        
        if (allActions.length > 0) {
            actionsHtml = '<div class="recent-actions">';
            allActions.forEach(action => {
                const actionDate = new Date(action.timestamp);
                const actionTimeDiff = Math.floor((now - actionDate) / (1000 * 60));
                let actionTimeText;
                if (actionTimeDiff < 1) {
                    actionTimeText = 'teraz';
                } else if (actionTimeDiff < 60) {
                    actionTimeText = `${actionTimeDiff} min temu`;
                } else {
                    const actionHours = Math.floor(actionTimeDiff / 60);
                    actionTimeText = `${actionHours} godz temu`;
                }
                
                const actionIcon = getActionIcon(action.type);
                actionsHtml += `<div class="action-item">${actionIcon} ${action.details} <span class="action-time">(${actionTimeText})</span></div>`;
            });
            actionsHtml += '</div>';
        }
        
        userElement.innerHTML = `
            <div class="user-name">${user.name}</div>
            <div class="last-seen">${isOnline ? 'Online' : 'Ostatnio: ' + lastSeenText}</div>
            <div class="message-count">Wiadomości: ${user.messageCount}</div>
            ${actionsHtml}
        `;
        
        userActivityList.appendChild(userElement);
    });
}

// Countdown Timer Functions
function startCountdownTimer() {
    updateCountdownTimer();
    setInterval(updateCountdownTimer, 1000); // Update every second
}

function updateCountdownTimer() {
    // Target date: September 3, 2025 (03.09.2025)
    const targetDate = new Date(2025, 8, 3); // Month is 0-indexed, so 8 = September
    // Current date: October 1, 2025 (01.10.2025)
    const currentDate = new Date();
    
    // Calculate the difference in milliseconds
    const difference = targetDate - currentDate;
    
    // If the target date is in the past, show positive values (without minus sign)
    const isPast = difference < 0;
    const absDifference = Math.abs(difference);
    
    // Calculate days, hours, minutes, and seconds
    const days = Math.floor(absDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDifference % (1000 * 60)) / 1000);
    
    // Format the display without minus sign
    const display = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    // Update the countdown timer element
    if (countdownTimer) {
        countdownTimer.innerHTML = `
            <span>Odliczanie: </span>
            <span class="countdown-value">${display}</span>
        `;
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

function showGraphicsForm() {
    // Remove any existing modals
    const existingModal = document.querySelector('.graphics-form-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'graphics-form-modal';
    
    modal.innerHTML = `
        <div class="graphics-form-content">
            <h3>📝 Formularz – Kategoria wykonanej grafiki 🎨✨</h3>
            <form id="graphicsForm">
                <div class="form-group">
                    <label>1. 🖼 Tytuł grafiki:</label>
                    <input type="text" id="graphicTitle" required>
                </div>
                
                <div class="form-group">
                    <label>2. 🗓 Data wykonania:</label>
                    <input type="date" id="completionDate" required>
                </div>
                
                <div class="form-group">
                    <label>3. 🧭 Kategoria grafiki (zaznacz lub wpisz):</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="graphicCategory" value="Logo"> 🧠 Logo</label>
                        <label><input type="checkbox" name="graphicCategory" value="Plakat"> 📢 Plakat</label>
                        <label><input type="checkbox" name="graphicCategory" value="Baner internetowy"> 🌐 Baner internetowy</label>
                        <label><input type="checkbox" name="graphicCategory" value="Ilustracja"> ✍️ Ilustracja</label>
                        <label><input type="checkbox" name="graphicCategory" value="Projekt na social media"> 📱 Projekt na social media</label>
                        <label><input type="checkbox" name="graphicCategory" value="Inne"> ✨ Inne: <input type="text" id="otherCategory"></label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>4. 📝 Krótki opis grafiki:</label>
                    <textarea id="graphicDescription" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label>5. 💻 Użyty program / narzędzie:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="graphicTool" value="Photoshop"> 🅿️ Photoshop</label>
                        <label><input type="checkbox" name="graphicTool" value="GIMP"> 🌀 GIMP</label>
                        <label><input type="checkbox" name="graphicTool" value="Krita"> 🖌 Krita</label>
                        <label><input type="checkbox" name="graphicTool" value="Corel PHOTO-PAINT"> 🌿 Corel PHOTO-PAINT</label>
                        <label><input type="checkbox" name="graphicTool" value="Paint.NET"> 🧼 Paint.NET</label>
                        <label><input type="checkbox" name="graphicTool" value="Affinity Photo"> 🧠 Affinity Photo</label>
                        <label><input type="checkbox" name="graphicTool" value="Clip Studio Paint"> ✍️ Clip Studio Paint</label>
                        <label><input type="checkbox" name="graphicTool" value="MediBang Paint"> 🌈 MediBang Paint</label>
                        <label><input type="checkbox" name="graphicTool" value="Procreate"> 🪄 Procreate</label>
                        <label><input type="checkbox" name="graphicTool" value="Pixlr"> ✨ Pixlr</label>
                        <label><input type="checkbox" name="graphicTool" value="Photopea"> 🌐 Photopea</label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>6. 💬 Uwagi dodatkowe:</label>
                    <textarea id="additionalNotes" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label>7. 📎 Załącz grafikę:</label>
                    <input type="file" id="graphicFile" accept="image/*" multiple>
                    <div class="file-info" id="fileInfo"></div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Anuluj</button>
                    <button type="submit" class="submit-btn">Wyślij</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for file selection
    const fileInput = modal.querySelector('#graphicFile');
    const fileInfo = modal.querySelector('#fileInfo');
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            let fileText = `Wybrano ${this.files.length} plik(ów): `;
            for (let i = 0; i < this.files.length; i++) {
                fileText += `${this.files[i].name} (${formatFileSize(this.files[i].size)})`;
                if (i < this.files.length - 1) fileText += ', ';
            }
            fileInfo.textContent = fileText;
        } else {
            fileInfo.textContent = '';
        }
    });
    
    // Add event listeners
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    const form = modal.querySelector('#graphicsForm');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    const closeFn = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    };
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitGraphicsForm(fileInput.files);
        closeFn();
    });
    
    cancelBtn.addEventListener('click', closeFn);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFn();
        }
    });
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    modal.querySelector('#completionDate').value = today;
}

function submitGraphicsForm(selectedFiles) {
    const title = document.getElementById('graphicTitle').value;
    const date = document.getElementById('completionDate').value;
    const description = document.getElementById('graphicDescription').value;
    const notes = document.getElementById('additionalNotes').value;
    const otherCategory = document.getElementById('otherCategory').value;
    
    // Get selected categories
    const categoryCheckboxes = document.querySelectorAll('input[name="graphicCategory"]:checked');
    const categories = Array.from(categoryCheckboxes).map(cb => cb.value);
    if (otherCategory) {
        categories.push(`Inne: ${otherCategory}`);
    }
    
    // Get selected tools
    const toolCheckboxes = document.querySelectorAll('input[name="graphicTool"]:checked');
    const tools = Array.from(toolCheckboxes).map(cb => cb.value);
    
    // Format the message
    let messageText = `🎨 Wykonana grafika: ${title}\n`;
    messageText += `📅 Data wykonania: ${date}\n`;
    messageText += `หมวดหมู่: ${categories.join(', ')}\n`;
    if (description) messageText += `📋 Opis: ${description}\n`;
    if (tools.length > 0) messageText += `🛠 Narzędzia: ${tools.join(', ')}\n`;
    if (notes) messageText += `💬 Uwagi: ${notes}\n`;
    
    // Create the message object
    const message = {
        id: Date.now(),
        user: currentUser,
        text: messageText,
        timestamp: new Date(),
        category: 'WYKONANE',
        files: [],
        read: true,
        vertical: false,
        rotated: false
    };
    
    // Process selected files
    if (selectedFiles.length > 0) {
        let processedFiles = 0;
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const reader = new FileReader();
            reader.onload = function(e) {
                message.files.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                });
                
                processedFiles++;
                if (processedFiles === selectedFiles.length) {
                    messages.push(message);
                    saveToLocalStorage();
                    renderMessages();
                    messageInput.value = '';
                    fileInput.value = '';
                    
                    playMessageSound();
                    showNotification('Grafika została wysłana!', 'success');
                    
                    setTimeout(() => {
                        messagesArea.scrollTop = messagesArea.scrollHeight;
                    }, 100);
                    
                    updateUnreadCounts();
                    renderCategories();
                    updateUnreadIndicator();
                    updateUserActivity();
                }
            };
            reader.readAsDataURL(file);
        }
    } else {
        messages.push(message);
        saveToLocalStorage();
        renderMessages();
        messageInput.value = '';
        
        playMessageSound();
        showNotification('Grafika została wysłana!', 'success');
        
        setTimeout(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 100);
        
        updateUnreadCounts();
        renderCategories();
        updateUnreadIndicator();
        updateUserActivity();
    }
}

function isRotatedOrientation(text) {
    // Check if text is rotated (single characters with spaces)
    if (!text) return false;
    
    // Remove extra whitespace and split into lines
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    
    // If we have multiple lines, check if each line is mostly single characters
    if (lines.length > 1) {
        const singleCharLines = lines.filter(line => {
            const trimmedLine = line.trim();
            // Consider line as single character if it's 1-2 characters or has lots of spaces
            return trimmedLine.length <= 2 || (trimmedLine.length > 2 && 
                   (trimmedLine.split(' ').length - 1) / trimmedLine.length > 0.5);
        });
        
        // If most lines are single characters, it's likely rotated text
        return singleCharLines.length / lines.length > 0.5;
    }
    
    return false;
}

function isNewlineOrientation(text) {
    // Check if text is vertical due to excessive newlines
    if (!text) return false;
    
    const charCount = text.replace(/\s/g, '').length;
    const newlineCount = (text.match(/\n/g) || []).length;
    
    // If we have more newlines than characters, it's likely vertical
    return charCount > 0 && newlineCount > charCount * 0.5;
}
