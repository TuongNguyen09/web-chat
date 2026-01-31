// import { TOGGLE_THEME, SET_THEME } from './actionType';

// export const toggleTheme = () => (dispatch, getState) => {
//   const { theme } = getState();
//   const newTheme = theme.mode === 'light' ? 'dark' : 'light';
  
//   // Lưu vào localStorage
//   localStorage.setItem('theme', newTheme);
  
//   // Cập nhật DOM
//   updateDOMTheme(newTheme);
  
//   dispatch({
//     type: TOGGLE_THEME,
//     payload: newTheme,
//   });
// };

// export const setTheme = (mode) => (dispatch) => {
//   // Lưu vào localStorage
//   localStorage.setItem('theme', mode);
  
//   // Cập nhật DOM
//   updateDOMTheme(mode);
  
//   dispatch({
//     type: SET_THEME,
//     payload: mode,
//   });
// };

// export const initializeTheme = () => (dispatch) => {
//   // Kiểm tra localStorage trước
//   let savedTheme = localStorage.getItem('theme');
  
//   // Nếu không có, kiểm tra system preference
//   if (!savedTheme) {
//     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//     savedTheme = prefersDark ? 'dark' : 'light';
//   }
  
//   // Cập nhật DOM
//   updateDOMTheme(savedTheme);
  
//   dispatch({
//     type: SET_THEME,
//     payload: savedTheme,
//   });
// };

// const updateDOMTheme = (mode) => {
//   const html = document.documentElement;
//   if (mode === 'dark') {
//     html.classList.add('dark');
//   } else {
//     html.classList.remove('dark');
//   }
// };
