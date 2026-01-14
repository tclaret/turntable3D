<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turntable 3D Redesign - Bras Suivant le Sillon (Responsif)</title>
    <style>
/* ------------------------------------ */
/* 0. VARIABLES CSS GLOBALES            */
/* ------------------------------------ */
:root {
    --color-primary: #c0392b; /* Rouge (Active/Accent) */
    --color-base: #555;        /* Gris foncé (Base platine) */
    --color-control: #333;    /* Noir (Contrôles) */
    --pitch-slider-color: #2c3e50;
    --speed-33-duration: 3.00s; /* Durée d'une rotation à 33 RPM */
}

/* ------------------------------------ */
/* 1. CSS Général & Contrôles           */
/* ------------------------------------ */
body {
    background-color: #f0f0f0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    overflow-x: hidden;
    font-family: Arial, sans-serif;
}

.interface-controls {
    width: 100%; 
    background-color: var(--color-control); 
    color: white; 
    padding: 10px 0;
    display: flex; 
    flex-direction: column; 
    align-items: center;
    position: fixed; 
    top: 0; 
    z-index: 100; 
}
.controls-line {
    display: flex; 
    justify-content: center; 
    align-items: center; 
    gap: 15px; 
    padding: 5px 0;
}
.control-btn {
    cursor: pointer; 
    border: none; 
    padding: 8px 12px; 
    border-radius: 4px;
    font-size: 14px; 
    font-weight: bold; 
    background-color: #777; 
    color: white;
    transition: background-color 0.2s;
}
.control-btn.active { 
    background-color: var(--color-primary); 
}
.control-btn:hover { 
    background-color: #999; 
}
.pitch-group { 
    display: flex; 
    align-items: center; 
    gap: 5px; 
    color: #ccc; 
}
.pitch-group label {
    font-size: 14px;
}
.pitch-slider {
    -webkit-appearance: none; 
    width: 100px; 
    height: 10px; 
    background: #999;
    outline: none; 
    border-radius: 5px; 
    padding: 0;
}
.pitch-slider::-webkit-slider-thumb {
    -webkit-appearance: none; 
    appearance: none;
    width: 20px; 
    height: 20px; 
    background: var(--pitch-slider-color); 
    border-radius: 50%; 
    cursor: pointer;
}

/* ------------------------------------ */
/* 2. Scène 3D & Platine (Vue 90°)      */
/* ------------------------------------ */
.scene {
    perspective: 500px; 
    width: 75vw; 
    height: 75vh; 
    position: relative;
    margin-top: 100px;
}
.turntable-base {
    width: 80vw; 
    height: 10vw; 
    background-color: var(--color-base); 
    border-radius: 5px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    position: absolute; 
    bottom: 0; 
    left: 50%;
    transform: translateX(-50%) translateY(3vw) rotateX(70deg) rotateY(90deg); 
    transform-origin: bottom center;
    transform-style: preserve-3d;
    z-index: 5;
}

/* ------------------------------------ */
/* 3. SÉLECTEUR DE VITESSE (Compensation) */
/* ------------------------------------ */
.speed-selector-container {
    position: absolute; 
    left: 50%; 
    top: 0.5vw; 
    transform: translateX(-50%) translateZ(-13vw) rotateX(-70deg) rotateY(-90deg); 
    transform-style: preserve-3d; 
    z-index: 10;
    cursor: pointer;
}
.selector-label {
    transform: translateX(-50%) rotateY(-90deg); 
}
.selector-base {
    width: 8vw; 
    height: 8vw;
    background-image: url('https://tclaret.github.io/turntable/img/ChickenHead.png');
    background-size: cover; 
    background-position: center; 
    background-repeat: no-repeat;
    border-radius: 50%;
    position: relative; 
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5) inset;
}
.selector-knob {
    width: 4vw; 
    height: 4vw; 
    background-color: #000; 
    border-radius: 50%;
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); /* Base 0deg */
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.7); 
    transition: transform 0.3s ease-in-out;
}
.selector-knob::before {
    content: ''; 
    position: absolute; 
    width: 1.8vw; 
    height: 0.6vw;
    background-color: var(--color-primary); 
    top: 0.5vw; 
    left: 50%; 
    transform: translateX(-50%);
    border-radius: 1px;
}

