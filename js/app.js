document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------
    // INITIALIZATION & DOM ELEMENTS
    // ------------------------------------
    const vinyl = document.querySelector('.vinyl-record');
    const recordContainer = document.querySelector('.record-container');
    const selectorBase = document.querySelector('.selector-base');
    const speedPoints = document.querySelectorAll('.speed-point');
    const set33Btn = document.getElementById('set33-btn');
    const setStopBtn = document.getElementById('setstop-btn');
    const set45Btn = document.getElementById('set45-btn');
    const directionBtn = document.getElementById('direction-btn');
    const pitchSlider = document.getElementById('pitch-slider');
    const tonearmContainer = document.getElementById('tonearm-container');
    const pitchKnob = document.getElementById('pitch-knob');
    const testScratchBtn = document.getElementById('test-scratch-btn');
    const startingMessage = document.getElementById('starting-message');
    const toggleDebugBtn = document.getElementById('toggle-debug');
    const scene = document.querySelector('.scene');
    const audioTimeCounter = document.getElementById('audio-time-counter');
    const timeDisplay = document.getElementById('time-display');
    const tonearmDragZone = document.querySelector('.tonearm-drag-zone');

    // ------------------------------------
    // CONSTANTS & CONFIGURATION
    // ------------------------------------
    const RPM_33 = 33.33;
    const RPM_45 = 45;
    // Cache computed style to avoid layout thrashing during animation loops
    const computedStyle = getComputedStyle(document.documentElement);
    const BASE_DURATION = parseFloat(computedStyle.getPropertyValue('--speed-33-duration').replace('s', ''));

    // Angles Z de début et de fin pour le mouvement du bras
    // NOTE: Angles adjusted for CSS rotation
    const ARM_REST_Z_ANGLE = -90;    // Repos
    const ARM_START_Z_ANGLE = -80;   // Démarrage sur disque
    const ARM_END_Z_ANGLE = 135;     // Centre disque
    // NEW CONSTRAINT: Limit dragging to 45 degrees max deviation or absolute range?
    // User request: "le bras ne doit pas bouger horizontalement de plus de 45°"
    // Interpretation: The range of motion manually draggable should be limited.
    // Let's implement clamp values.
    const ARM_MIN_DRAG_ANGLE = -100; // Un peu avant le repos
    const ARM_MAX_DRAG_ANGLE = 70;   // Limité au dernier sillon (run-out groove)

    const ARM_TOTAL_PLAY_DURATION_SECONDS = 720; // 12 minutes

    // Vinyl zones (based on arm angle)
    // Étiquette centrale : 10cm diamètre (5cm rayon) - pas de sillons
    // Trou central : 0.8cm diamètre
    // Dernier sillon : ~1cm du bord de l'étiquette = rayon 6cm
    const ARM_LABEL_START_ANGLE = 75;    // Début de l'étiquette (zone sans sillon)
    const ARM_LABEL_END_ANGLE = 135;      // Fin de l'étiquette (centre)
    const ARM_RUNOUT_GROOVE_ANGLE = 70;   // Dernier sillon (run-out groove)
    const ARM_VINYL_START_ANGLE = -80;    // Début du vinyle

    // Hauteurs Z (rotation X)
    const ARM_HEIGHT_REST = -8;
    const ARM_HEIGHT_LIFTED = 5;  // Réduit pour rester visible
    const ARM_HEIGHT_PLAYING = 3;

    // ------------------------------------
    // STATE VARIABLES
    // ------------------------------------
    let isRunning = false;
    let currentSpeedDuration = BASE_DURATION;
    let isReversed = false;
    let currentRPM = 0;

    // Arm state
    let currentArmPosition = null;
    let armState = 'rest'; // 'rest', 'lifted', 'playing'
    let isDraggingArm = false;
    let armCurrentZAngle = ARM_REST_Z_ANGLE;
    let armTargetZAngle = ARM_REST_Z_ANGLE; // Target angle for damped movement
    let armCurrentHeight = ARM_HEIGHT_REST;
    let isArmLifted = false;
    let armStartTime = 0;
    let animationFrameId = null;
    let armDragAngleOffset = 0;
    let armDampingFrame = null;
    let lastArmDragAngle = null;
    let lastArmDragTime = null;
    const ARM_DAMPING_FACTOR = 0.08; // Résistance: plus petit = plus de résistance

    // Audio & Scratch state
    const audioElement = new Audio('VanillaHaters.opus');
    audioElement.loop = false;
    audioElement.preservesPitch = false;

    let isScratching = false;
    let scratchRotation = 0;
    let scratchVelocity = 0;
    let lastMoveTime = 0;
    let scratchAnimationFrame = null;
    let anchorRotation = 0;
    let anchorAudioTime = 0;
    let previousScratchRotation = 0;
    let scratchLastAngle = 0;
    let lastScratchTime = 0;

    const FRICTION_COEFFICIENT = 0.92;

    // ------------------------------------
    // AUDIO SYSTEM (TONE.JS)
    // ------------------------------------
    let tonePlayer = null;
    let toneInitialized = false;

    // Audio Context for UI sounds (Tonearm mechanical noise)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let audioContextStarted = false;

    async function initToneJS() {
        try {
            await Tone.start();
            console.log('🎵 Tone.js started');
            toneInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Error initializing Tone.js:', error);
            return false;
        }
    }

    const startAudioContext = async () => {
        if (!audioContextStarted) {
            audioContextStarted = true;
            try {
                await Tone.start();
                await audioContext.resume();
                console.log('✅ AudioContext resumed on user interaction');
            } catch (e) {
                console.warn('⚠️ AudioContext resume error:', e);
            }
        }
    };

    document.addEventListener('click', startAudioContext, { once: true });
    document.addEventListener('touchstart', startAudioContext, { once: true });

    // Tonearm Sound generator
    function createTonearmSound() {
        const duration = 1.5;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.1;
            const envelope = Math.exp(-t * 2);
            const lowFreq = Math.sin(2 * Math.PI * 60 * t) * 0.05;
            data[i] = (noise + lowFreq) * envelope;
        }
        return buffer;
    }

    // ToneJS Scratcher Class
    class ToneJSScratcher {
        constructor(audioElement) {
            this.audioElement = audioElement;
            this.isScratching = false;
            this.currentPlaybackPosition = 0;
            this.isInitialized = false;
            this.duration = 0;
            this.wasPlaying = false;
        }

        async initialize() {
            return await this.loadFromAudioElement();
        }

        async loadFromAudioElement() {
            try {
                if (!toneInitialized) await initToneJS();
                console.log('🎵 Loading audio with Tone.js...');

                tonePlayer = new Tone.Player({
                    url: this.audioElement.src,
                    loop: false,
                    onload: () => {
                        this.isInitialized = true;
                        this.duration = tonePlayer.buffer.duration;
                        console.log('✅ Audio loaded:', this.duration, 's');
                        tonePlayer.toDestination();
                    }
                });
                await Tone.loaded();
                return true;
            } catch (error) {
                console.error('❌ Error loading audio:', error);
                return false;
            }
        }

        startScratch(currentPosition) {
            if (!this.isInitialized) return;
            this.isScratching = true;
            this.currentPlaybackPosition = currentPosition;

            if (tonePlayer && tonePlayer.state === 'started') {
                this.wasPlaying = true;
                tonePlayer.stop();
            } else {
                this.wasPlaying = false;
            }
        }

        updatePosition(newPosition, velocity) {
            if (!this.isInitialized || !this.isScratching) return;

            this.currentPlaybackPosition = Math.max(0, Math.min(this.duration, newPosition));

            if (tonePlayer) {
                try {
                    if (tonePlayer.state === 'started') tonePlayer.stop();

                    const grainDuration = 0.04;
                    if (tonePlayer.reverse) tonePlayer.reverse = false;

                    // Compute rate based on velocity
                    let rate = Math.max(-20.0, Math.min(20.0, velocity * 2));
                    // Prevent near-zero rate errors
                    if (Math.abs(rate) < 0.001) rate = rate >= 0 ? 0.001 : -0.001;

                    tonePlayer.playbackRate = rate;

                    const safePosition = Math.max(0, Math.min(this.duration - 0.05, this.currentPlaybackPosition));
                    tonePlayer.start(Tone.now(), safePosition, grainDuration);

                    setTimeout(() => {
                        if (this.isScratching && tonePlayer && tonePlayer.state === 'started') {
                            tonePlayer.stop();
                        }
                    }, 40);
                } catch (e) {
                    // Silent catch
                }
            }
        }

        stopScratch() {
            if (!this.isInitialized) return;
            this.isScratching = false;
        }

        getPosition() {
            if (tonePlayer && tonePlayer.state === 'started') {
                const pos = tonePlayer.toSeconds(tonePlayer.immediate());
                return Math.max(0, pos);
            }
            return Math.max(0, this.currentPlaybackPosition);
        }
    }

    const audioScratcher = new ToneJSScratcher(audioElement);

    // ------------------------------------
    // HELPER FUNCTIONS
    // ------------------------------------
    function getAnimationDuration(rpm) {
        if (rpm === 0) return 1000;
        const duration = BASE_DURATION * (RPM_33 / rpm);
        return duration.toFixed(2);
    }

    function updateAudioPlaybackRate() {
        if (!isRunning || currentRPM === 0) return;

        const pitchFactor = parseFloat(pitchSlider.value);
        const speedRatio = currentRPM / RPM_33;
        const playbackRate = speedRatio * pitchFactor;

        if (tonePlayer && tonePlayer.buffer) {
            // Fix: Use positive magnitude to prevent input errors, logic handled by reverse prop
            const safeRate = Math.max(0.001, Math.min(4.0, Math.abs(playbackRate)));
            tonePlayer.playbackRate = safeRate;
        }
    }

    function moveTonearmToPosition(targetAngle, targetHeight) {
        armState = targetHeight === ARM_HEIGHT_REST ? 'rest' :
            targetHeight === ARM_HEIGHT_LIFTED ? 'lifted' : 'playing';

        // Adjust Z position when lifted to keep arm visible
        const zPosition = targetHeight === ARM_HEIGHT_LIFTED ? 9 : 7;
        // Add rotateY for visual lift effect when arm is lifted
        const rotateY = targetHeight === ARM_HEIGHT_LIFTED ? 8 : 0;
        const transform = `translate(-50%, -50%) translateZ(${zPosition}vmin) rotateZ(${targetAngle}deg) rotateX(${targetHeight}deg) rotateY(${rotateY}deg)`;

        // Optim: use direct style manipulation
        tonearmContainer.style.transform = transform;
        tonearmContainer.style.visibility = 'visible';
        tonearmContainer.style.opacity = '1';

        // Shadow update
        if (targetHeight === ARM_HEIGHT_LIFTED) {
            tonearmContainer.style.filter = 'drop-shadow(0 1vmin 2vmin rgba(0, 0, 0, 0.5))';
        } else {
            tonearmContainer.style.filter = 'drop-shadow(0 0.3vmin 0.8vmin rgba(0, 0, 0, 0.6))';
        }
    }

    function isArmOverVinyl(angle) {
        // Broad check for dropping logic (unchanged)
        return angle >= -75 && angle <= 145;
    }

    function getVinylZone(angle) {
        // Retourne la zone du vinyle selon l'angle du bras
        if (angle >= ARM_LABEL_START_ANGLE) {
            return 'label'; // Zone d'étiquette (pas de sillon)
        } else if (angle >= ARM_RUNOUT_GROOVE_ANGLE) {
            return 'runout'; // Run-out groove (boucle infinie)
        } else if (angle >= ARM_VINYL_START_ANGLE) {
            return 'playing'; // Zone de lecture normale
        } else {
            return 'off'; // Hors du disque
        }
    }

    function getAudioPositionFromArmAngle(angle) {
        // Convertit l'angle du bras en position audio (en secondes)
        // Bras au début (-80°) = 0s, Bras au dernier sillon (85°) = durée totale
        if (!audioScratcher.isInitialized || !audioScratcher.duration) {
            return 0;
        }

        const totalAngleRange = ARM_RUNOUT_GROOVE_ANGLE - ARM_START_Z_ANGLE; // 85 - (-80) = 165°
        const currentAngleOffset = angle - ARM_START_Z_ANGLE; // Position relative
        const progress = Math.max(0, Math.min(1, currentAngleOffset / totalAngleRange));

        return progress * audioScratcher.duration;
    }

    function getArmAngleFromAudioPosition(audioTime) {
        // Convertit la position audio en angle du bras
        if (!audioScratcher.isInitialized || !audioScratcher.duration) {
            return ARM_START_Z_ANGLE;
        }

        const progress = audioTime / audioScratcher.duration;
        const totalAngleRange = ARM_RUNOUT_GROOVE_ANGLE - ARM_START_Z_ANGLE;
        return ARM_START_Z_ANGLE + (progress * totalAngleRange);
    }

    // ------------------------------------
    // ANIMATION & PLAYBACK LOGIC
    // ------------------------------------
    function updateAnimation() {
        const pitchFactor = parseFloat(pitchSlider.value);
        let finalDuration;

        if (isRunning) {
            finalDuration = (currentSpeedDuration / pitchFactor).toFixed(2);
        } else {
            finalDuration = 1000;
        }

        vinyl.style.animationName = isReversed ? 'spin-reverse' : 'spin';
        vinyl.style.animationDuration = `${finalDuration}s`;
        vinyl.style.animationPlayState = isRunning ? 'running' : 'paused';

        // Update Pitch Knob UI
        const minTop = 90;
        const maxTop = 10;
        const topPosition = maxTop + (minTop - maxTop) * (1.5 - pitchFactor);
        pitchKnob.style.top = `${topPosition}%`;

        updateAudioPlaybackRate();
    }

    function updateAnimationWithCurrentRotation() {
        const pitchFactor = parseFloat(pitchSlider.value);
        let finalDuration = isRunning ? (currentSpeedDuration / pitchFactor).toFixed(2) : 1000;

        vinyl.style.animation = '';
        vinyl.style.transform = '';

        vinyl.style.animationName = isReversed ? 'spin-reverse' : 'spin';
        vinyl.style.animationDuration = `${finalDuration}s`;
        vinyl.style.animationIterationCount = 'infinite';
        vinyl.style.animationTimingFunction = 'linear';

        const currentCyclePosition = (scratchRotation % 360 + 360) % 360;
        const cycleCompleteRatio = currentCyclePosition / 360;

        // Calculate delay to sync animation with current rotation
        const delay = isReversed ?
            -(1 - cycleCompleteRatio) * finalDuration :
            -cycleCompleteRatio * finalDuration;

        vinyl.style.animationDelay = `${delay}s`;
        vinyl.style.animationPlayState = isRunning ? 'running' : 'paused';

        // Pitch knob UI
        const topPosition = 10 + (90 - 10) * (1.5 - pitchFactor);
        pitchKnob.style.top = `${topPosition}%`;

        updateAudioPlaybackRate();
    }

    function restoreAnimation() {
        vinyl.style.transform = '';
        vinyl.style.transition = '';

        updateAnimationWithCurrentRotation();
        vinyl.style.animationPlayState = 'running';

        if (tonePlayer && audioScratcher.isInitialized) {
            let currentPos = audioScratcher.getPosition();

            // Validation
            if (currentPos < 0 || isNaN(currentPos)) currentPos = 0;
            if (tonePlayer.buffer) currentPos = Math.min(currentPos, tonePlayer.buffer.duration - 0.05);

            if (tonePlayer.state === 'started') tonePlayer.stop();

            tonePlayer.reverse = isReversed;
            updateAudioPlaybackRate(); // Sets rate correctly

            try {
                const startTime = Tone.now() + 0.01;
                tonePlayer.start(startTime, currentPos);
                console.log('🎵 Audio restored at:', currentPos);
            } catch (e) {
                console.warn('Audio restart error, retrying:', e);
                try { tonePlayer.start(Tone.now() + 0.1, 0); } catch (e2) { }
            }
        }
    }

    function startAudioPlayback(startFromArmPosition = false) {
        if (tonePlayer && tonePlayer.state === 'started') tonePlayer.stop();

        if (!audioScratcher.isInitialized) {
            audioScratcher.loadFromAudioElement().then(() => {
                if (tonePlayer) {
                    let startPos = 0;
                    if (startFromArmPosition && currentArmPosition !== null) {
                        startPos = getAudioPositionFromArmAngle(currentArmPosition);
                    }
                    tonePlayer.start('+0', startPos);
                    audioScratcher.setPosition(startPos);
                    updateAudioPlaybackRate();
                }
            });
        } else if (tonePlayer && tonePlayer.buffer) {
            let currentPos;
            if (startFromArmPosition && currentArmPosition !== null) {
                // Démarrer à la position correspondant à l'angle du bras
                currentPos = getAudioPositionFromArmAngle(currentArmPosition);
            } else {
                currentPos = audioScratcher.isInitialized ? audioScratcher.getPosition() : 0;
            }
            const duration = tonePlayer.buffer.duration;
            currentPos = Math.max(0, Math.min(currentPos, duration - 0.1));

            tonePlayer.start('+0', currentPos);
            audioScratcher.setPosition(currentPos);
            updateAudioPlaybackRate();
        }
    }

    function setSpeedAndKnob(rpm, button, skipAnimation = false) {
        [set33Btn, setStopBtn, set45Btn].forEach(btn => btn.classList.remove('active'));

        let baseRotation = 0;
        const wasRunning = isRunning;
        currentRPM = rpm;

        if (rpm === RPM_33 || rpm === RPM_45) {
            currentSpeedDuration = getAnimationDuration(rpm);
            isRunning = true;
            baseRotation = (rpm === RPM_33) ? 22 : -20;

            if (scratchAnimationFrame) {
                cancelAnimationFrame(scratchAnimationFrame);
                scratchAnimationFrame = null;
            }

            // CSS Transform capture
            const transform = window.getComputedStyle(vinyl).transform;
            if (transform && transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                scratchRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            }

            // If already running, just change speed without animation
            if (wasRunning && !skipAnimation) {
                // Simply update the playback rate and animation
                updateAudioPlaybackRate();
                updateAnimationWithCurrentRotation();
            } else if (!skipAnimation) {
                if (startingMessage) {
                    startingMessage.classList.add('visible');
                    setTimeout(() => startingMessage.classList.remove('visible'), 400);
                }

                // Cancel any potential arm damping animation
                if (armDampingFrame) {
                    cancelAnimationFrame(armDampingFrame);
                    armDampingFrame = null;
                }
                
                // Preserve current arm position if it's already on the record and playing
                // More strict check: must be in 'playing' state AND position must be valid (not at rest)
                const preserveArmPosition = armState === 'playing' && 
                                           currentArmPosition !== null && 
                                           currentArmPosition !== ARM_REST_Z_ANGLE &&
                                           armCurrentZAngle !== ARM_REST_Z_ANGLE;
                const targetStartAngle = preserveArmPosition ? currentArmPosition : ARM_START_Z_ANGLE;
                
                // Reset arm state completely if starting from rest
                if (!preserveArmPosition) {
                    isDraggingArm = false;
                    armState = 'rest';

                    // Tonearm sequence from rest position
                    // 1. Sound
                    try {
                        const source = audioContext.createBufferSource();
                        source.buffer = createTonearmSound();
                        const gainNode = audioContext.createGain();
                        gainNode.gain.value = 0.3;
                        source.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        source.start(0);
                    } catch (e) { }

                    // 2. Initial Movement
                    setTimeout(() => {
                        armCurrentZAngle = ARM_REST_Z_ANGLE;
                        armTargetZAngle = ARM_REST_Z_ANGLE;
                        armCurrentHeight = ARM_HEIGHT_LIFTED;
                        armState = 'lifted';
                        moveTonearmToPosition(ARM_REST_Z_ANGLE, ARM_HEIGHT_LIFTED);
                    }, 30);
                    setTimeout(() => {
                        armCurrentZAngle = ARM_START_Z_ANGLE;
                        armTargetZAngle = ARM_START_Z_ANGLE;
                        armCurrentHeight = ARM_HEIGHT_LIFTED;
                        moveTonearmToPosition(ARM_START_Z_ANGLE, ARM_HEIGHT_LIFTED);
                    }, 150);
                    setTimeout(() => {
                        armCurrentHeight = ARM_HEIGHT_PLAYING;
                        armState = 'playing';
                        moveTonearmToPosition(ARM_START_Z_ANGLE, ARM_HEIGHT_PLAYING);
                    }, 300);

                    // 3. Start Playback
                    setTimeout(() => {
                        armStartTime = 0;
                        currentArmPosition = ARM_START_Z_ANGLE;
                        armCurrentZAngle = ARM_START_Z_ANGLE;
                        armTargetZAngle = ARM_START_Z_ANGLE;
                        if (animationFrameId) cancelAnimationFrame(animationFrameId);
                        animationFrameId = requestAnimationFrame(animateTonearm);
                        startAudioPlayback(true); // Démarrer depuis la position du bras
                    }, 450);
                } else {
                    // Arm is already positioned on the record, just start playing from current position
                    isDraggingArm = false;
                    armState = 'playing';
                    armCurrentHeight = ARM_HEIGHT_PLAYING;
                    armStartTime = 0;
                    
                    // Set target to current position to prevent movement
                    armTargetZAngle = armCurrentZAngle;
                    currentArmPosition = armCurrentZAngle;
                    
                    moveTonearmToPosition(armCurrentZAngle, ARM_HEIGHT_PLAYING);
                    if (animationFrameId) cancelAnimationFrame(animationFrameId);
                    animationFrameId = requestAnimationFrame(animateTonearm);
                    startAudioPlayback(true); // Démarrer depuis la position du bras
                }
            } else {
                if (tonePlayer && tonePlayer.state === 'started') tonePlayer.stop();
            }

        } else { // STOP
            currentSpeedDuration = 0;
            isRunning = false;
            baseRotation = 0;

            // Cancel any running scratch animation
            if (scratchAnimationFrame) {
                cancelAnimationFrame(scratchAnimationFrame);
                scratchAnimationFrame = null;
            }

            // Capture current rotation
            const transform = window.getComputedStyle(vinyl).transform;
            if (transform && transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                scratchRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            }

            // Stop animation
            vinyl.style.animation = 'none';
            vinyl.style.willChange = 'auto';
            
            // Calculate target rotation: continue in the same direction to next clean position
            const normalizedRotation = ((scratchRotation % 360) + 360) % 360;
            let targetRotation;
            
            if (isReversed) {
                // Going backwards: round down to previous 0° position
                targetRotation = Math.floor(scratchRotation / 360) * 360;
            } else {
                // Going forward: round up to next 0° position
                targetRotation = Math.ceil(scratchRotation / 360) * 360;
            }
            
            // Apply smooth deceleration with CSS transition (simulate vinyl inertia)
            // Force a reflow to ensure transition applies
            void vinyl.offsetWidth;
            vinyl.style.transition = 'transform 6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            vinyl.style.transform = `translate(-50%, -50%) rotateZ(${targetRotation}deg)`;
            
            // Update internal state after transition
            setTimeout(() => {
                scratchRotation = targetRotation;
                scratchVelocity = 0;
                vinyl.style.transition = '';
            }, 6000);

            if (tonePlayer && tonePlayer.state === 'started') tonePlayer.stop();

            currentArmPosition = null;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            if (!skipAnimation && armState !== 'rest') {
                const currentAngle = currentArmPosition || ARM_START_Z_ANGLE;
                setTimeout(() => moveTonearmToPosition(currentAngle, ARM_HEIGHT_LIFTED), 100);
                setTimeout(() => moveTonearmToPosition(ARM_REST_Z_ANGLE, ARM_HEIGHT_LIFTED), 700);
                setTimeout(() => moveTonearmToPosition(ARM_REST_Z_ANGLE, ARM_HEIGHT_REST), 1300);
            }
        }

        speedPoints.forEach(p => p.classList.remove('active'));
        if (rpm === RPM_33) document.querySelector('.speed-point-33').classList.add('active');
        else if (rpm === RPM_45) document.querySelector('.speed-point-45').classList.add('active');
        else document.querySelector('.speed-point-stop').classList.add('active');

        selectorBase.style.transform = `rotateZ(${baseRotation}deg)`;
        button.classList.add('active');

        // Only update animation for play modes, not for stop (uses CSS transition)
        // Skip if already handled above (when changing speed while running)
        if ((rpm === RPM_33 || rpm === RPM_45) && (!wasRunning || skipAnimation)) {
            updateAnimationWithCurrentRotation();
        }
    }

    // ------------------------------------
    // SCRATCH LOGIC
    // ------------------------------------
    function getAngleFromCenter(clientX, clientY, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    }

    function normalizeAngleDelta(delta) {
        if (delta > 180) return delta - 360;
        if (delta < -180) return delta + 360;
        return delta;
    }

    function applyScratch() {
        if (!isScratching) {
            if (isRunning) {
                // Physics: Torque return to target speed
                const targetVelocity = (360 / getAnimationDuration(currentRPM)) / 60;
                const torqueFactor = 0.35;
                scratchVelocity = scratchVelocity + (targetVelocity - scratchVelocity) * torqueFactor;

                const delta = Math.abs(scratchVelocity - targetVelocity);
                if (delta < 0.15) {
                    scratchVelocity = 0;
                    restoreAnimation();
                    if (scratchAnimationFrame) {
                        cancelAnimationFrame(scratchAnimationFrame);
                        scratchAnimationFrame = null;
                    }
                    return;
                }
            } else {
                // Friction stop
                scratchVelocity *= FRICTION_COEFFICIENT;
                if (Math.abs(scratchVelocity) < 0.01) {
                    scratchVelocity = 0;
                    if (scratchAnimationFrame) {
                        cancelAnimationFrame(scratchAnimationFrame);
                        scratchAnimationFrame = null;
                    }
                    return;
                }
            }

            // Apply inertia movement
            scratchRotation += scratchVelocity;
            vinyl.style.transform = `translate(-50%, -50%) rotateZ(${scratchRotation}deg)`;
            vinyl.style.transition = 'none';
        }

        // --- ABSOLUTE SYNC ---
        if (audioScratcher.isInitialized && isScratching) {
            // Ghost playback fix
            if (Date.now() - lastMoveTime > 100) scratchVelocity *= 0.1;

            const totalRotationDelta = scratchRotation - anchorRotation;
            const rpm = currentRPM || RPM_33;
            const secondsPerDegree = (60 / rpm) / 360;

            let newTime = anchorAudioTime + (totalRotationDelta * secondsPerDegree);
            newTime = Math.max(0, Math.min(audioScratcher.duration, newTime));

            // Normalize velocity for pitch effect
            const velocityNormalized = scratchVelocity / 6;
            audioScratcher.updatePosition(newTime, velocityNormalized);

            // HTML Audio sync attempt (optional)
            if (Math.abs(audioElement.currentTime - newTime) > 0.1) {
                audioElement.currentTime = newTime;
            }
        }

        scratchAnimationFrame = requestAnimationFrame(applyScratch);
    }

    // ------------------------------------
    // ARM ANIMATION LOOP
    // ------------------------------------
    function animateTonearm(timestamp) {
        if (!armStartTime) armStartTime = timestamp;
        const elapsedTime = (timestamp - armStartTime) / 1000;

        // Utiliser la durée audio réelle au lieu d'une durée fixe
        const audioDuration = audioScratcher.isInitialized ? audioScratcher.duration : ARM_TOTAL_PLAY_DURATION_SECONDS;
        const totalAngleRange = ARM_RUNOUT_GROOVE_ANGLE - ARM_START_Z_ANGLE;

        if (elapsedTime < audioDuration) {
            const progress = elapsedTime / audioDuration;
            let currentArmZAngle = ARM_START_Z_ANGLE + totalAngleRange * progress;
            
            // Limiter strictement le bras au run-out groove
            if (currentArmZAngle >= ARM_RUNOUT_GROOVE_ANGLE) {
                currentArmZAngle = ARM_RUNOUT_GROOVE_ANGLE;
                currentArmPosition = ARM_RUNOUT_GROOVE_ANGLE;
                armCurrentZAngle = ARM_RUNOUT_GROOVE_ANGLE;
                moveTonearmToPosition(ARM_RUNOUT_GROOVE_ANGLE, ARM_HEIGHT_PLAYING);
                // Couper l'audio dans le run-out groove
                if (tonePlayer && tonePlayer.state === 'started') {
                    tonePlayer.stop();
                }
                // Le bras reste en place, ne pas continuer l'animation
                return;
            }
            
            currentArmPosition = currentArmZAngle;
            armCurrentZAngle = currentArmZAngle; // Update current angle for consistency

            // Vérifier la zone du vinyle
            const zone = getVinylZone(currentArmZAngle);

            // Gérer l'audio selon la zone
            if (zone === 'label' || zone === 'off') {
                // Pas de son dans l'étiquette ou hors disque
                if (tonePlayer && tonePlayer.state === 'started') {
                    tonePlayer.stop();
                }
            } else if (zone === 'playing') {
                // Zone de lecture normale - s'assurer que l'audio joue
                if (isRunning && tonePlayer && tonePlayer.state !== 'started' && audioScratcher.isInitialized) {
                    startAudioPlayback();
                }
            }

            moveTonearmToPosition(currentArmZAngle, ARM_HEIGHT_PLAYING);
            animationFrameId = requestAnimationFrame(animateTonearm);
        } else {
            // Audio terminé, bras au dernier sillon
            armCurrentZAngle = ARM_RUNOUT_GROOVE_ANGLE;
            moveTonearmToPosition(ARM_RUNOUT_GROOVE_ANGLE, ARM_HEIGHT_PLAYING);
            if (tonePlayer && tonePlayer.state === 'started') {
                tonePlayer.stop();
            }
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // ------------------------------------
    // ARM DRAG INTERACTION
    // ------------------------------------
    function mouseToArmAngle(clientX, clientY) {
        // FIXED: Use stable pivot from turntable-base rather than rotating container
        const base = document.querySelector('.turntable-base');
        const baseRect = base.getBoundingClientRect();
        const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;

        // Pivot location based on CSS: left: calc(50% + 30vmin), top: calc(50% - 10vmin)
        const pivotX = baseRect.left + (baseRect.width / 2) + (30 * vmin);
        const pivotY = baseRect.top + (baseRect.height / 2) - (10 * vmin);

        return Math.atan2(clientY - pivotY, clientX - pivotX) * (180 / Math.PI);
    }

    const tonearmLiftHook = document.querySelector('.tonearm-lift-hook');
    if (tonearmLiftHook) {
        const handleStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDraggingArm = true;
            
            // Initialize scratch tracking
            lastArmDragAngle = armCurrentZAngle;
            lastArmDragTime = performance.now();

            // MUTE AUDIO ON LIFT
            if (tonePlayer && tonePlayer.state === 'started') {
                tonePlayer.stop();
                console.log('🔇 Arm lifted - Audio muted');
            }

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const mouseAngle = mouseToArmAngle(clientX, clientY);
            armDragAngleOffset = armCurrentZAngle - mouseAngle;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            isArmLifted = true;
            armCurrentHeight = ARM_HEIGHT_LIFTED;
            tonearmContainer.classList.add('dragging');
            moveTonearmToPosition(armCurrentZAngle, armCurrentHeight);
        };

        tonearmLiftHook.addEventListener('mousedown', handleStart);
        tonearmLiftHook.addEventListener('touchstart', handleStart);
        
        // Ajout des événements sur la zone de drag élargie
        if (tonearmDragZone) {
            tonearmDragZone.addEventListener('mousedown', handleStart);
            tonearmDragZone.addEventListener('touchstart', handleStart);
        }
    }

    const handleMove = (e) => {
        if (!isDraggingArm) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const mouseAngle = mouseToArmAngle(clientX, clientY);
        let newAngle = mouseAngle + armDragAngleOffset;

        // --- PLAYBACK ARC CONSTRAINT ---
        // The arm must stay within the playback arc (from -5° to 70°)
        // This represents the actual playable area on the vinyl
        const ARC_START_ANGLE = ARM_START_Z_ANGLE + 75; // -5°
        const ARC_END_ANGLE = ARM_RUNOUT_GROOVE_ANGLE;  // 70°
        newAngle = Math.max(ARC_START_ANGLE, Math.min(ARC_END_ANGLE, newAngle));
        // -------------------------------

        // Set target angle instead of direct angle for damping effect
        armTargetZAngle = newAngle;

        // Start damping animation if not already running
        if (!armDampingFrame) {
            armDampingFrame = requestAnimationFrame(animateArmDamping);
        }

        if (e.cancelable) e.preventDefault();
    };

    // Animation loop for arm damping (resistance)
    function animateArmDamping() {
        if (!isDraggingArm) {
            armDampingFrame = null;
            lastArmDragAngle = null;
            lastArmDragTime = null;
            return;
        }

        const now = performance.now();

        // Apply damping: smooth interpolation towards target
        const delta = armTargetZAngle - armCurrentZAngle;
        const oldAngle = armCurrentZAngle;
        armCurrentZAngle += delta * ARM_DAMPING_FACTOR;

        // Stop if very close to target
        if (Math.abs(delta) < 0.1) {
            armCurrentZAngle = armTargetZAngle;
        }

        moveTonearmToPosition(armCurrentZAngle, armCurrentHeight);

        // Update audio position based on arm movement (scratch effect)
        if (audioScratcher.isInitialized && isRunning) {
            const audioTime = getAudioPositionFromArmAngle(armCurrentZAngle);
            
            // Calculate velocity based on angle change
            let velocity = 0;
            if (lastArmDragAngle !== null && lastArmDragTime !== null) {
                const timeDelta = (now - lastArmDragTime) / 1000; // seconds
                if (timeDelta > 0) {
                    const angleDelta = armCurrentZAngle - lastArmDragAngle;
                    // Convert angle velocity to normalized velocity
                    // Higher angle change = higher velocity
                    velocity = (angleDelta / timeDelta) / 50; // Normalize factor
                    velocity = Math.max(-2, Math.min(2, velocity)); // Clamp
                }
            }
            
            lastArmDragAngle = armCurrentZAngle;
            lastArmDragTime = now;
            
            audioScratcher.updatePosition(audioTime, velocity);
        }

        // Continue animation
        armDampingFrame = requestAnimationFrame(animateArmDamping);
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });

    const handleEnd = () => {
        if (!isDraggingArm) return;
        isDraggingArm = false;
        tonearmContainer.classList.remove('dragging');

        // Stop damping animation and lock position
        if (armDampingFrame) {
            cancelAnimationFrame(armDampingFrame);
            armDampingFrame = null;
        }
        
        // Ensure current angle matches target (stop any residual movement)
        armCurrentZAngle = armTargetZAngle;
        moveTonearmToPosition(armCurrentZAngle, armCurrentHeight);

        // Drop Logic
        if (isArmOverVinyl(armCurrentZAngle)) {
            // Drop on record
            isArmLifted = false;
            armCurrentHeight = ARM_HEIGHT_PLAYING;
            moveTonearmToPosition(armCurrentZAngle, armCurrentHeight);

            // Vérifier la zone où le bras est déposé
            const dropZone = getVinylZone(armCurrentZAngle);

            // Auto-start at 33 RPM when needle drops
            if (!isRunning) {
                setSpeedAndKnob(RPM_33, set33Btn);
            } else if (dropZone === 'playing') {
                // Resume audio at position corresponding to arm angle
                console.log('🎵 Needle drop - Starting audio at arm position');
                startAudioPlayback(true);
            }

            // Arrêter l'audio si déposé dans zone sans sillon
            if (dropZone === 'label' || dropZone === 'runout' || dropZone === 'off') {
                if (tonePlayer && tonePlayer.state === 'started') {
                    tonePlayer.stop();
                }
            }

            // Animate from dropped position to run-out groove
            const totalAngleRange = ARM_RUNOUT_GROOVE_ANGLE - ARM_START_Z_ANGLE;
            const remainingAngleRange = ARM_RUNOUT_GROOVE_ANGLE - armCurrentZAngle;
            const progressRatio = remainingAngleRange / totalAngleRange;

            if (progressRatio > 0.01) {
                armStartTime = 0;
                currentArmPosition = armCurrentZAngle;

                // Calculate remaining audio duration
                const audioDuration = audioScratcher.isInitialized ? audioScratcher.duration : ARM_TOTAL_PLAY_DURATION_SECONDS;
                const currentAudioPos = getAudioPositionFromArmAngle(armCurrentZAngle);
                const remainingAudioDuration = audioDuration - currentAudioPos;

                // Animation from current position
                const animateFromCurrent = (timestamp) => {
                    if (!armStartTime) armStartTime = timestamp;
                    const elapsedTime = (timestamp - armStartTime) / 1000;

                    if (elapsedTime < remainingAudioDuration) {
                        const progress = elapsedTime / remainingAudioDuration;
                        armCurrentZAngle = currentArmPosition + (ARM_RUNOUT_GROOVE_ANGLE - currentArmPosition) * progress;
                        moveTonearmToPosition(armCurrentZAngle, ARM_HEIGHT_PLAYING);
                        animationFrameId = requestAnimationFrame(animateFromCurrent);
                    } else {
                        moveTonearmToPosition(ARM_RUNOUT_GROOVE_ANGLE, ARM_HEIGHT_PLAYING);
                        if (tonePlayer && tonePlayer.state === 'started') {
                            tonePlayer.stop();
                        }
                    }
                };
                animationFrameId = requestAnimationFrame(animateFromCurrent);
            }

        } else {
            // Return to rest - trigger STOP state
            isArmLifted = false;
            armCurrentZAngle = ARM_REST_Z_ANGLE;
            armCurrentHeight = ARM_HEIGHT_REST;
            moveTonearmToPosition(armCurrentZAngle, armCurrentHeight);
            
            // Stop the turntable when arm returns to rest
            if (isRunning) {
                setSpeedAndKnob(0, setStopBtn);
            }
        }
    };

    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    // ------------------------------------
    // SCRATCH EVENTS (Vinyl)
    // ------------------------------------
    const handleScratchStart = (e) => {
        if (e.target.closest('.vinyl-record')) {
            e.preventDefault();
            e.stopPropagation();

            isScratching = true;
            vinyl.classList.add('scratching');

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            scratchStartAngle = getAngleFromCenter(clientX, clientY, recordContainer);
            scratchLastAngle = scratchStartAngle;
            lastScratchTime = Date.now();

            // Disable 3D Drag
            // Assume we have access to scene drag vars (which we need to handle if we want full module separation)
            // For now, rely on event stopPropagation logic

            let pos = audioScratcher.getPosition();
            audioScratcher.startScratch(pos);
            if (isRunning && tonePlayer && tonePlayer.state === 'started') tonePlayer.stop();

            // Capture Rotation
            const transform = window.getComputedStyle(vinyl).transform;
            if (transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                scratchRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            } else {
                scratchRotation = 0;
            }
            previousScratchRotation = scratchRotation;

            vinyl.style.animation = 'none';

            anchorRotation = scratchRotation;
            anchorAudioTime = audioScratcher.getPosition();
            lastMoveTime = Date.now();

            if (!scratchAnimationFrame) scratchAnimationFrame = requestAnimationFrame(applyScratch);
        }
    };

    vinyl.addEventListener('mousedown', handleScratchStart);
    vinyl.addEventListener('touchstart', handleScratchStart, { passive: false });

    const handleScratchMove = (e) => {
        if (!isScratching) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const currentAngle = getAngleFromCenter(clientX, clientY, recordContainer);
        const angleDelta = normalizeAngleDelta(currentAngle - scratchLastAngle);

        const currentTime = Date.now();
        const timeDelta = Math.max(1, currentTime - lastScratchTime);
        const rawVelocity = angleDelta / timeDelta * 16.67;
        scratchVelocity = rawVelocity;

        scratchRotation += angleDelta;
        vinyl.style.transform = `translate(-50%, -50%) rotateZ(${scratchRotation}deg)`;
        vinyl.style.transition = 'none';
        vinyl.style.willChange = 'transform';

        scratchLastAngle = currentAngle;
        lastMoveTime = Date.now();
        // UI updates (indicator) excluded for brevity/cleanliness
    };

    document.addEventListener('mousemove', handleScratchMove);
    document.addEventListener('touchmove', handleScratchMove, { passive: false });

    const handleScratchEnd = () => {
        if (isScratching) {
            isScratching = false;
            vinyl.classList.remove('scratching');
            audioScratcher.stopScratch();

            if (isRunning) {
                // Resume physics
                const targetVelocity = (360 / getAnimationDuration(currentRPM)) / 60;
                scratchVelocity = Math.abs(scratchVelocity) > targetVelocity * 2
                    ? scratchVelocity * 0.3
                    : targetVelocity * 0.5;
            }

            if (!scratchAnimationFrame && isRunning) {
                scratchAnimationFrame = requestAnimationFrame(applyScratch);
            }
        }
    };

    document.addEventListener('mouseup', handleScratchEnd);
    document.addEventListener('touchend', handleScratchEnd);

    // ------------------------------------
    // UI EVENT LISTENERS
    // ------------------------------------
    set33Btn.addEventListener('click', () => setSpeedAndKnob(RPM_33, set33Btn));
    setStopBtn.addEventListener('click', () => setSpeedAndKnob(0, setStopBtn));
    set45Btn.addEventListener('click', () => setSpeedAndKnob(RPM_45, set45Btn));

    speedPoints.forEach(point => {
        point.addEventListener('click', () => {
            const speed = point.dataset.speed;
            if (speed === '33') setSpeedAndKnob(RPM_33, set33Btn);
            else if (speed === '45') setSpeedAndKnob(RPM_45, set45Btn);
            else setSpeedAndKnob(0, setStopBtn);
        });
    });

    pitchSlider.addEventListener('input', () => {
        if (isRunning) {
            updateAnimation();
            updateAudioPlaybackRate();
        }
    });

    // Arm lift control toggle
    const armLiftLever = document.getElementById('arm-lift-lever');
    const armLiftContainer = document.querySelector('.arm-lift-control-container');
    const armLiftLabel = document.querySelector('.arm-lift-position-label');
    
    if (armLiftLever && armLiftContainer) {
        armLiftLever.addEventListener('click', () => {
            // Toggle arm lift state
            isArmLifted = !isArmLifted;
            
            // Visual feedback
            armLiftContainer.classList.add('active');
            setTimeout(() => armLiftContainer.classList.remove('active'), 500);
            
            // Update label
            if (armLiftLabel) {
                armLiftLabel.textContent = isArmLifted ? 'DOWN' : 'UP';
            }
            
            // Move arm to lifted or playing position
            if (isArmLifted) {
                armCurrentHeight = ARM_HEIGHT_LIFTED;
                moveTonearmToPosition(armCurrentZAngle, ARM_HEIGHT_LIFTED);
            } else {
                armCurrentHeight = ARM_HEIGHT_PLAYING;
                moveTonearmToPosition(armCurrentZAngle, ARM_HEIGHT_PLAYING);
            }
        });
    }

    // Pitch control overlay on interaction
    const pitchControlContainer = document.querySelector('.pitch-control-container');
    const pitchControlBase = document.querySelector('.pitch-control-base');

    if (pitchControlBase) {
        pitchControlBase.addEventListener('mousedown', () => {
            pitchControlContainer?.classList.add('active');
        });

        pitchControlBase.addEventListener('touchstart', () => {
            pitchControlContainer?.classList.add('active');
        });

        document.addEventListener('mouseup', () => {
            pitchControlContainer?.classList.remove('active');
        });

        document.addEventListener('touchend', () => {
            pitchControlContainer?.classList.remove('active');
        });
    }

    // Direction Toggle
    directionBtn.addEventListener('click', () => {
        const now = Date.now();
        // Simple debounce handled by UI speed

        // Capture current rotation
        const transform = getComputedStyle(vinyl).transform;
        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            scratchRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        }

        isReversed = !isReversed;
        directionBtn.classList.toggle('active', isReversed);
        directionBtn.textContent = isReversed ? 'Direction (Forward)' : 'Direction (Reverse)';

        if (tonePlayer && tonePlayer.state === 'started') {
            let pos = audioScratcher.getPosition();
            tonePlayer.stop();
            tonePlayer.reverse = isReversed;
            if (tonePlayer.buffer) pos = Math.max(0, Math.min(pos, tonePlayer.buffer.duration - 0.05));
            tonePlayer.start('+0.05', pos);
        }

        updateAnimationWithCurrentRotation();
    });

    // ------------------------------------
    // SCENE INTERACTION (3D DRAG)
    // ------------------------------------
    let isDraggingScene = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let rotateX = 60; // Initial X rotation
    let rotateZ = 0;  // Initial Z rotation
    const sceneInner = document.querySelector('.scene-inner');

    const handleSceneStart = (e) => {
        // Prevent drag if interacting with controls or vinyl
        if (e.target.closest('.interface-controls') ||
            e.target.closest('.vinyl-record') ||
            e.target.closest('.tonearm-lift-hook')) return;

        isDraggingScene = true;
        previousMouseX = e.touches ? e.touches[0].clientX : e.clientX;
        previousMouseY = e.touches ? e.touches[0].clientY : e.clientY;
    };

    const handleSceneMove = (e) => {
        if (!isDraggingScene) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - previousMouseX;
        const deltaY = clientY - previousMouseY;

        rotateZ -= deltaX * 0.5;
        rotateX += deltaY * 0.5;

        // Clamp X rotation to prevent flipping
        rotateX = Math.max(10, Math.min(85, rotateX));

        if (sceneInner) {
            sceneInner.style.transform = `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`;
        }

        previousMouseX = clientX;
        previousMouseY = clientY;
    };

    const handleSceneEnd = () => {
        isDraggingScene = false;
    };

    document.addEventListener('mousedown', handleSceneStart);
    document.addEventListener('touchstart', handleSceneStart);

    document.addEventListener('mousemove', handleSceneMove);
    document.addEventListener('touchmove', handleSceneMove);

    document.addEventListener('mouseup', handleSceneEnd);
    document.addEventListener('touchend', handleSceneEnd);

    // Debug Toggle
    if (toggleDebugBtn) {
        toggleDebugBtn.addEventListener('click', () => {
            scene.classList.toggle('debug');
            toggleDebugBtn.textContent = scene.classList.contains('debug') ? 'Masquer Debug' : 'Afficher Debug';
            console.log(`🔧 Debug mode: ${scene.classList.contains('debug') ? 'ON' : 'OFF'}`);
        });
    }

    // ------------------------------------
    // INITIALIZATION KICK-OFF
    // ------------------------------------
    setSpeedAndKnob(0, setStopBtn, true); // Initialize stopped

    // Draw arm movement arc in debug mode
    function drawArmArc() {
        const arcPath = document.querySelector('.arm-arc-path');
        const markersGroup = document.querySelector('.arc-angle-markers');
        if (!arcPath) return;

        // Arc showing the path of the tonearm head (needle at the end of the arm)
        // The SVG is now positioned at the pivot location (fixed, doesn't rotate with arm)
        // Center of the arc is at the center of the SVG viewBox
        const centerX = 100;
        const centerY = 100;
        
        // Arm length is 28vmin, but reduced slightly for visual clarity
        // The SVG is 60vmin, so in the viewBox (200x200):
        // 26vmin / 60vmin * 200 = 86.67 units
        const radius = 87; // Slightly reduced from 93
        
        // Arc should start at current needle position and end at run-out groove
        // Adjust to match the yellow crosshair position more precisely
        const adjustedStartAngle = ARM_START_Z_ANGLE + 75; // ~-5° - fine-tuned to align with crosshair
        const startAngle = (adjustedStartAngle + 90) * Math.PI / 180;
        const endAngle = (ARM_RUNOUT_GROOVE_ANGLE + 90) * Math.PI / 180;
        
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);
        
        // Large arc flag: 1 if arc should be > 180°
        // Sweep flag: 1 for clockwise (mirror view)
        const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;
        
        const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        arcPath.setAttribute('d', pathData);
        
        // Draw angle markers
        if (markersGroup) {
            markersGroup.innerHTML = '';
            
            // Draw markers every 15°
            const angleStep = 15;
            for (let angle = adjustedStartAngle; angle <= ARM_RUNOUT_GROOVE_ANGLE; angle += angleStep) {
                const radians = (angle + 90) * Math.PI / 180;
                
                // Outer point (on arc)
                const outerX = centerX + radius * Math.cos(radians);
                const outerY = centerY + radius * Math.sin(radians);
                
                // Inner point (almost to center - very long tick mark)
                const innerX = centerX + 5 * Math.cos(radians); // Just 5 units from center
                const innerY = centerY + 5 * Math.sin(radians);
                
                // Text position (outside the arc)
                const textX = centerX + (radius + 10) * Math.cos(radians);
                const textY = centerY + (radius + 10) * Math.sin(radians);
                
                // Create tick line (from arc towards center)
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', outerX);
                line.setAttribute('y1', outerY);
                line.setAttribute('x2', innerX);
                line.setAttribute('y2', innerY);
                line.setAttribute('stroke', 'rgba(255, 0, 255, 0.6)');
                line.setAttribute('stroke-width', '1');
                markersGroup.appendChild(line);
                
                // Create angle text
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', textX);
                text.setAttribute('y', textY);
                text.setAttribute('font-size', '6');
                text.setAttribute('fill', 'rgba(255, 0, 255, 0.8)');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = `${angle}°`;
                markersGroup.appendChild(text);
            }
        }
    }

    drawArmArc();

    // Preload
    audioScratcher.loadFromAudioElement();
});
