import logo from './logo.svg';
import './App.css';
import { Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import { Auth } from './pages/Auth';
import Status from './components/Status';
import StatusViewer from './components/Status/StatusViewer';
import { Toaster } from "react-hot-toast";
import { bootstrapSession } from './redux/auth/action';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';

function App() {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/status" element={<Status />} />
          <Route path="/status/:userId" element={<StatusViewer />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontSize: "0.9rem" },
          success: { duration: 2500 },
          error: { duration: 3000 },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
