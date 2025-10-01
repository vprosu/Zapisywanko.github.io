// Global variables
let currentUser = null;
let currentCategory = '';
let messages = [];
let categories = ['Ogólne', 'Praca', 'Rozrywka'];
let darkMode = false;
let deletedMessages = []; // For trash functionality
let unreadMessages = {}; // Track unread messages per category
let scrollInterval = null; // For continuous scrolling
let volumeLevel = 50; // Default volume level
let selectedFiles = []; // For file attachments

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

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Ensure currentCategory is set
    if (categories.length > 0 && !currentCategory) {
        currentCategory = categories[0];
    }
});

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
setNicknameBtn.addEventListener('click', setNickname);
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    // Simplified Enter key handling
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

function showChatInterface() {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Automatically select the first category and show its messages
    if (categories.length > 0) {
        currentCategory = categories[0];
        filterMessagesByCategory(currentCategory);
        renderCategories();
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
    // Use currentCategory instead of categorySelect.value
    const category = currentCategory || 'Ogólne';
    
    if (!currentUser) {
        showNotification('Proszę najpierw ustawić nick!', 'error');
        playErrorSound();
        return;
    }
    
    // Always allow sending messages, even empty ones with files
    if (messageText || selectedFiles.length > 0) {
        const message = {
            id: Date.now(),
            user: currentUser,
            text: messageText,
            timestamp: new Date(),
            category: category,
            files: [],
            read: true // Sender's messages are automatically read
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
        }
    } else {
        // Show notification when no message can be sent
        showNotification('Nie można wysłać pustej wiadomości!', 'error');
        playErrorSound();
    }
}

function addCategory() {
    const categoryName = newCategoryInput.value.trim();
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        // Initialize unread count for new category
        unreadMessages[categoryName] = 0;
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
    
    // Show confirmation modal instead of browser confirm
    showConfirmationModal(
        'Usuwanie kategorii',
        `Czy na pewno chcesz usunąć kategorię "${categoryName}"?`,
        () => {
            categories = categories.filter(cat => cat !== categoryName);
            // Remove unread count for deleted category
            delete unreadMessages[categoryName];
            saveToLocalStorage();
            renderCategories();
            renderCategoryOptions();
            showNotification(`Usunięto kategorię: ${categoryName}`, 'success');
            playNotificationSound();
        }
    );
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
    showConfirmationModal(
        'Wylogowanie',
        'Czy na pewno chcesz się wylogować?',
        () => {
            // Removed localStorage.removeItem('isLoggedIn');
            showNotification('Wylogowano pomyślnie', 'info');
            playNotificationSound();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    );
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
                    <button class="delete-btn" onclick="deleteMessage(${message.id})">❌ Usuń</button>
                </div>
            ` : ''}
        `;
        
        messagesArea.appendChild(messageElement);
        
        // Mark message as read if it's in the current category
        if (message.category === currentCategory && !message.read && message.user !== currentUser) {
            message.read = true;
        }
    });
    
    // Always scroll to bottom when rendering messages
    setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);
    
    // Update unread counts and indicator
    updateUnreadCounts();
    renderCategories();
    updateUnreadIndicator();
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
            <span>${category}</span>
            ${unreadDisplay ? `<span class="unread-count">${unreadDisplay}</span>` : ''}
            <button class="delete-category-btn" onclick="deleteCategory('${category}')">×</button>
        `;
        
        if (unreadCount > 0) {
            li.classList.add('has-unread');
        }
        
        li.onclick = (e) => {
            if (e.target !== li.querySelector('.delete-category-btn')) {
                currentCategory = category;
                // Don't call filterMessagesByCategory here, just renderCategories
                renderCategories();
                // Filter messages after a short delay to ensure UI updates
                setTimeout(() => {
                    filterMessagesByCategory(category);
                }, 10);
            }
        };
        if (currentCategory === category) {
            li.classList.add('active');
        }
        categoriesList.appendChild(li);
    });
    
    // Automatically display messages for the current category
    if (currentCategory) {
        // Use setTimeout to ensure the UI updates first
        setTimeout(() => {
            filterMessagesByCategory(currentCategory);
        }, 10);
    }
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
        renderCategories();
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
            messages = messages.filter(msg => msg.id !== id || msg.user !== currentUser);
            saveToLocalStorage();
            renderMessages();
            showNotification('Wiadomość usunięta!', 'success');
            playNotificationSound();
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
    const storedMessages = localStorage.getItem('messages');
    const storedDeletedMessages = localStorage.getItem('deletedMessages');
    const storedCategories = localStorage.getItem('categories');
    const storedDarkMode = localStorage.getItem('darkMode');
    const storedCurrentUser = localStorage.getItem('currentUser');
    const storedUnreadMessages = localStorage.getItem('unreadMessages');
    const storedVolumeLevel = localStorage.getItem('volumeLevel'); // Load volume level
    
    if (storedMessages) messages = JSON.parse(storedMessages);
    if (storedDeletedMessages) deletedMessages = JSON.parse(storedDeletedMessages);
    if (storedCategories) categories = JSON.parse(storedCategories);
    if (storedDarkMode === 'true') {
        darkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    if (storedCurrentUser) currentUser = storedCurrentUser;
    if (storedUnreadMessages) unreadMessages = JSON.parse(storedUnreadMessages);
    if (storedVolumeLevel) volumeLevel = parseInt(storedVolumeLevel); // Set volume level
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