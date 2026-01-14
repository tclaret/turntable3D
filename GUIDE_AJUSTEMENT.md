# 🎛️ Guide d'Ajustement du Scratch

## 🎯 Paramètres Principaux

### 1. Durée des Grains (`grainDuration`)

**Localisation** : Ligne ~1729 dans `index.html`

```javascript
this.grainDuration = 0.05; // 50ms par défaut
```

#### Effets :
- **Plus court (20-30ms)** :
  - ✅ Plus réactif
  - ✅ Meilleure précision
  - ❌ Plus de CPU (~15%)
  - ❌ Peut créer des "clics" si trop court

- **Plus long (80-100ms)** :
  - ✅ Moins de CPU (~5%)
  - ✅ Plus stable
  - ❌ Légèrement moins fluide
  - ❌ Peut sembler "en retard"

#### Valeurs recommandées :
```javascript
this.grainDuration = 0.050; // Défaut - Équilibré ⭐
this.grainDuration = 0.030; // Performance - Très réactif 🚀
this.grainDuration = 0.080; // Économie CPU - Stable 💡
```

---

### 2. Résistance du Scratch (`SCRATCH_RESISTANCE`)

**Localisation** : Ligne ~1880 dans `index.html`

```javascript
const SCRATCH_RESISTANCE = 0.92; // 0 à 1
```

#### Effets :
- **Plus élevé (0.95-0.98)** :
  - Disque plus "collant"
  - Suit mieux le mouvement
  - Moins d'inertie

- **Plus faible (0.80-0.85)** :
  - Disque plus "libre"
  - Plus d'effet vinyle réel
  - Plus d'inertie après relâchement

#### Valeurs recommandées :
```javascript
const SCRATCH_RESISTANCE = 0.92; // Défaut - Équilibré ⭐
const SCRATCH_RESISTANCE = 0.95; // DJ Pro - Très réactif 🎵
const SCRATCH_RESISTANCE = 0.85; // Vinyle Réel - Plus naturel 💿
```

---

### 3. Friction (`FRICTION_COEFFICIENT`)

**Localisation** : Ligne ~1881 dans `index.html`

```javascript
const FRICTION_COEFFICIENT = 0.95; // 0 à 1
```

#### Effets :
- **Plus élevé (0.97-0.99)** :
  - Décélération très lente
  - Effet "flottant"
  - Prend du temps à s'arrêter

- **Plus faible (0.85-0.90)** :
  - Décélération rapide
  - Effet "freinage"
  - S'arrête vite après relâchement

#### Valeurs recommandées :
```javascript
const FRICTION_COEFFICIENT = 0.95; // Défaut - Équilibré ⭐
const FRICTION_COEFFICIENT = 0.98; // Longue décélération 🌊
const FRICTION_COEFFICIENT = 0.88; // Arrêt rapide ⚡
```

---

### 4. Plage de Vitesse (Playback Rate)

**Localisation** : Ligne ~2002 dans `index.html`

```javascript
const playbackRate = Math.max(0.25, Math.min(4, Math.abs(velocity) * 2));
```

#### Ajustements possibles :

**Pour sons plus graves/aigus :**
```javascript
// Plus large (sons plus extrêmes)
const playbackRate = Math.max(0.1, Math.min(8, Math.abs(velocity) * 3));

// Plus étroit (sons moins extrêmes)
const playbackRate = Math.max(0.5, Math.min(2, Math.abs(velocity) * 1.5));
```

---

## 🎨 Personnalisations Visuelles

### Couleur du Glow

**Localisation** : Ligne ~1093 dans `index.html`

```css
.vinyl-record.scratching {
    box-shadow: 0 0 45px rgba(192, 57, 43, 0.95), 0 0 80px rgba(231, 76, 60, 0.5);
}
```

