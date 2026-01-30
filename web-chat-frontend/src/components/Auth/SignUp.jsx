import React, { useEffect, useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../redux/auth/action';

const BRAND_GREEN = '#00a884';

export const SignUp = ({ onSwitchMode }) => {
  const dispatch = useDispatch();
  const { auth } = useSelector(store => store);

  const [inputData, setInputData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [openSnackBar, setOpenSnackBar] = useState(false);

  const parseErrors = (errorString) => {
    const map = {};
    if (!errorString) return map;
    errorString.split(',').forEach(raw => {
      const msg = raw.trim();
      if (msg.includes('Email')) map.email = msg;
      if (msg.includes('Password') && msg.includes('Confirm')) map.confirmPassword = msg;
      else if (msg.includes('Password')) map.password = msg;
      if (msg.includes('Full name')) map.fullName = msg;
      if (msg.includes('Phone')) map.phone = msg;
    });
    return map;
  };

  useEffect(() => {
    if (!auth.signup) return;

    if (auth.signup.error) {
      setErrors(parseErrors(auth.signup.error));
      setOpenSnackBar(false);
      return;
    }

    if (auth.signup.success) {
      setErrors({});
      setOpenSnackBar(true);
      setInputData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      onSwitchMode(); // quay lại form Sign In
    }
  }, [auth.signup, onSwitchMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    dispatch(register(inputData));
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-[#111]">Sign up</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          Hoàn thiện thông tin để bắt đầu trò chuyện.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'Jane Doe' },
          { label: 'Email', name: 'email', type: 'email', placeholder: 'jane@example.com' },
          { label: 'Phone', name: 'phone', type: 'tel', placeholder: 'Số điện thoại' }
        ].map(field => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-[#374151] mb-2">
              {field.label}
            </label>
            <input
              {...field}
              value={inputData[field.name]}
              onChange={(e) =>
                setInputData(prev => ({ ...prev, [field.name]: e.target.value }))
              }
              className={`w-full rounded-[22px] border px-4 py-3 text-[#111] placeholder:text-[#9ca3af] transition focus:ring-2 focus:ring-[${BRAND_GREEN}] focus:border-[${BRAND_GREEN}]
              ${errors[field.name] ? 'border-red-400' : 'border-[#dfe5e7]'}`}
            />
            {errors[field.name] && (
              <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
            )}
          </div>
        ))}

        {['password', 'confirmPassword'].map(name => (
          <div key={name}>
            <label className="block text-sm font-semibold text-[#374151] mb-2">
              {name === 'password' ? 'Password' : 'Confirm Password'}
            </label>
            <input
              name={name}
              type="password"
              placeholder={name === 'password' ? '••••••••' : 'Nhập lại mật khẩu'}
              value={inputData[name]}
              onChange={(e) =>
                setInputData(prev => ({ ...prev, [name]: e.target.value }))
              }
              className={`w-full rounded-[22px] border px-4 py-3 text-[#111] placeholder:text-[#9ca3af] transition focus:ring-2 focus:ring-[${BRAND_GREEN}] focus:border-[${BRAND_GREEN}]
              ${errors[name] ? 'border-red-400' : 'border-[#dfe5e7]'}`}
            />
            {errors[name] && (
              <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
            )}
          </div>
        ))}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            bgcolor: BRAND_GREEN,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            py: 1.2,
            borderRadius: '18px',
            boxShadow: '0 18px 30px rgba(0,168,132,0.25)',
            '&:hover': {
              bgcolor: '#029b78',
              boxShadow: '0 20px 35px rgba(0,168,132,0.35)'
            }
          }}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#4b5563]">
        Đã có tài khoản?
        <button
          onClick={onSwitchMode}
          className="ml-2 font-bold text-[#00a884] hover:underline"
        >
          Sign in
        </button>
      </p>

      <Snackbar
        open={openSnackBar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackBar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setOpenSnackBar(false)}
          sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600, borderRadius: '12px' }}
        >
          Your account was created successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};