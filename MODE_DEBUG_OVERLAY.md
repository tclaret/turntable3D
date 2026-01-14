# 🔧 Mode Debug pour l'Overlay de Scratch

## ✅ Modifications Effectuées

L'affichage de la vitesse et de l'overlay rouge lors du changement de vitesse sont maintenant **masqués par défaut** et ne s'affichent qu'en **mode debug**.

## 📁 Fichiers Modifiés

### 1. **index.html** (Version principale)
- ✅ Ajout d'un toggle "Afficher overlay scratch" dans les contrôles debug
- ✅ L'overlay ne s'affiche que si le mode debug est activé
- ✅ L'indicateur de vitesse est conditionné au mode debug

### 2. **scratch-tonejs.html** (Version Tone.js)
- ✅ Ajout d'un toggle "🔧 Mode Debug : Afficher overlay scratch"
- ✅ L'overlay rouge ne s'affiche que si activé
- ✅ Comportement cohérent avec la version principale

### 3. **scratch-pizzicato.html** (Version Pizzicato.js)
- ✅ Ajout d'un toggle "🔧 Mode Debug : Afficher overlay scratch"
- ✅ L'overlay ne s'affiche que si activé
- ✅ Comportement cohérent avec les autres versions

## 🎯 Comment Utiliser

### Par Défaut (Mode Normal)
- L'overlay rouge **ne s'affiche pas** pendant le scratch
- L'indicateur de vitesse **ne s'affiche pas**
- Expérience utilisateur épurée

### En Mode Debug
1. Cochez la case "Afficher overlay scratch" dans les contrôles
2. L'overlay rouge apparaîtra lors du scratch
3. La vitesse sera affichée (×1.0, ×2.5, etc.)

## 📸 Localisation du Toggle

### Dans index.html
Le toggle se trouve dans le panneau **"Infos Debug"** (coin supérieur droit) :
```
☑️ Afficher overlay scratch
```

### Dans scratch-tonejs.html et scratch-pizzicato.html
Le toggle se trouve dans le panneau **"💡 Fonctionnalités"** :
```
☑️ 🔧 Mode Debug : Afficher overlay scratch
```

## 🧪 Test de Fonctionnement

### Pour tester :
1. Ouvrir un des fichiers HTML
2. Charger un fichier audio
3. Scratcher le disque → **Pas d'overlay** ✅
4. Activer le mode debug (cocher la case)
5. Scratcher à nouveau → **Overlay visible** ✅

## 💡 Avantages

### Mode Normal (Par défaut)
- ✨ Interface épurée
- 🎨 Focus sur le disque vinyle
- 🎵 Expérience immersive
- 👥 Idéal pour démonstration publique

### Mode Debug
- 🔧 Voir la vélocité en temps réel
- 📊 Vérifier la synchronisation
- 🐛 Débugger les problèmes
- 👨‍💻 Idéal pour développement

## 🔍 Détails Techniques

### Code Ajouté

#### HTML (Toggle)
```html
<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; background: rgba(255, 107, 107, 0.1); border-radius: 5px; margin-bottom: 10px;">
    <input type="checkbox" id="debug-scratch-overlay" style="cursor: pointer;">
    <span>Afficher overlay scratch</span>
</label>
```

#### JavaScript (Logique)
```javascript
// Variable de mode debug
let debugScratchOverlay = false;

// Lier le toggle
const debugScratchToggle = document.getElementById('debug-scratch-overlay');
if (debugScratchToggle) {
    debugScratchToggle.addEventListener('change', (e) => {
        debugScratchOverlay = e.target.checked;
        console.log(`🔧 Mode debug overlay scratch: ${debugScratchOverlay ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    });
}

// Conditionner l'affichage
function updateScratchIndicator(velocity) {
    // Afficher l'overlay seulement si le mode debug est activé
    if (!debugScratchOverlay) return;
    
    // ... reste du code ...
}
```

## ✅ Résultat

**Comportement par défaut** : Overlay masqué ✨  
**Activation debug** : Overlay visible 🔧  
**Cohérence** : Les 3 versions ont le même comportement ✅

---

**Date** : 2026-01-11  
**Modification** : Mode debug pour overlay de scratch  
**Status** : ✅ Implémenté dans les 3 versions