/* ------------------------------------ */
/* 4. BRAS DE LECTURE (Positionnement corrigé) */
/* ------------------------------------ */
.tonearm-container {
    position: absolute;
    left: 50%; 
    top: -5vw; /* Positionnement initial plus haut */
    z-index: 15;
    
    /* translateZ ajusté en fonction du nouveau top, pour le faire apparaître "devant" le disque */
    transform: translateX(-50%) translateZ(10vw) rotateX(-70deg) rotateY(-90deg); 
    transform-style: preserve-3d;
    
    width: 5vw;
    height: 5vw;
    background-color: #222; 
    border-radius: 50%;
    
    transform-origin: center center; 
    pointer-events: none;
    /* La transition CSS est désactivée pour le moment pour gérer le mouvement en JS */
    /* transition: transform 0.5s ease-out; */ 
}

.tonearm-image {
    width: 50vw; /* Ajusté */
    height: 50vw; /* Ajusté */
    position: absolute;
    top: 50%;
    left: 50%;
    
    transform-origin: 85% 50%; 
    transform: translate(-85%, -50%); 
    
    background-image: url('https://tclaret.github.io/turntable/img/BrasDeLecture.png');
    
    background-size: 100% auto;
    background-repeat: no-repeat;
    background-position: left center;
}

/* ------------------------------------ */
/* 5. Disque Vinyle (Compensation)      */
/* ------------------------------------ */
.record-container {
    width: 65vw; height: 65vw; /* Ajusté */
    position: absolute; 
    top: 55%; 
    left: 50%;
    transform: translate(-50%, -50%) rotateX(70deg) rotateY(90deg);
    transform-style: preserve-3d; transform-origin: center center;
    background-color: #888; border-radius: 50%;
    z-index: 1; 
}

.platter {
    width: 90%; height: 90%; background-color: #444; border-radius: 50%;
    position: absolute; top: 50%; left: 50%; 
    transform: translate(-50%, -50%) rotateY(-90deg); 
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.vinyl-record {
    width: 90%; height: 90%; border-radius: 50%;
    background-image: url('https://tclaret.github.io/turntable/img/DISC.png');
    background-size: cover; background-position: center; background-repeat: no-repeat;
    border: 0.5vw solid #0a0a0a; box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
    position: absolute; top: 50%; left: 50%; 
    transform: translate(-50%, -50%) rotateY(-90deg); 
    animation: spin var(--speed-33-duration) linear infinite running; 
    transform-origin: center center;
}

.vinyl-record::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotateY(-90deg); 
    width: 1.5vw; height: 1.5vw;
    border-radius: 50%; background-color: #000; z-index: 2;
}

@keyframes spin {
    from { transform: translate(-50%, -50%) rotateY(-90deg) rotateZ(0deg); }
    to { transform: translate(-50%, -50%) rotateY(-90deg) rotateZ(360deg); }
}
@keyframes spin-reverse {
    from { transform: translate(-50%, -50%) rotateY(-90deg) rotateZ(0deg); }
    to { transform: translate(-50%, -50%) rotateY(-90deg) rotateZ(-360deg); }
}
    </style>
