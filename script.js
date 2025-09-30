// File Manager Application
class FileManager {
    constructor() {
        this.files = JSON.parse(localStorage.getItem('savedFiles')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderFileList();
    }

    setupEventListeners() {
        // File upload
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        
        uploadBtn.addEventListener('click', () => {
            const files = fileInput.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    this.saveFile(files[i]);
                }
                fileInput.value = '';
            } else {
                alert('Wybierz plik do zapisania!');
            }
        });

        // Text save
        const saveTextBtn = document.getElementById('saveTextBtn');
        saveTextBtn.addEventListener('click', () => {
            this.saveText();
        });

        // Allow Enter key to save text
        const fileNameInput = document.getElementById('fileName');
        fileNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveText();
            }
        });
    }

    saveFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const fileData = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                date: new Date().toLocaleString()
            };
            
            this.files.push(fileData);
            this.saveToLocalStorage();
            this.renderFileList();
        };
        
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }

    saveText() {
        const textArea = document.getElementById('textArea');
        const fileNameInput = document.getElementById('fileName');
        
        const text = textArea.value.trim();
        const fileName = fileNameInput.value.trim();
        
        if (!text) {
            alert('Wpisz tekst do zapisania!');
            return;
        }
        
        if (!fileName) {
            alert('Podaj nazwę pliku!');
            return;
        }
        
        const fileData = {
            id: Date.now().toString(),
            name: `${fileName}.txt`,
            type: 'text/plain',
            size: new Blob([text]).size,
            data: text,
            date: new Date().toLocaleString()
        };
        
        this.files.push(fileData);
        this.saveToLocalStorage();
        this.renderFileList();
        
        // Clear inputs
        textArea.value = '';
        fileNameInput.value = '';
    }

    deleteFile(id) {
        if (confirm('Czy na pewno chcesz usunąć ten plik?')) {
            this.files = this.files.filter(file => file.id !== id);
            this.saveToLocalStorage();
            this.renderFileList();
        }
    }

    downloadFile(file) {
        if (file.type.startsWith('image/')) {
            // For images, create a download link
            const link = document.createElement('a');
            link.href = file.data;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // For text files, create a blob and download
            const blob = new Blob([file.data], { type: file.type });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('savedFiles', JSON.stringify(this.files));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        const noFilesMessage = document.getElementById('noFilesMessage');
        
        if (this.files.length === 0) {
            noFilesMessage.style.display = 'block';
            fileList.innerHTML = '';
            fileList.appendChild(noFilesMessage);
            return;
        }
        
        noFilesMessage.style.display = 'none';
        fileList.innerHTML = '';
        
        this.files.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            
            let filePreview = '';
            if (file.type.startsWith('image/')) {
                filePreview = `<img src="${file.data}" alt="${file.name}">`;
            } else {
                filePreview = `<div class="file-preview-text">📄 Tekstowy plik</div>`;
            }
            
            fileCard.innerHTML = `
                ${filePreview}
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)} • ${file.date}</div>
                </div>
                <div class="file-actions">
                    <button class="download-btn" onclick='fileManager.downloadFile(${JSON.stringify(file)})'>Pobierz</button>
                    <button class="delete-btn" onclick='fileManager.deleteFile("${file.id}")'>Usuń</button>
                </div>
            `;
            
            fileList.appendChild(fileCard);
        });
    }
}

// Initialize the app when the page loads
let fileManager;
document.addEventListener('DOMContentLoaded', () => {
    fileManager = new FileManager();
});
