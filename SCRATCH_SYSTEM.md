# 🎵 Système de Scratch Granulaire - Documentation Technique

## Vue d'ensemble

Le système de scratch implémenté utilise la **Web Audio API** avec une technique de **lecture granulaire** pour obtenir une synchronisation ultra-fine entre le mouvement visuel du disque et l'audio.

## Architecture

### 1. Classe `AudioScratcher`

Cette classe centrale gère la lecture audio granulaire :

```javascript
class AudioScratcher {
    constructor(audioContext, audioElement)
    async loadFromAudioElement()
    playGrain(position, playbackRate)
    updatePosition(newPosition, velocity)
    startScratch(currentPosition)
    stopScratch()
    getPosition()
}
```

#### Caractéristiques clés :

- **Grains audio** : Petits segments d'audio (50ms par défaut) joués en séquence
- **Synchronisation 60 FPS** : Mise à jour à chaque frame via `requestAnimationFrame`
- **Position précise** : Contrôle au niveau du sample audio
- **Pas de throttling** : Contrairement à l'ancienne méthode (50ms), chaque mouvement est capturé

### 2. Synchronisation Visuelle-Audio

```
Mouvement souris → Rotation disque → Position audio → Grain audio
      (60 FPS)        (immédiat)      (calculée)      (joué)
```

#### Calcul de la position audio :

```javascript
// 1. Calcul des rotations totales pour la durée du morceau
const totalRotations = (audioBuffer.duration / 60) * (currentRPM / RPM_33);
const totalDegrees = totalRotations * 360;

// 2. Conversion rotation → temps
const rotationDelta = scratchRotation - oldRotation;
const timeDelta = (rotationDelta / totalDegrees) * audioBuffer.duration;

// 3. Nouvelle position
const newTime = currentPosition + timeDelta;
```

### 3. Effet "Back and Forth"

Le système supporte naturellement les mouvements avant-arrière :

- **Vélocité positive** : Lecture avant (sens normal du disque)
- **Vélocité négative** : Lecture arrière (effet scratch)
- **Transition instantanée** : Pas de délai entre les changements de direction

#### Adaptation du playback rate :

```javascript
const playbackRate = Math.max(0.25, Math.min(4, Math.abs(velocity) * 2));
```

Plage : **0.25x à 4x** la vitesse normale

## Avantages par rapport à l'ancienne méthode

| Aspect | Ancienne méthode | Nouvelle méthode (Granulaire) |
|--------|------------------|-------------------------------|
| Fréquence de mise à jour | 20 FPS (50ms throttle) | 60 FPS (aucun throttle) |
| Réactivité | ~50ms de latence | < 17ms (1 frame) |
| Précision | ±50ms | ±1ms |
| Direction inversée | Limitée | Native |
| Smoothness | Saccadé à vitesse lente | Fluide à toute vitesse |

## Paramètres ajustables

### Dans la classe `AudioScratcher` :

```javascript
this.grainDuration = 0.05; // Durée des grains (50ms)
```

- **Plus court (20-30ms)** : Plus réactif mais plus de CPU
- **Plus long (80-100ms)** : Moins de CPU mais légèrement moins fluide

### Dans les constantes de scratch :

```javascript
const SCRATCH_RESISTANCE = 0.92;      // Résistance pendant le scratch
const FRICTION_COEFFICIENT = 0.95;    // Friction après relâchement
```

- **SCRATCH_RESISTANCE** : Plus proche de 1 = plus de "grip" sur le disque
- **FRICTION_COEFFICIENT** : Plus proche de 1 = décélération plus lente

## Comparaison avec les bibliothèques

### Tone.js
- **Avantages** : Très complet, effets audio avancés
- **Inconvénients** : 200KB+, complexe pour un usage simple
- **Notre solution** : Code minimal, contrôle total, <5KB

### Howler.js
- **Avantages** : Simple, compatible
- **Inconvénients** : Pas de support granulaire natif
- **Notre solution** : Granularité native, synchronisation fine

### SoundTouch.js
- **Avantages** : Pitch shifting sans changement de vitesse
- **Inconvénients** : Latence, pas optimisé pour scratch
- **Notre solution** : Latence minimale, optimisé pour interaction temps réel

## Performance

### Utilisation CPU (estimation) :

- **Au repos** : ~0%
- **Pendant scratch rapide** : ~5-10%
- **Mode grain court (20ms)** : ~10-15%

### Optimisations implémentées :

1. ✅ Réutilisation du AudioContext
2. ✅ Arrêt des grains précédents avant nouveau
3. ✅ Limitation des grains en fonction de la vélocité
4. ✅ Fallback sur l'élément HTML audio quand pas de scratch

## Debugging

### Console logs ajoutés :

```javascript
console.log('🎵 Audio buffer chargé pour scratch:', duration, 'secondes');
console.log('✅ Audio scratcher prêt pour le scratch');
```

### Indicateur visuel :

L'indicateur rouge montre :
- **Activation du scratch** : Bordure rouge + icône 🎵
- **Vitesse** : Format `×N.N` (multiplicateur de vitesse)

## Utilisation

1. **Démarrer la lecture** : Cliquer sur 33 ou 45 RPM
2. **Attendre le chargement** : Le buffer se charge automatiquement
3. **Scratcher** : Cliquer-glisser sur le disque
4. **Observer** : Le disque et l'audio suivent parfaitement le mouvement

## Améliorations futures possibles

- [ ] Support du pitch shifting (hauteur constante, vitesse variable)
- [ ] Enregistrement des patterns de scratch
- [ ] Effets audio supplémentaires (reverb, filter)
- [ ] Préchargement de plusieurs pistes
- [ ] Mode "vinyl simulation" avec craquements

## Crédits

**Technique** : Granular Synthesis + Web Audio API  
**Inspiration** : Serato DJ, Traktor, Native Instruments
