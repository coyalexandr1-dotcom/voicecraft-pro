class VoiceCraftPro {
    constructor() {
        this.selectedVoiceId = '21m00Tcm4TlvDq8ikWAM';
        this.currentAudioBlob = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCharCount();
    }
    
    setupEventListeners() {
        // Счетчик символов
        document.getElementById('textInput').addEventListener('input', () => this.updateCharCount());
        
        // Кнопки генерации и скачивания
        document.getElementById('generateBtn').addEventListener('click', () => this.generateSpeech());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadAudio());
        
        // Слайдеры настроек
        document.getElementById('stability').addEventListener('input', (e) => {
            document.getElementById('stabilityValue').textContent = e.target.value;
        });
        
        document.getElementById('similarity').addEventListener('input', (e) => {
            document.getElementById('similarityValue').textContent = e.target.value;
        });
        
        // Выбор голоса
        document.querySelectorAll('.voice-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const voiceId = e.currentTarget.dataset.voiceId;
                this.selectVoice(voiceId);
            });
        });
        
        // Фильтрация голосов
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterVoices(e.target.dataset.category));
        });
        
        // Обработчик для аудио плеера
        document.getElementById('audioPlayer').addEventListener('loadedmetadata', () => {
            this.updateAudioDuration();
        });
    }
    
    updateCharCount() {
        const textarea = document.getElementById('textInput');
        const count = textarea.value.length;
        document.getElementById('charCount').textContent = count.toLocaleString();
        
        // Подсветка при приближении к лимиту
        const charCount = document.getElementById('charCount');
        if (count > 80000) {
            charCount.style.color = '#dc3545';
        } else if (count > 50000) {
            charCount.style.color = '#ffc107';
        } else {
            charCount.style.color = '#666';
        }
    }
    
    selectVoice(voiceId) {
        this.selectedVoiceId = voiceId;
        
        // Обновляем выделение
        document.querySelectorAll('.voice-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.voiceId === voiceId);
        });
    }
    
    filterVoices(category) {
        // Обновляем активную кнопку категории
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        const voiceCards = document.querySelectorAll('.voice-card');
        
        voiceCards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                const tags = Array.from(card.querySelectorAll('.voice-tag'))
                    .map(tag => tag.textContent.toLowerCase());
                const shouldShow = tags.includes(category);
                card.style.display = shouldShow ? 'block' : 'none';
            }
        });
    }
    
    async generateSpeech() {
        const text = document.getElementById('textInput').value.trim();
        
        if (!text) {
            this.showMessage('Пожалуйста, введите текст', 'error');
            return;
        }
        
        if (text.length > 100000) {
            this.showMessage('Текст слишком длинный. Максимум 100,000 символов.', 'error');
            return;
        }
        
        this.showProgress(true);
        document.getElementById('generateBtn').disabled = true;
        
        try {
            const stability = parseFloat(document.getElementById('stability').value);
            const similarity = parseFloat(document.getElementById('similarity').value);
            
            const response = await fetch('/.netlify/functions/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voiceId: this.selectedVoiceId,
                    stability: stability,
                    similarity: similarity
                })
            });
            
            if (response.ok) {
                const audioBlob = await response.blob();
                this.currentAudioBlob = audioBlob;
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = audioUrl;
                
                // Показываем плеер
                document.getElementById('playerSection').classList.remove('hidden');
                document.getElementById('downloadBtn').disabled = false;
                
                this.showMessage('Аудио успешно сгенерировано!', 'success');
                
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка генерации речи');
            }
            
        } catch (error) {
            console.error('Generation error:', error);
            this.showMessage(`Ошибка: ${error.message}`, 'error');
            
        } finally {
            this.showProgress(false);
            document.getElementById('generateBtn').disabled = false;
        }
    }
    
    downloadAudio() {
        if (!this.currentAudioBlob) {
            this.showMessage('Сначала сгенерируйте аудио', 'error');
            return;
        }
        
        const voiceName = document.querySelector('.voice-card.selected .voice-name').textContent;
        const url = URL.createObjectURL(this.currentAudioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voicecraft-${voiceName}-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Аудио скачано!', 'success');
    }
    
    updateAudioDuration() {
        const audio = document.getElementById('audioPlayer');
        const duration = audio.duration;
        if (duration && isFinite(duration)) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            document.getElementById('duration').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    showProgress(show) {
        if (show) {
            const progressEl = document.createElement('div');
            progressEl.className = 'progress';
            progressEl.id = 'progress';
            progressEl.innerHTML = `
                <div class="progress-bar"></div>
                <span>Генерация аудио...</span>
            `;
            document.querySelector('.controls').appendChild(progressEl);
        } else {
            const progress = document.getElementById('progress');
            if (progress) {
                progress.remove();
            }
        }
    }
    
    showMessage(message, type = 'info') {
        // Удаляем предыдущие сообщения
        document.querySelectorAll('.message-toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `message-toast message-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    new VoiceCraftPro();
});