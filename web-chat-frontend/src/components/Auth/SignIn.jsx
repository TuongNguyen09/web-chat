import React, { useEffect, useState } from "react";
import { Button, Snackbar, Alert } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { login, resetSigninState } from "../../redux/auth/action";
import { useNavigate } from "react-router-dom";

const BRAND_GREEN = "#00a884";

export const SignIn = ({ onSwitchMode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const [inputData, setInputData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [openSnackBar, setOpenSnackBar] = useState(false);

  /* Làm sạch state mỗi lần component mount */
  useEffect(() => {
    dispatch(resetSigninState());
    setErrors({});
    setOpenSnackBar(false);
  }, [dispatch]);

  /* Nếu user đã login (bootstrap session) thì đẩy vào home */
  useEffect(() => {
    if (auth.reqUser?.fullName) {
      navigate("/");
    }
  }, [auth.reqUser?.fullName, navigate]);

  /* Theo dõi kết quả đăng nhập */
  useEffect(() => {
    const signinState = auth.signin;
    if (!signinState) return;

    if (signinState.error) {
      setErrors({ password: signinState.error });
      setOpenSnackBar(false);
      return;
    }

    if (signinState.success) {
      setErrors({});
      setOpenSnackBar(true);
      const timer = setTimeout(() => navigate("/"), 1200);
      return () => clearTimeout(timer);
    }
  }, [auth.signin, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    dispatch(login(inputData));
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-[#111]">Sign in</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          Nhập thông tin tài khoản để tiếp tục trò chuyện.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: "Email", name: "email", type: "email", placeholder: "you@example.com" },
          { label: "Password", name: "password", type: "password", placeholder: "••••••••" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              {field.label}
            </label>
            <input
              {...field}
              value={inputData[field.name]}
              onChange={(e) =>
                setInputData((prev) => ({ ...prev, [field.name]: e.target.value }))
              }
              className={`w-full rounded-[22px] border px-4 py-3 text-[#111] placeholder:text-[#9ca3af] transition focus:ring-2 focus:ring-[${BRAND_GREEN}] focus:border-[${BRAND_GREEN}] ${
                errors[field.name] ? "border-red-400" : "border-[#dfe5e7]"
              }`}
            />
            {errors[field.name] && (
              <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
            )}
          </div>
        ))}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            bgcolor: BRAND_GREEN,
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 600,
            py: 1.2,
            borderRadius: "18px",
            boxShadow: "0 18px 30px rgba(0,168,132,0.25)",
            "&:hover": {
              bgcolor: "#029b78",
              boxShadow: "0 20px 35px rgba(0,168,132,0.35)",
            },
          }}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#4b5563]">
        Chưa có tài khoản?
        <button
          onClick={onSwitchMode}
          className="ml-2 font-semibold text-[#00a884] hover:underline"
        >
          Sign Up
        </button>
      </p>

      <Snackbar
        open={openSnackBar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackBar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setOpenSnackBar(false)}
          sx={{
            bgcolor: "#d1fae5",
            color: "#065f46",
            fontWeight: 600,
            borderRadius: "12px",
          }}
        >
          Login successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};