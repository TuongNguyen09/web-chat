# 🌓 Dark Mode - Quick Reference Card

## 🔑 Essential Info

### **Location of Toggle Button**
👉 **Sidebar Header** - Top right area with icons
- Light mode: ☀️ Sun icon
- Dark mode: 🌙 Moon icon

### **Redux State Path**
```javascript
store.getState().theme.mode  // 'light' | 'dark'
```

### **localStorage Key**
```javascript
localStorage.getItem('theme')  // 'light' | 'dark'
```

### **HTML Class**
```html
<!-- Light mode -->
<html>

<!-- Dark mode -->
<html class="dark">
```

---

## 🎨 Color Palette (Quick Ref)

### **Light Mode**
```css
bg-white, bg-gray-50, bg-gray-100
text-gray-800, text-gray-600, text-gray-500
border-gray-200, border-gray-300
```

### **Dark Mode**
```css
dark:bg-gray-900, dark:bg-gray-800, dark:bg-gray-700
dark:text-white, dark:text-gray-200, dark:text-gray-400
dark:border-gray-700, dark:border-gray-600
```

---

## 💻 Code Patterns

### **Add to Component**
```jsx
// Light + Dark
<div className="
  bg-white dark:bg-gray-900
  text-gray-800 dark:text-white
  border-gray-200 dark:border-gray-700
  hover:bg-gray-100 dark:hover:bg-gray-800
">
```

### **Use Redux State**
```jsx
const { mode } = useSelector(state => state.theme);
// Use mode: 'light' | 'dark'
```

### **Dispatch Action**
```jsx
const dispatch = useDispatch();
dispatch(toggleTheme());
```

---

## 📁 File Locations

| Purpose | File |
|---------|------|
| Toggle Button | `src/components/ThemeToggle/index.jsx` |
| Actions | `src/redux/theme/action.js` |
| Reducer | `src/redux/theme/reducer.js` |
| Store Config | `src/redux/store.js` |
| Tailwind Config | `tailwind.config.js` |
| Global Styles | `src/index.css` |

---

## 🔄 Flow Summary

```
User clicks toggle
   ↓
toggleTheme() dispatched
   ↓
localStorage saved
   ↓
HTML class updated
   ↓
Tailwind dark: classes activate
   ↓
UI updates (300ms smooth)
```

---

## ✅ Checklist for New Component

- [ ] Add `dark:` classes for backgrounds
- [ ] Add `dark:` classes for text colors
- [ ] Add `dark:` classes for borders
- [ ] Add `dark:` classes for hover/focus
- [ ] Add `dark:` classes for icons
- [ ] Test in light mode
- [ ] Test in dark mode

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Dark mode not applying | Check if `dark` class on `<html>` |
| Theme not saving | Check localStorage: `localStorage.getItem('theme')` |
| Component missing dark style | Add `dark:` classes to missing elements |
| Wrong colors in dark | Update color values in component or tailwind.config.js |
| No smooth transition | Check if `transition-colors duration-300` in index.css |

---

## 📊 Redux Dispatch Quick Guide

```javascript
// Toggle between light/dark
dispatch(toggleTheme())

// Set specific mode
dispatch(setTheme('light'))
dispatch(setTheme('dark'))

// Initialize (runs on app load)
dispatch(initializeTheme())
```

---

## 🎨 Message Bubble Colors

### **Own Messages**
- Light: `#bde8c4` (light green)
- Dark: `#056162` (dark teal)

### **Other Messages**
- Light: `#ffffff` (white)
- Dark: `#2a2a2a` (dark gray)

Edit: `src/components/MessageCard/index.jsx` line ~33 (BUBBLE_PALETTE)

---

## 🔧 Testing Quick Commands

```javascript
// Check Redux state
store.getState().theme.mode

// Check localStorage
localStorage.getItem('theme')

// Check HTML class
document.documentElement.classList.contains('dark')

// Manual toggle in console
localStorage.setItem('theme', 'dark')
document.documentElement.classList.add('dark')
```

---

## 📱 Responsive Dark Classes

```jsx
// Combine responsive + dark
<div className="
  bg-white dark:bg-gray-900
  md:bg-gray-50 md:dark:bg-gray-800
  lg:bg-white lg:dark:bg-gray-900
">
```

---

## 🎯 Where Are Dark Mode Features Used?

| Component | Files |
|-----------|-------|
| Toggle Button | SidePanel.jsx |
| Chat Messages | ChatBox.jsx, MessageCard.jsx |
| Chat List | ChatCard.jsx, SidePanel.jsx |
| Input Area | ChatBox.jsx |
| Empty State | EmptyChatState.jsx |
| Icons | All components |

---

## 💾 Data Persistence

```javascript
// Saved automatically when toggle button clicked
localStorage.setItem('theme', mode)

// Restored automatically on app load
const savedTheme = localStorage.getItem('theme')

// If not found, system preference used
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
```

---

## 🚀 Deploy Notes

✅ Dark mode is production ready
✅ No environment variables needed
✅ No backend changes required
✅ Works offline (uses localStorage)
✅ No browser compatibility issues
✅ No additional assets needed

---

## 🔗 Documentation Links

- **Quick Start**: README_DARK_MODE.md
- **Full Guide**: DARK_MODE_GUIDE.md
- **Code Patterns**: DARK_MODE_CHEATSHEET.md
- **Architecture**: DARK_MODE_ARCHITECTURE.md
- **Index**: DARK_MODE_INDEX.md

---

## 📞 Quick Troubleshooting

**Q: Dark mode button not visible?**
A: Check SidePanel.jsx - should import ThemeToggle

**Q: Theme not persisting?**
A: Check localStorage isn't blocked

**Q: Colors look wrong?**
A: Check BUBBLE_PALETTE in MessageCard.jsx

**Q: No smooth transition?**
A: Check index.css has `transition-colors duration-300`

---

## ⚡ Performance Notes

- CSS transitions: 300ms
- DOM operations: O(1)
- Re-renders: Only on dispatch
- Bundle impact: ~2KB
- Runtime impact: Negligible

---

## 🎓 Learning Resources

- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Redux](https://redux.js.org/)
- [localStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**Created:** January 24, 2026
**Last Updated:** January 24, 2026
**Laminated?** Print this if needed! 📄

---

*Print this card and keep it on your desk! 🌓*
