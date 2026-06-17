document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('char-count');
    const presetSelect = document.getElementById('preset-select');
    const presetDesc = document.getElementById('preset-desc');
    const speakerSelect = document.getElementById('speaker-select');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.spinner');
    
    const audioElement = document.getElementById('audio-element');
    const visualizer = document.querySelector('.visualizer-container');
    const downloadBtn = document.getElementById('download-btn');
    
    const metricTime = document.getElementById('metric-time');
    const metricDuration = document.getElementById('metric-duration');
    const metricRtf = document.getElementById('metric-rtf');
    const metricExp = document.getElementById('metric-exp');

    // History Panel DOM Elements
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyEmpty = document.getElementById('history-empty');
    const historyList = document.getElementById('history-list');

    // Session Memory Storage (resets on tab reload/close)
    const generationHistory = [];

    // Preset Options Configuration
    const PRESETS = {
        custom: {
            name: "Custom Settings (Manual)",
            description: "Manually adjust the speaker and speed controls below.",
            speaker: null,
            speed: null
        },
        reporter: {
            name: "📰 Classic News Anchor",
            description: "Fast-paced, formal, and authoritative British voice designed for news reports and bulletins.",
            speaker: "bf_medium",
            speed: 1.15
        },
        storyteller: {
            name: "📖 Late Night Narrator",
            description: "A warm, comforting, and slow-paced American voice ideal for audiobooks, stories, and readings.",
            speaker: "af_sarah",
            speed: 0.85
        },
        entertainer: {
            name: "🔥 Energetic Video Host",
            description: "Lively, expressive, and bright American voice for YouTube videos, ads, and entertainment content.",
            speaker: "af_sky",
            speed: 1.1
        },
        instructor: {
            name: "🎓 Calm E-Learning Guide",
            description: "A steady, composed, and clear American voice optimized for tutorials, lectures, and guides.",
            speaker: "af_bella",
            speed: 0.95
        },
        podcaster: {
            name: "🎙️ Quick-Fire Chat Host",
            description: "A friendly, modern, and rapid British voice with a casual and engaging podcasting tone.",
            speaker: "bf_lily",
            speed: 1.2
        },
        ASMR: {
            name: "🧘 Soft Meditation Teacher",
            description: "A very slow, gentle, and relaxing American tone suitable for relaxation, ASMR, and breathing exercises.",
            speaker: "af_nicole",
            speed: 0.8
        }
    };

    // Update character counter
    function updateCharCount() {
        charCount.textContent = textInput.value.length;
    }
    textInput.addEventListener('input', updateCharCount);
    updateCharCount(); // Initial count

    // Update speed slider display
    speedSlider.addEventListener('input', () => {
        speedVal.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
    });

    // Populate Speakers
    async function loadSpeakers() {
        try {
            const res = await fetch('/api/speakers');
            if (!res.ok) throw new Error("Failed to load speakers list");
            const speakers = await res.json();
            
            speakerSelect.innerHTML = speakers.map(sp => 
                `<option value="${sp.id}">${sp.name}</option>`
            ).join('');
        } catch (err) {
            console.error(err);
            speakerSelect.innerHTML = '<option value="af">American Female (af)</option>';
        }
    }

    // Initialize Presets List
    function initPresets() {
        // Clear options except Custom
        presetSelect.innerHTML = '<option value="custom">Custom (Manual Controls)</option>';
        
        // Add options
        for (const [key, preset] of Object.entries(PRESETS)) {
            if (key === 'custom') continue;
            presetSelect.innerHTML += `<option value="${key}">${preset.name}</option>`;
        }
        
        // Listen for preset change
        presetSelect.addEventListener('change', () => {
            const key = presetSelect.value;
            const preset = PRESETS[key];
            
            presetDesc.textContent = preset.description;
            
            if (key !== 'custom') {
                speakerSelect.value = preset.speaker;
                speedSlider.value = preset.speed;
                speedVal.textContent = `${parseFloat(preset.speed).toFixed(1)}x`;
            }
        });

        // Break preset lock if controls are edited manually
        function setCustomPreset() {
            if (presetSelect.value !== 'custom') {
                presetSelect.value = 'custom';
                presetDesc.textContent = PRESETS.custom.description;
            }
        }

        speakerSelect.addEventListener('change', setCustomPreset);
        speedSlider.addEventListener('input', setCustomPreset);
        
        // Default to Custom description initially
        presetDesc.textContent = PRESETS.custom.description;
    }

    // Render history card nodes in container
    function updateHistoryUI() {
        if (generationHistory.length === 0) {
            historyEmpty.classList.remove('hidden');
            historyList.classList.add('hidden');
        } else {
            historyEmpty.classList.add('hidden');
            historyList.classList.remove('hidden');
            
            historyList.innerHTML = generationHistory.map(item => `
                <div class="history-item">
                    <div class="history-text-col">
                        <span class="history-timestamp">🕒 ${item.timestamp}</span>
                        <p class="history-text-snippet" title="${item.textSnippet}">${item.textSnippet}</p>
                    </div>
                    <div class="history-meta-col">
                        <div class="history-meta-tags">
                            <span class="history-tag tag-preset">${item.presetName}</span>
                            <span class="history-tag tag-speaker">👤 ${item.speakerName}</span>
                            <span class="history-tag tag-speed">⚡ ${item.speed}</span>
                        </div>
                        <div class="history-metrics-summary">
                            Duration: <strong>${item.duration}s</strong> | Generation: <strong>${item.time_taken}s</strong> | RTF: <strong>${item.rtf}x</strong>
                        </div>
                    </div>
                    <div class="history-audio-col">
                        <audio controls src="${item.url}" class="custom-audio"></audio>
                    </div>
                </div>
            `).join('');
        }
    }

    // Initialize Clear History button trigger
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your generation history for this session?')) {
            generationHistory.length = 0;
            updateHistoryUI();
        }
    });

    // Initialize Application flow
    async function initializeApp() {
        await loadSpeakers();
        initPresets();
        updateHistoryUI();
    }
    initializeApp();

    // Visualizer animation triggers
    audioElement.addEventListener('play', () => {
        visualizer.classList.add('playing');
    });

    audioElement.addEventListener('pause', () => {
        visualizer.classList.remove('playing');
    });

    audioElement.addEventListener('ended', () => {
        visualizer.classList.remove('playing');
    });

    // Generate Audio Form Submission
    generateBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        const speaker = speakerSelect.value;
        const speed = parseFloat(speedSlider.value);

        if (!text) {
            alert('Please enter some text to synthesize.');
            return;
        }

        // Set UI loading state
        generateBtn.disabled = true;
        btnText.textContent = 'Synthesizing...';
        spinner.classList.remove('hidden');
        visualizer.classList.remove('playing');
        
        // Reset player & download
        audioElement.pause();
        audioElement.src = '';
        downloadBtn.href = '#';
        downloadBtn.classList.add('disabled');

        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, speaker, speed })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to synthesize speech');
            }

            const data = await res.json();

            // Set audio URL with timestamp query parameter to bypass browser audio caching
            const audioUrl = `${data.url}?t=${Date.now()}`;
            audioElement.src = audioUrl;
            
            // Set download button
            downloadBtn.href = data.url;
            downloadBtn.classList.remove('disabled');

            // Update metrics
            metricTime.textContent = `${data.time_taken}s`;
            metricDuration.textContent = `${data.duration}s`;
            metricRtf.textContent = `${data.rtf}x`;
            
            // Add styling indicator if it generated faster than real-time
            if (data.rtf < 1.0) {
                metricRtf.classList.add('active-rtf');
                metricExp.innerHTML = `🔥 **Awesome!** The speech was generated **${(1/data.rtf).toFixed(1)}x faster** than real-time speed.`;
            } else {
                metricRtf.classList.remove('active-rtf');
                metricExp.textContent = `Generated successfully on your CPU. Real-Time Factor (RTF) is ${data.rtf}x.`;
            }

            // Add to session comparison history stack
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const textSnippet = text.length > 150 ? text.substring(0, 150) + "..." : text;
            const presetName = presetSelect.value !== 'custom' ? PRESETS[presetSelect.value].name : '👤 Custom Settings';
            const speakerName = speakerSelect.options[speakerSelect.selectedIndex].text;
            
            const historyItem = {
                timestamp,
                textSnippet,
                presetName,
                speakerName,
                speed: `${speed.toFixed(1)}x`,
                url: data.url,
                time_taken: data.time_taken,
                duration: data.duration,
                rtf: data.rtf
            };
            generationHistory.unshift(historyItem);
            updateHistoryUI();

            // Autoplay generated audio
            try {
                await audioElement.play();
            } catch (playError) {
                console.log("Autoplay blocked by browser. Click play to listen.", playError);
            }

        } catch (err) {
            console.error(err);
            alert(`Error: ${err.message}`);
        } finally {
            // Restore UI state
            generateBtn.disabled = false;
            btnText.textContent = '🔮 Convert to Speech';
            spinner.classList.add('hidden');
        }
    });
});
