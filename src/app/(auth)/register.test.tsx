import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import RegisterScreen from "./register";
import { router } from "expo-router";
import { signUpWithEmail } from "@/lib/firebase";
import { setUserProfile, setHeroProfile } from "@/lib/firestore";
import { t } from "@/i18n";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    replace: vi.fn(),
  },
}));
vi.mock("@/lib/firebase", () => ({
  signUpWithEmail: vi.fn(),
}));
vi.mock("@/lib/firestore", () => ({
  setUserProfile: vi.fn(),
  setHeroProfile: vi.fn(),
}));
vi.mock("@/lib/gameLogic", () => ({
  createHeroProfile: vi.fn((uid, name) => ({
    id: `hero-${uid}`,
    userId: uid,
    displayName: name,
    level: 1,
    currentExp: 0,
    totalExp: 0,
    gold: 0,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    skills: [],
    inventory: [],
    createdAt: "2024-01-01T00:00:00Z",
  })),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key) => key), // Mock t function to return the key
  getLang: vi.fn(() => "en"),
  getIsRTL: vi.fn(() => false),
}));

describe("RegisterScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registration form elements for child role by default", () => {
    render(<RegisterScreen />);
    expect(screen.getByText("app.name")).toBeVisible();
    expect(screen.getByText("auth.welcome")).toBeVisible();
    expect(screen.getByText("auth.child_account")).toBeVisible();
    expect(screen.getByText("auth.parent_account")).toBeVisible();
    expect(screen.getByLabelText("auth.hero_name")).toBeVisible();
    expect(screen.getByLabelText("auth.email")).toBeVisible();
    expect(screen.getByLabelText("auth.password")).toBeVisible();
    expect(screen.getByLabelText("auth.confirm_password")).toBeVisible();
    expect(screen.getByText("auth.coppa_notice")).toBeVisible();
    expect(screen.getByLabelText("auth.coppa_consent")).toBeVisible();
    expect(screen.getByText("auth.createHero")).toBeVisible();
    expect(screen.getByText("auth.have_account")).toBeVisible();
  });

  it("toggles to parent role and hides child-specific fields", () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByText("auth.parent_account"));

    expect(screen.queryByLabelText("auth.hero_name")).toBeNull();
    expect(screen.queryByText("auth.coppa_notice")).toBeNull();
    expect(screen.queryByLabelText("auth.coppa_consent")).toBeNull();
    expect(screen.getByText("auth.createHero")).toBeVisible(); // Button label remains the same
  });

  it("shows error for empty fields on registration attempt (child)", async () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByText("auth.createHero"));

    await waitFor(() => {
      expect(screen.getByText("error.required_field")).toBeVisible();
    });
    expect(signUpWithEmail).not.toHaveBeenCalled();
  });

  it("shows error for password mismatch", async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.hero_name"), "Hero");
    fireEvent.changeText(screen.getByLabelText("auth.email"), "test@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.changeText(screen.getByLabelText("auth.confirm_password"), "mismatch");
    fireEvent.press(screen.getByLabelText("auth.coppa_consent")); // Consent
    fireEvent.press(screen.getByText("auth.createHero"));

    await waitFor(() => {
      expect(screen.getByText("auth.password_mismatch")).toBeVisible();
    });
    expect(signUpWithEmail).not.toHaveBeenCalled();
  });

  it("shows error if COPPA consent is not given for child account", async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.hero_name"), "Hero");
    fireEvent.changeText(screen.getByLabelText("auth.email"), "test@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.changeText(screen.getByLabelText("auth.confirm_password"), "password123");
    // Do NOT press COPPA consent
    fireEvent.press(screen.getByText("auth.createHero"));

    await waitFor(() => {
      expect(screen.getByText("auth.coppa_consent_required")).toBeVisible();
    });
    expect(signUpWithEmail).not.toHaveBeenCalled();
  });

  it("successfully registers a child account", async () => {
    (signUpWithEmail as vi.Mock).mockResolvedValueOnce({ user: { uid: "test-uid" } });

    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.hero_name"), "HeroName");
    fireEvent.changeText(screen.getByLabelText("auth.email"), "child@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.changeText(screen.getByLabelText("auth.confirm_password"), "password123");
    fireEvent.press(screen.getByLabelText("auth.coppa_consent")); // Consent
    fireEvent.press(screen.getByText("auth.createHero"));

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith(
        "child@example.com",
        "password123",
      );
      expect(setUserProfile).toHaveBeenCalledWith("test-uid", {
        role: "child",
        locale: "en",
        createdAt: expect.any(String),
      });
      expect(setHeroProfile).toHaveBeenCalledWith(
        "test-uid",
        "test-uid",
        expect.objectContaining({
          displayName: "HeroName",
          level: 1,
        }),
      );
    });
    expect(screen.queryByText("auth.register_error")).toBeNull();
  });

  it("successfully registers a parent account", async () => {
    (signUpWithEmail as vi.Mock).mockResolvedValueOnce({ user: { uid: "parent-uid" } });

    render(<RegisterScreen />);
    fireEvent.press(screen.getByText("auth.parent_account")); // Switch to parent role
    fireEvent.changeText(screen.getByLabelText("auth.email"), "parent@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "parentpass");
    fireEvent.changeText(screen.getByLabelText("auth.confirm_password"), "parentpass");
    fireEvent.press(screen.getByText("auth.createHero"));

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith(
        "parent@example.com",
        "parentpass",
      );
      expect(setUserProfile).toHaveBeenCalledWith("parent-uid", {
        role: "parent",
        locale: "en",
        createdAt: expect.any(String),
      });
      expect(setHeroProfile).not.toHaveBeenCalled(); // No hero profile for parent
    });
    expect(screen.queryByText("auth.register_error")).toBeNull();
  });

  it("shows loading state during registration", async () => {
    (signUpWithEmail as vi.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ user: { uid: "test-uid" } }), 100)),
    );

    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.hero_name"), "HeroName");
    fireEvent.changeText(screen.getByLabelText("auth.email"), "child@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.changeText(screen.getByLabelText("auth.confirm_password"), "password123");
    fireEvent.press(screen.getByLabelText("auth.coppa_consent")); // Consent
    fireEvent.press(screen.getByText("auth.createHero"));

    expect(screen.getByText("common.loading")).toBeVisible();
    await waitFor(() => expect(screen.queryByText("common.loading")).toBeNull());
  });

  it("shows generic error on failed registration", async () => {
    (signUpWithEmail as vi.Mock).mockRejectedValueOnce(new Error("Registration failed"));

    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText("auth.hero_name"), "HeroName");
    fireEvent.changeText(screen.getByLabelText("auth.email"), "child@example.com");
    fireEvent.changeText(screen.getByLabelText("auth.password"), "password123");
    fireEvent.changeText(screen.getByLabelText("auth.confirm_password"), "password123");
    fireEvent.press(screen.getByLabelText("auth.coppa_consent")); // Consent
    fireEvent.press(screen.getByText("auth.createHero"));

    await waitFor(() => {
      expect(screen.getByText("auth.register_error")).toBeVisible();
    });
    expect(signUpWithEmail).toHaveBeenCalled();
  });

  it("navigates to login screen when 'Have an account?' is pressed", () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByText("auth.have_account"));
    expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
  });
});
