# 🌙 Dark Mode Implementation Guide

## Tổng Quan
Dự án đã được cập nhật với tính năng **Dark Mode (Chế độ tối)** hoàn chỉnh. Hệ thống sử dụng **Redux** để quản lý trạng thái theme và **Tailwind CSS** cho styling.

---

## 🏗️ Cấu Trúc Implementation

### 1. **Redux Theme Management**
```
src/redux/theme/
├── actionType.js       # Action constants
├── action.js           # Redux actions (toggleTheme, setTheme, initializeTheme)
└── reducer.js          # Theme reducer
```

**Features:**
- ✅ Lưu theme preference vào `localStorage`
- ✅ Phát hiện system dark mode preference
- ✅ Update DOM class `dark` tự động
- ✅ Persistent across sessions

### 2. **ThemeToggle Component**
```jsx
// src/components/ThemeToggle/index.jsx
- Button với Sun/Moon icon
- Dùng react-icons (BsSun, BsMoon)
- Auto update based on Redux state
- Responsive styling với dark: prefix
```

### 3. **Tailwind Configuration**
```javascript
// tailwind.config.js
darkMode: 'class'  // Enable class-based dark mode
```

---

## 🎨 Dark Mode Styling Convention

### Cách Áp Dụng Dark Classes:

```jsx
// Light mode -> Dark mode
<div className="bg-white dark:bg-gray-900">
<div className="text-gray-800 dark:text-white">
<div className="border-gray-200 dark:border-gray-700">
```

### Color Palette:

**Backgrounds:**
- Light: `white`, `bg-gray-50`, `bg-gray-100`
- Dark: `dark:bg-gray-900`, `dark:bg-gray-800`, `dark:bg-gray-700`

**Text:**
- Light: `text-gray-800`, `text-gray-600`
- Dark: `dark:text-white`, `dark:text-gray-200`, `dark:text-gray-400`

**Borders:**
- Light: `border-gray-200`
- Dark: `dark:border-gray-700`

---

## 📝 Updated Components

### 1. **SidePanel.jsx**
- ✅ Thêm ThemeToggle button
- ✅ Dark mode styling cho header, search, chat list
- ✅ Smooth transitions

### 2. **ChatBox.jsx**
- ✅ Dark background cho chat area
- ✅ Dark styling cho input area
- ✅ Icon color adjustments

### 3. **MessageCard.jsx**
- ✅ Message bubble colors (own & other)
- ✅ Text color adjustments
- ✅ Time stamp styling

### 4. **ChatCard.jsx**
- ✅ Hover state colors
- ✅ Text styling cho online/offline status
- ✅ Unread badge colors

### 5. **EmptyChatState.jsx**
- ✅ Empty state background color
- ✅ Text color for light/dark mode

---

## 🚀 Cách Sử Dụng

### Initialization (Automatic)
```jsx
// App.jsx - Theme initialized on app startup
useEffect(() => {
  dispatch(initializeTheme()); // Tự động load saved theme
}, [dispatch]);
```

### Toggle Theme
```jsx
// Click ThemeToggle button -> toggleTheme action -> Redux state update
// → DOM class update → Tailwind dark classes applied
```

### Theme State
```jsx
// Use Redux state in components
const { mode } = useSelector((state) => state.theme);
// mode = 'light' | 'dark'
```

---

## 💾 LocalStorage

```javascript
// Key: 'theme'
// Value: 'light' or 'dark'
localStorage.getItem('theme')     // Retrieve
localStorage.setItem('theme', mode) // Save
```

---

## 🎯 Best Practices

### 1. **Thêm Dark Classes Cho New Components**
```jsx
// Always include dark: variants
<div className="bg-white dark:bg-gray-900">
<button className="text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
```

### 2. **Giữ Consistency**
- Use consistent color palette
- Don't hardcode colors - use Tailwind classes
- Test both light and dark modes

### 3. **Transitions**
```jsx
// index.css already includes:
* {
  @apply transition-colors duration-300;
}
```

### 4. **Icons**
```jsx
// Icon colors need dark: classes
<Icon className="text-gray-600 dark:text-gray-400" />
```

---

## 🔧 Customization

### Change Primary Dark Color
```javascript
// tailwind.config.js - extend theme
theme: {
  extend: {
    backgroundColor: {
      'dark-bg': 'rgb(15, 15, 15)', // Custom dark color
    }
  }
}
```

### Add Custom Dark Styles
```css
/* index.css */
html.dark .custom-class {
  @apply bg-gray-900 text-white;
}
```

---

## ✅ Checklist for Future Components

- [ ] Add `dark:` classes for backgrounds
- [ ] Add `dark:` classes for text colors
- [ ] Add `dark:` classes for borders
- [ ] Add `dark:` classes for hover/focus states
- [ ] Test in both light and dark modes
- [ ] Check icon colors

---

## 📞 Troubleshooting

### Dark mode not applying?
```javascript
// Check if class 'dark' is on <html>
document.documentElement.classList.contains('dark')

// Check Redux state
console.log(store.getState().theme)

// Check localStorage
console.log(localStorage.getItem('theme'))
```

### Specific color looks off?
- Update BUBBLE_PALETTE in MessageCard.jsx
- Or adjust dark: color in component
- Test against WhatsApp official dark mode

### Performance issue?
- CSS transitions are enabled with 300ms duration
- Use `transition-none` if needed for specific elements
- Check Tailwind purge/content config

---

## 📚 File References

- **Redux Setup**: `src/redux/store.js` (theme reducer added)
- **Theme Actions**: `src/redux/theme/action.js`
- **Global Styles**: `src/index.css` (dark mode support)
- **Config**: `tailwind.config.js` (darkMode: 'class')
- **App Entry**: `src/App.jsx` (initializeTheme on load)

---

## 🎉 Features Implemented

✅ **Light/Dark Mode Toggle**
✅ **Persistent Theme (localStorage)**
✅ **System Preference Detection**
✅ **Redux State Management**
✅ **Smooth Transitions**
✅ **All UI Components Updated**
✅ **Message Bubbles Styled**
✅ **Icons Color-Aware**
✅ **Responsive Design Maintained**

---

**Last Updated:** January 24, 2026
