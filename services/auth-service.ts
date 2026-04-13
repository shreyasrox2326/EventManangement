"use client";

import { emtsApi } from "@/services/live-api";
import { LoginRequestDto, LoginResponseDto, RegisterCustomerRequestDto } from "@/types/contracts";

const SESSION_KEY = "emts-session";

export const authService = {
  async login(payload: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await emtsApi.login(payload.emailAddress, payload.password);

    return {
      accessToken: `session-${user.userId}`,
      refreshToken: `session-${user.userId}`,
      user,
      requiresTwoFactor: false
    };
  },

  async verifyOtp(_: string) {
    return { verified: true };
  },

  async registerCustomer(payload: RegisterCustomerRequestDto) {
    const user = await emtsApi.createCustomerAccount(payload);
    return {
      registrationId: user.userId,
      status: "CREATED"
    };
  },

  saveSession(session: LoginResponseDto) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  },

  getSession(): LoginResponseDto | null {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LoginResponseDto) : null;
  },

  clearSession() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  },
};
