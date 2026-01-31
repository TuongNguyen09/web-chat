import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignIn } from "./SignIn";
import { login, resetSigninState } from "../../redux/auth/action";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../redux/auth/action", () => ({
  login: jest.fn(),
  resetSigninState: jest.fn(() => ({ type: "RESET_SIGNIN" })),
}));

describe("SignIn", () => {
  const mockDispatch = jest.fn();
  const mockNavigate = jest.fn();
  let mockState;

  beforeEach(() => {
    mockState = { auth: { signin: null, reqUser: null } };
    useDispatch.mockReturnValue(mockDispatch);
    useSelector.mockImplementation((selector) => selector(mockState));
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  test("submits credentials and dispatches login", async () => {
    login.mockImplementation((payload) => ({ type: "LOGIN", payload }));

    render(<SignIn onSwitchMode={jest.fn()} />);

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(resetSigninState).toHaveBeenCalled();
      expect(login).toHaveBeenCalledWith({ email: "user@example.com", password: "secret123" });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "LOGIN",
        payload: { email: "user@example.com", password: "secret123" },
      });
    });
  });

  test("renders error returned from auth.signin", async () => {
    mockState.auth.signin = { error: "Email or password is incorrect" };

    render(<SignIn onSwitchMode={jest.fn()} />);

    expect(await screen.findByText(/Email or password is incorrect/i)).toBeInTheDocument();
  });

  test("shows success snackbar when login succeeds", async () => {
    mockState.auth.signin = { success: true };

    render(<SignIn onSwitchMode={jest.fn()} />);

    expect(await screen.findByText(/Login successfully/i)).toBeInTheDocument();
  });
});