**Variantes :**
```css
/* Bleu DJ */
box-shadow: 0 0 45px rgba(52, 152, 219, 0.95), 0 0 80px rgba(41, 128, 185, 0.5);

/* Vert Matrix */
box-shadow: 0 0 45px rgba(46, 204, 113, 0.95), 0 0 80px rgba(39, 174, 96, 0.5);

/* Violet Neon */
box-shadow: 0 0 45px rgba(155, 89, 182, 0.95), 0 0 80px rgba(142, 68, 173, 0.5);
```

---

### Indicateur de Scratch

**Localisation** : Ligne ~1119 dans `index.html`

```css
.scratch-indicator {
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(192, 57, 43, 0.8);
}
```

**Variantes :**
```css
/* Minimal transparent */
background: rgba(0, 0, 0, 0.3);
border: 1px solid rgba(255, 255, 255, 0.3);

/* Opaque plein */
background: rgba(0, 0, 0, 0.95);
border: 3px solid rgba(192, 57, 43, 1);
```

---

## 🧪 Tests et Validation

### Console du Navigateur

Ouvrir la console (F12) et vérifier :

```javascript
✅ Audio buffer chargé pour scratch: 180.5 secondes
✅ Audio scratcher prêt pour le scratch
```

### Tests de Performance

```javascript
// Dans la console, pendant un scratch :
performance.now(); // Noter le temps
// Scratcher pendant 5 secondes
performance.now(); // Recalculer - devrait être ~5000ms
```

### Mesure CPU

1. Ouvrir DevTools (F12)
2. Onglet "Performance"
3. Cliquer "Record"
4. Scratcher pendant 10 secondes
5. Arrêter l'enregistrement
6. Vérifier "Main thread" < 15%

---

## 🎯 Profils Recommandés

### Profil "DJ Pro" (Réactivité maximale)
```javascript
this.grainDuration = 0.030;
const SCRATCH_RESISTANCE = 0.95;
const FRICTION_COEFFICIENT = 0.90;
const playbackRate = Math.max(0.25, Math.min(6, Math.abs(velocity) * 2.5));
```

### Profil "Vinyle Réel" (Naturel)
```javascript
this.grainDuration = 0.050;
const SCRATCH_RESISTANCE = 0.88;
const FRICTION_COEFFICIENT = 0.93;
const playbackRate = Math.max(0.5, Math.min(3, Math.abs(velocity) * 1.8));
```

### Profil "Performance" (CPU faible)
```javascript
this.grainDuration = 0.080;
const SCRATCH_RESISTANCE = 0.90;
const FRICTION_COEFFICIENT = 0.95;
const playbackRate = Math.max(0.5, Math.min(2, Math.abs(velocity) * 1.5));
```

---

## 🔍 Diagnostic

### Problème : Audio saccadé

**Causes possibles :**
- Grains trop courts → Augmenter à 60-80ms
- CPU surchargé → Fermer autres onglets
- Buffer audio non chargé → Vérifier console

### Problème : Latence perceptible

**Solutions :**
- Réduire grains à 30-40ms
- Augmenter SCRATCH_RESISTANCE à 0.95
- Vérifier que throttling est désactivé

### Problème : Pas de son pendant scratch

**Vérifications :**
1. Console : "✅ Audio scratcher prêt" ?
2. Fichier MP3 chargé ?
3. AudioContext non bloqué par navigateur ?

---

## 📊 Métriques Idéales

| Métrique | Valeur cible | Méthode de mesure |
|----------|--------------|-------------------|
| Latence | < 20ms | DevTools Performance |
| CPU | < 15% | Task Manager |
| FPS | 60 | Compteur FPS navigateur |
| Smooth | Aucun saut | Test visuel |

---

## 💡 Conseils

1. **Tester après chaque changement** - Les paramètres interagissent entre eux
2. **Utiliser la console** - Elle affiche les erreurs et confirmations
3. **Commencer par le défaut** - Les valeurs par défaut sont optimisées
4. **Adapter à votre machine** - Ajuster selon performances CPU
5. **Tester sur mobile** - Le tactile peut nécessiter ajustements

---

**Note** : Après modification, rafraîchir la page (Ctrl+R) pour appliquer les changements.
