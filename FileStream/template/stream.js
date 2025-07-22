// Universal Stream Player with HLS, DASH and native fallback
class AdvancedStreamPlayer {
    constructor() {
        this.video = document.getElementById('video-player');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.muteBtn = document.getElementById('mute-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.timeDisplay = document.getElementById('time-display');
        this.qualityBtn = document.getElementById('quality-btn');
        this.qualityOptions = document.getElementById('quality-options');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.pipBtn = document.getElementById('pip-btn');
        this.vrBtn = document.getElementById('vr-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        this.isHLS = false;
        this.isDASH = false;
        this.hls = null;
        this.dash = null;
        this.qualities = [];
        this.currentQuality = 'auto';
        this.vrMode = false;
        
        this.initPlayer();
    }
    
    async initPlayer() {
        // Get stream URL from query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const streamUrl = urlParams.get('url');
        
        if (!streamUrl) {
            alert('No stream URL provided');
            return;
        }
        
        // Detect stream type and initialize appropriate player
        if (streamUrl.includes('.m3u8')) {
            await this.initHLS(streamUrl);
        } else if (streamUrl.includes('.mpd')) {
            await this.initDASH(streamUrl);
        } else {
            this.initNative(streamUrl);
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for VR support
        this.checkVRSupport();
    }
    
    async initHLS(streamUrl) {
        if (Hls.isSupported()) {
            this.isHLS = true;
            this.hls = new Hls();
            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                this.qualities = data.levels.map(level => ({
                    height: level.height,
                    bandwidth: level.bitrate,
                    url: level.url
                }));
                
                this.setupQualityOptions();
                this.video.play().catch(e => console.error('Autoplay failed:', e));
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            this.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            this.hls.recoverMediaError();
                            break;
                        default:
                            this.initNative(streamUrl);
                            break;
                    }
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            this.video.src = streamUrl;
            this.video.addEventListener('loadedmetadata', () => {
                this.video.play().catch(e => console.error('Autoplay failed:', e));
            });
        } else {
            // Fallback to native
            this.initNative(streamUrl);
        }
    }
    
    async initDASH(streamUrl) {
        if (dashjs.supportsMediaSource()) {
            this.isDASH = true;
            this.dash = dashjs.MediaPlayer().create();
            this.dash.initialize(this.video, streamUrl, true);
            
            this.dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                const bitrateInfo = this.dash.getBitrateInfoListFor('video');
                this.qualities = bitrateInfo.map(info => ({
                    bandwidth: info.bitrate,
                    qualityIndex: info.qualityIndex
                }));
                
                this.setupQualityOptions();
                this.video.play().catch(e => console.error('Autoplay failed:', e));
            });
            
            this.dash.on(dashjs.MediaPlayer.events.ERROR, (e) => {
                console.error('DASH Error:', e);
                this.initNative(streamUrl);
            });
        } else {
            this.initNative(streamUrl);
        }
    }
    
    initNative(streamUrl) {
        this.video.src = streamUrl;
        this.video.addEventListener('loadedmetadata', () => {
            this.video.play().catch(e => console.error('Autoplay failed:', e));
        });
    }
    
    setupQualityOptions() {
        this.qualityOptions.innerHTML = '';
        
        // Add Auto option
        const autoOption = document.createElement('button');
        autoOption.className = 'quality-option';
        autoOption.textContent = 'Auto';
        autoOption.addEventListener('click', () => {
            this.setQuality('auto');
        });
        this.qualityOptions.appendChild(autoOption);
        
        // Add available qualities
        if (this.isHLS) {
            this.qualities.sort((a, b) => b.height - a.height).forEach(quality => {
                const option = document.createElement('button');
                option.className = 'quality-option';
                option.textContent = `${quality.height}p`;
                option.addEventListener('click', () => {
                    this.setQuality(quality.height);
                });
                this.qualityOptions.appendChild(option);
            });
        } else if (this.isDASH) {
            this.qualities.sort((a, b) => b.bandwidth - a.bandwidth).forEach(quality => {
                const option = document.createElement('button');
                option.className = 'quality-option';
                option.textContent = `${Math.round(quality.bandwidth / 1000)}kbps`;
                option.addEventListener('click', () => {
                    this.setQuality(quality.qualityIndex);
                });
                this.qualityOptions.appendChild(option);
            });
        }
    }
    
    setQuality(quality) {
        this.currentQuality = quality;
        
        if (this.isHLS) {
            if (quality === 'auto') {
                this.hls.currentLevel = -1;
            } else {
                const level = this.qualities.findIndex(q => q.height === quality);
                if (level !== -1) this.hls.currentLevel = level;
            }
        } else if (this.isDASH) {
            if (quality === 'auto') {
                this.dash.setAutoSwitchQualityFor('video', true);
            } else {
                this.dash.setAutoSwitchQualityFor('video', false);
                this.dash.setQualityFor('video', quality);
            }
        }
        
        this.qualityBtn.textContent = quality === 'auto' ? 'Auto' : 
            this.isHLS ? `${quality}p` : `${Math.round(this.qualities.find(q => q.qualityIndex === quality).bandwidth / 1000)}kbps`;
    }
    
