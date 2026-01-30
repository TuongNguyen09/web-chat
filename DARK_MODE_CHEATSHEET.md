# 🎨 Dark Mode - Cheat Sheet

## 🌓 Quick Reference

### **File Locations**
```
Theme Logic:
├── src/redux/theme/actionType.js  ← Action types
├── src/redux/theme/action.js      ← Redux actions
├── src/redux/theme/reducer.js     ← State management
└── src/redux/store.js              ← Store integration

UI Component:
└── src/components/ThemeToggle/    ← Sun/Moon button

Styling:
├── tailwind.config.js              ← dark mode config
├── src/index.css                   ← Global styles
└── All component files             ← dark: classes

Documentation:
├── DARK_MODE_GUIDE.md              ← Detailed guide
└── DARK_MODE_SUMMARY.md            ← This file
```

---

## 🔧 How to Use in Components

### **Dispatch Toggle**
```jsx
import { useDispatch } from 'react-redux';
import { toggleTheme } from '../../redux/theme/action';

const MyComponent = () => {
  const dispatch = useDispatch();
  
  const handleClick = () => {
    dispatch(toggleTheme());
  };
};
```

### **Read Theme State**
```jsx
import { useSelector } from 'react-redux';

const MyComponent = () => {
  const { mode } = useSelector(state => state.theme);
  
  return <div>{mode === 'dark' ? '🌙' : '☀️'}</div>;
};
```

### **Add Dark Classes**
```jsx
// Before
<div className="bg-white text-gray-800">

// After
<div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
```

---

## 🎨 Common Dark Classes

### **Backgrounds**
| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-900` |
| `bg-gray-50` | `dark:bg-gray-800` |
| `bg-gray-100` | `dark:bg-gray-700` |
| `bg-[#f0f2f5]` | `dark:bg-gray-800` |

### **Text**
| Light | Dark |
|-------|------|
| `text-gray-800` | `dark:text-white` |
| `text-gray-600` | `dark:text-gray-200` |
| `text-gray-500` | `dark:text-gray-400` |

### **Borders**
| Light | Dark |
|-------|------|
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-300` | `dark:border-gray-600` |

### **Hover States**
| Light | Dark |
|-------|------|
| `hover:bg-gray-100` | `dark:hover:bg-gray-800` |
| `hover:text-gray-900` | `dark:hover:text-gray-100` |

### **Focus States**
| Light | Dark |
|-------|------|
| `focus:bg-white` | `dark:focus:bg-gray-700` |
| `focus:ring-gray-400` | `dark:focus:ring-blue-500` |

---

## 📋 Checklist for New Components

- [ ] Background colors have dark: variants
- [ ] Text colors have dark: variants
- [ ] Border colors have dark: variants
- [ ] Hover states have dark: variants
- [ ] Focus/active states have dark: variants
- [ ] Icons have dark: color classes
- [ ] Placeholder text has dark: variant
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] No hardcoded colors used

---

## 🔍 Testing Dark Mode

### **Manual Testing**
1. Open app in browser
2. Look for Sun/Moon icon in top right of sidebar
3. Click to toggle between light and dark
4. Check all pages and components
5. Refresh page - theme should persist

### **Check DOM**
```javascript
// In browser console
document.documentElement.classList.contains('dark')  // true/false

// Check Redux state
// Open Redux DevTools → theme slice → mode property
```

### **Check LocalStorage**
```javascript
// In browser console
localStorage.getItem('theme')  // 'light' or 'dark'
```

---

## 🎯 Color Palette Reference

### **WhatsApp-Inspired**
```
Primary Green: #25D366 (stays same in both modes)
Light Green: #00a884, #008f75
Dark Teal: #056162 (dark mode message own)

Light Mode:
- Background: #ffffff, #f0f2f5, #efeae2
- Text: #000000, #333333

Dark Mode:
- Background: #1a1a1a, #0f0f0f, #2a2a2a
- Text: #ffffff, #e0e0e0
```

---

## 💾 LocalStorage

```javascript
// Key
'theme'

// Possible Values
'light'  // Light mode
'dark'   // Dark mode

// Access
localStorage.getItem('theme')
localStorage.setItem('theme', 'dark')
localStorage.removeItem('theme')
```

---

## 🚨 Common Mistakes

❌ **DON'T:**
```jsx
// Hardcoding colors
<div style={{ backgroundColor: '#ffffff' }}>

// Missing dark variant
<div className="bg-white"> {/* 😞 No dark:bg-gray-900 */}

// Using only opposite color
<div className="dark:bg-white text-white"> {/* Wrong! */}
```

✅ **DO:**
```jsx
// Use Tailwind classes
<div className="bg-white dark:bg-gray-900">

// Always add dark variant
<div className="bg-white dark:bg-gray-900">

// Correct light/dark pairs
<div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
```

---

## 📱 Responsive + Dark Mode

```jsx
// Combine responsive and dark classes
<div className="
  bg-white dark:bg-gray-900
  md:bg-gray-50 md:dark:bg-gray-800
  text-gray-800 dark:text-white
">
```

---

## 🔗 Redux Flow

```
Component Click
    ↓
dispatch(toggleTheme())
    ↓
action.js: updateDOMTheme(newMode)
    ↓
localStorage.setItem('theme', newMode)
    ↓
document.documentElement.classList.add('dark') or .remove('dark')
    ↓
Dispatch action to reducer
    ↓
Redux state updates: mode = 'light' | 'dark'
    ↓
Components re-render with new classes applied
```

---

## 📝 Code Snippets

### **Toggle Button (Already Implemented)**
```jsx
import { BsSun, BsMoon } from 'react-icons/bs';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { mode } = useSelector(state => state.theme);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className={mode === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200'}
    >
      {mode === 'light' ? <BsMoon /> : <BsSun />}
    </button>
  );
};
```

### **Custom Hook (Optional)**
```jsx
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, setTheme } from '../redux/theme/action';

export const useTheme = () => {
  const dispatch = useDispatch();
  const { mode } = useSelector(state => state.theme);

  return {
    mode,
    toggle: () => dispatch(toggleTheme()),
    setLight: () => dispatch(setTheme('light')),
    setDark: () => dispatch(setTheme('dark')),
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };
};
```

---

## 🎓 Learning Resources

- **Tailwind Dark Mode**: https://tailwindcss.com/docs/dark-mode
- **Redux**: https://redux.js.org/
- **localStorage API**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **prefers-color-scheme**: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme

---

## ⚡ Performance Tips

1. **CSS Transitions** - Already optimized to 300ms
2. **No Re-renders** - Tailwind classes switch without component re-render
3. **No Extra Scripts** - Pure CSS solution
4. **Small Bundle** - No additional packages needed

---

## 🤝 Contributing

When adding new components:
1. Copy dark class pattern from existing components
2. Use the color palette reference above
3. Test in both light and dark modes
4. Update this cheat sheet if new patterns emerge

---

**Last Updated:** January 24, 2026
**Version:** 1.0
**Status:** ✅ Complete