</head>
<body>
    
    <div class="interface-controls">
        <div class="controls-line">
            <button id="set33-btn" class="control-btn">SET 33 RPM</button>
            <button id="setstop-btn" class="control-btn active">SET STOP</button>
            <button id="set45-btn" class="control-btn">SET 45 RPM</button>
        </div>

        <div class="controls-line">
            <button id="direction-btn" class="control-btn">Direction (Reverse)</button>
            <div class="pitch-group">
                <label for="pitch-slider">Pitch (Vitesse):</label>
                <input type="range" id="pitch-slider" class="pitch-slider" min="0.5" max="1.5" step="0.01" value="1.0" aria-label="Contrôle du pitch de la vitesse de lecture">
            </div>
        </div>
    </div>

    <div class="scene">
        <div class="turntable-base">
            <div class="speed-selector-container">
                <div class="selector-label">33 — STOP — 45</div>
                <div class="selector-base">
                    <div id="speed-knob" class="selector-knob"></div>
                </div>
            </div>

            <div id="tonearm-container" class="tonearm-container">
                <div class="tonearm-image">
                </div>
            </div>
        </div>
        <div class="record-container">
            <div class="platter"></div>
            <div class="vinyl-record"></div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const vinyl = document.querySelector('.vinyl-record');
            const knob = document.getElementById('speed-knob');
            const set33Btn = document.getElementById('set33-btn');
            const setStopBtn = document.getElementById('setstop-btn');
            const set45Btn = document.getElementById('set45-btn');
            const directionBtn = document.getElementById('direction-btn');
            const pitchSlider = document.getElementById('pitch-slider');
            const tonearmContainer = document.getElementById('tonearm-container'); 

            const RPM_33 = 33.33;
            const RPM_45 = 45;
            const BASE_DURATION = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--speed-33-duration').replace('s', ''));

            let isRunning = false;
            let currentSpeedDuration = BASE_DURATION; 
            let isReversed = false;

            // Variables pour l'animation du bras
            let animationFrameId = null;
            let armStartTime = 0;
            // Angles Z de début et de fin pour le mouvement du bras
            // Ces valeurs devront être ajustées avec précision
            const ARM_START_Z_ANGLE = -10; // Position sur le sillon extérieur
            const ARM_END_Z_ANGLE = 30;    // Position vers le centre (à ajuster)
            const ARM_TOTAL_PLAY_DURATION_SECONDS = 120; // Durée totale du morceau simulé (en secondes)


            function getAnimationDuration(rpm) {
                if (rpm === 0) return 1000;
                const duration = BASE_DURATION * (RPM_33 / rpm);
                return duration.toFixed(2);
            }

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
            }

            // Fonction d'animation du bras
            function animateTonearm(timestamp) {
                if (!armStartTime) armStartTime = timestamp;
                const elapsedTime = (timestamp - armStartTime) / 1000; // en secondes

                if (elapsedTime < ARM_TOTAL_PLAY_DURATION_SECONDS) {
                    const progress = elapsedTime / ARM_TOTAL_PLAY_DURATION_SECONDS;
                    const currentArmZAngle = ARM_START_Z_ANGLE + (ARM_END_Z_ANGLE - ARM_START_Z_ANGLE) * progress;
                    
                    // Appliquez la transformation incluant la rotation Z progressive
                    tonearmContainer.style.transform = `translateX(-50%) translateZ(10vw) rotateX(-70deg) rotateY(-90deg) rotateZ(${currentArmZAngle}deg)`;
                    
                    animationFrameId = requestAnimationFrame(animateTonearm);
                } else {
                    // Fin de la lecture, le bras reste au centre
                    tonearmContainer.style.transform = `translateX(-50%) translateZ(10vw) rotateX(-70deg) rotateY(-90deg) rotateZ(${ARM_END_Z_ANGLE}deg)`;
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }

            function setSpeedAndKnob(rpm, button) {
                [set33Btn, setStopBtn, set45Btn].forEach(btn => btn.classList.remove('active'));

                let knobRotation = 0;
                let armRotationZ; 

                if (rpm === RPM_33 || rpm === RPM_45) {
                    currentSpeedDuration = getAnimationDuration(rpm);
                    isRunning = true;
                    knobRotation = (rpm === RPM_33) ? -30 : 30;
                    
                    // Initialisation du bras au début de la lecture
                    armRotationZ = ARM_START_Z_ANGLE; 
                    armStartTime = 0; // Réinitialiser le temps de départ pour la nouvelle lecture
                    if (animationFrameId) cancelAnimationFrame(animationFrameId);
                    animationFrameId = requestAnimationFrame(animateTonearm);

                } else { // STOP (rpm = 0)
                    currentSpeedDuration = 0;
                    isRunning = false;
                    knobRotation = 0;
                    // Position "Stop" : complétement à droite, hors du disque
                    armRotationZ = -60; 
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                }

                knob.style.transform = `translate(-50%, -50%) rotateZ(${knobRotation}deg)`;
                button.classList.add('active');

                // Si en mode STOP, appliquer la rotation Z fixe
                if (!isRunning) {
                     tonearmContainer.style.transform = `translateX(-50%) translateZ(10vw) rotateX(-70deg) rotateY(-90deg) rotateZ(${armRotationZ}deg)`;
                }
               
                updateAnimation();
            }

            // Événements
            set33Btn.addEventListener('click', () => setSpeedAndKnob(RPM_33, set33Btn));
            setStopBtn.addEventListener('click', () => setSpeedAndKnob(0, setStopBtn));
            set45Btn.addEventListener('click', () => setSpeedAndKnob(RPM_45, set45Btn));

            pitchSlider.addEventListener('input', () => {
                if (isRunning) {
                    // Le pitch affecte la durée du morceau, donc l'animation du bras
                    // Vous devrez recalculer ARM_TOTAL_PLAY_DURATION_SECONDS ici si vous voulez que le pitch l'affecte.
                    updateAnimation();
                }
            });

            directionBtn.addEventListener('click', () => {
                isReversed = !isReversed;
                directionBtn.classList.toggle('active', isReversed);
                directionBtn.textContent = isReversed ? 'Direction (Forward)' : 'Direction (Reverse)';
                updateAnimation();
            });

            // Initialisation à l'arrêt
            setSpeedAndKnob(0, setStopBtn);
        });
    </script>
</body>
</html>