    setupEventListeners() {
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => {
            if (this.video.paused) {
                this.video.play();
                this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                this.video.pause();
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
        
        // Mute/Unmute
        this.muteBtn.addEventListener('click', () => {
            this.video.muted = !this.video.muted;
            this.muteBtn.innerHTML = this.video.muted ? 
                '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
        
        // Volume control
        this.volumeSlider.addEventListener('input', () => {
            this.video.volume = this.volumeSlider.value;
            this.video.muted = this.volumeSlider.value === '0';
            this.muteBtn.innerHTML = this.video.muted ? 
                '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
        
        // Progress bar
        this.progressContainer.addEventListener('click', (e) => {
            const rect = this.progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            this.video.currentTime = pos * this.video.duration;
        });
        
        // Time update
        this.video.addEventListener('timeupdate', () => {
            const currentTime = this.formatTime(this.video.currentTime);
            const duration = this.formatTime(this.video.duration);
            this.timeDisplay.textContent = `${currentTime} / ${duration}`;
            
            const progress = (this.video.currentTime / this.video.duration) * 100;
            this.progressBar.style.width = `${progress}%`;
        });
        
        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                this.video.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
        
        // Picture-in-Picture
        this.pipBtn.addEventListener('click', async () => {
            try {
                if (this.video !== document.pictureInPictureElement) {
                    await this.video.requestPictureInPicture();
                } else {
                    await document.exitPictureInPicture();
                }
            } catch (error) {
                console.error('PiP error:', error);
            }
        });
        
        // VR Mode
        this.vrBtn.addEventListener('click', () => {
            this.toggleVRMode();
        });
        
        // Download
        this.downloadBtn.addEventListener('click', () => {
            this.downloadVideo();
        });
        
        // Loading state
        this.video.addEventListener('waiting', () => {
            this.loadingSpinner.style.display = 'block';
        });
        
        this.video.addEventListener('playing', () => {
            this.loadingSpinner.style.display = 'none';
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.playPauseBtn.click();
                    break;
                case 'm':
                    this.muteBtn.click();
                    break;
                case 'f':
                    this.fullscreenBtn.click();
                    break;
                case 'ArrowLeft':
                    this.video.currentTime -= 5;
                    break;
                case 'ArrowRight':
                    this.video.currentTime += 5;
                    break;
                case 'ArrowUp':
                    this.video.volume = Math.min(1, this.video.volume + 0.1);
                    this.volumeSlider.value = this.video.volume;
                    break;
                case 'ArrowDown':
                    this.video.volume = Math.max(0, this.video.volume - 0.1);
                    this.volumeSlider.value = this.video.volume;
                    break;
            }
        });
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    checkVRSupport() {
        if (!navigator.xr) {
            this.vrBtn.style.display = 'none';
            return;
        }
        
        navigator.xr.isSessionSupported('immersive-vr').then(supported => {
            if (!supported) {
                this.vrBtn.style.display = 'none';
            }
        });
    }
    
    async toggleVRMode() {
        if (this.vrMode) {
            // Exit VR mode
            const session = this.video.xrSession;
            if (session) {
                await session.end();
            }
            this.video.classList.remove('vr-mode');
            this.vrMode = false;
            return;
        }
        
        // Enter VR mode
        try {
            const session = await navigator.xr.requestSession('immersive-vr');
            session.addEventListener('end', () => {
                this.video.classList.remove('vr-mode');
                this.vrMode = false;
            });
            
            this.video.classList.add('vr-mode');
            this.vrMode = true;
            
            // Set up WebXR rendering (simplified)
            const ctx = this.video.getContext('xr');
            session.updateRenderState({
                baseLayer: new XRWebGLLayer(session, ctx)
            });
            
            const refSpace = await session.requestReferenceSpace('local');
            const onXRFrame = (time, frame) => {
                const pose = frame.getViewerPose(refSpace);
                if (pose) {
                    // Update video position based on headset movement
                }
                session.requestAnimationFrame(onXRFrame);
            };
            session.requestAnimationFrame(onXRFrame);
        } catch (err) {
            console.error('VR mode failed:', err);
            alert('Failed to enter VR mode: ' + err.message);
        }
    }
    
    async downloadVideo() {
        const urlParams = new URLSearchParams(window.location.search);
        const downloadUrl = urlParams.get('url');
        
        if (!downloadUrl) {
            alert('No download URL available');
            return;
        }
        
        try {
            // For native downloads
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'video_' + Date.now() + (downloadUrl.includes('.mp4') ? '.mp4' : '.mkv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // For larger files, you might want to implement a service worker based download manager
            // with pause/resume functionality (more complex implementation)
        } catch (err) {
            console.error('Download failed:', err);
            alert('Download failed. Please try again.');
        }
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const player = new AdvancedStreamPlayer();
    
    // Register service worker for PWA and offline caching
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    }
});
