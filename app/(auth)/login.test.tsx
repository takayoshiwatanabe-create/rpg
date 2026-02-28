import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "./login";
import { router } from "expo-router";
import { signInWithEmail } from "@/lib/firebase";
import { t } from "@/i18n";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    replace: vi.fn(),
    push: vi.fn(),
  },
}));
vi.mock("@/lib/firebase", () => ({
  signInWithEmail: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key) => key), // Mock t function to return the key
  getIsRTL: vi.fn(() => false),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form elements", () => {
    render(<LoginScreen />);
    expect(screen.getByText("app.name")).toBeVisible();
    expect(screen.getByText("auth.welcome")).toBeVisible();
    expect(screen.getByText("auth.child_account")).toBeVisible();
    expect(screen.getByText("auth.parent_account")).toBeVisible();
    expect(screen.getByLabelText("auth.email")).toBeVisible();
    expect(screen.getByLabelText("auth.password")).toBeVisible();
    expect(screen.getByText("auth.login")).toBeVisible();
    expect(screen.getByText("auth.forgot_password")).toBeVisible();
    expect(screen.getByText("auth.no_account")).toBeVisible();
  });

  it("allows toggling between child and parent roles", () => {
    render(<LoginScreen />);
    const childTab = screen.getByText("auth.child_account");
    const parentTab = screen.getByText("auth.parent_account");

    expect(childTab.parent?.props.accessibilityState.selected).toBe(true);
    expect(parentTab.parent?.props.accessibilityState.selected).toBe(false);

    fireEvent.press(parentTab);
    expect(childTab.parent?.props.accessibilityState.selected).toBe(false);
    expect(parentTab.parent?.props.accessibilityState.selected).toBe(true);

    fireEvent.press(childTab);
    expect(childTab.parent?.props.accessibilityState.selected).toBe(true);
    expect(parentTab.parent?.props.accessibilityState.selected).toBe(false);
  });

  it("shows error for empty fields on login attempt", async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText("auth.login"));

    await waitFor(() => {
      expect(screen.getByText("error.required_field")).toBeVisible();
    });
    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it("shows error for invalid email format", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.email"), "invalid-email");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.press(screen.getByText("auth.login"));

    await waitFor(() => {
      expect(screen.getByText("error.invalid_email")).toBeVisible();
    });
    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it("calls signInWithEmail with correct credentials on successful login", async () => {
    (signInWithEmail as vi.Mock).mockResolvedValueOnce({ user: { uid: "test-uid" } });

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.email"), "test@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.press(screen.getByText("auth.login"));

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });
    expect(screen.queryByText("auth.login_error")).toBeNull();
  });

  it("shows loading state during login", async () => {
    (signInWithEmail as vi.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ user: { uid: "test-uid" } }), 100)),
    );

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.email"), "test@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.press(screen.getByText("auth.login"));

    expect(screen.getByText("common.loading")).toBeVisible();
    await waitFor(() => expect(screen.queryByText("common.loading")).toBeNull());
  });

  it("shows generic error on failed login", async () => {
    (signInWithEmail as vi.Mock).mockRejectedValueOnce(new Error("Login failed"));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.email"), "test@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.press(screen.getByText("auth.login"));

    await waitFor(() => {
      expect(screen.getByText("auth.login_error")).toBeVisible();
    });
    expect(signInWithEmail).toHaveBeenCalled();
  });

  it("navigates to register screen when 'No account?' is pressed", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText("auth.no_account"));
    expect(router.replace).toHaveBeenCalledWith("/(auth)/register");
  });

  it("navigates to forgot password screen when link is pressed", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText("auth.forgot_password"));
    expect(router.push).toHaveBeenCalledWith("/(auth)/forgot-password");
  });
});
