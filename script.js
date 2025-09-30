// Zapisywanko Chat - czat z automatycznym zapisem, powiadomieniami i dźwiękiem
const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const toastContainer = document.getElementById('toastContainer');
const notifySound = document.getElementById('notifySound');
const toggleThemeBtn = document.getElementById('toggleTheme');
const themeIcon = document.getElementById('themeIcon');

// Tryb jasny/czarny
function setTheme(dark) {
    if (dark) {
        document.body.classList.add('dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}
toggleThemeBtn.addEventListener('click', () => {
    setTheme(!document.body.classList.contains('dark'));
});
if (localStorage.getItem('theme') === 'dark') setTheme(true);

// Obsługa czatu
function getMessages() {
    return JSON.parse(localStorage.getItem('zapisywankoChat') || '[]');
}
function saveMessages(msgs) {
    localStorage.setItem('zapisywankoChat', JSON.stringify(msgs));
}

function renderMessages() {
    const msgs = getMessages();
    chatWindow.innerHTML = '';
    msgs.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.textContent = msg.text;
        chatWindow.appendChild(div);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
renderMessages();

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    notifySound.currentTime = 0;
    notifySound.play();
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 400);
    }, 2200);
}

chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    const msgs = getMessages();
    msgs.push({ text, time: Date.now() });
    saveMessages(msgs);
    renderMessages();
    showToast('Wiadomość zapisana!');
    chatInput.value = '';
});

// Usunięto menadżer plików i podwójne deklaracje zmiennych. Pozostaje tylko kod czatu.
        const info = document.createElement('div');
        info.className = 'file-info';
        if (file.type === 'text') {
            info.innerHTML = `<div class="file-name">${file.name}</div><div class="file-size">${file.content.length} znaków</div>`;
        } else if (file.type && file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = file.content;
            img.alt = file.name;
            card.appendChild(img);
            info.innerHTML = `<div class="file-name">${file.name}</div><div class="file-size">${file.size}</div>`;
        } else {
            info.innerHTML = `<div class="file-name">${file.name}</div><div class="file-size">${file.size}</div>`;
        }
        card.appendChild(info);
        const actions = document.createElement('div');
        actions.className = 'file-actions';
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Pobierz';
        downloadBtn.onclick = () => {
            if (file.type === 'text') {
                const blob = new Blob([file.content], {type: 'text/plain'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(a.href);
            } else {
                const a = document.createElement('a');
                a.href = file.content;
                a.download = file.name;
                a.click();
            }
        };
        actions.appendChild(downloadBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Usuń';
        deleteBtn.onclick = () => {
            const files = getFiles();
            files.splice(idx, 1);
            saveFiles(files);
            renderFiles();
        };
        actions.appendChild(deleteBtn);
        card.appendChild(actions);
        fileList.appendChild(card);
    });
}
renderFiles();

// Obsługa dodawania plików
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const filesArr = getFiles();
            filesArr.push({
                name: file.name,
                type: file.type,
                size: file.size ? (file.size + ' B') : '',
                content: ev.target.result
            });
            saveFiles(filesArr);
            renderFiles();
        };
        reader.readAsDataURL(file);
    });
    fileInput.value = '';
});

// Podgląd obrazów
fileInput.addEventListener('input', (e) => {
    filePreview.innerHTML = '';
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const img = document.createElement('img');
                img.src = ev.target.result;
                img.alt = file.name;
                filePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Obsługa zapisywania tekstu
saveTextBtn.addEventListener('click', () => {
    const text = textArea.value.trim();
    const name = fileNameInput.value.trim() || 'notatka.txt';
    if (!text) {
        textArea.classList.add('error');
        setTimeout(() => textArea.classList.remove('error'), 800);
        return;
    }
    const filesArr = getFiles();
    filesArr.push({
        name,
        type: 'text',
        content: text
    });
    saveFiles(filesArr);
    renderFiles();
    textArea.value = '';
    fileNameInput.value = '';
});
