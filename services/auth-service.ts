"use client";

import { emtsApi } from "@/services/live-api";
import { LoginRequestDto, LoginResponseDto, OtpChallengeDto, RegisterCustomerRequestDto, VerifyOtpRequestDto } from "@/types/contracts";

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

  async registerCustomer(payload: RegisterCustomerRequestDto): Promise<OtpChallengeDto> {
    return emtsApi.createCustomerAccount(payload);
  },

  async verifyCustomerRegistration(payload: VerifyOtpRequestDto) {
    const user = await emtsApi.verifyCustomerRegistration(payload);
    return {
      accessToken: `session-${user.userId}`,
      refreshToken: `session-${user.userId}`,
      user,
      requiresTwoFactor: false
    } satisfies LoginResponseDto;
  },

  async startPasswordReset(emailAddress: string): Promise<OtpChallengeDto> {
    return emtsApi.startPasswordReset(emailAddress);
  },

  async completePasswordReset(payload: VerifyOtpRequestDto & { newPassword: string }) {
    await emtsApi.completePasswordReset(payload);
    return { status: "RESET" };
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
