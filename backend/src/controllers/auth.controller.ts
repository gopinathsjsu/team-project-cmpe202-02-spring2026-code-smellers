import { Request, Response } from "express";
import { RegisterRequestBody, LoginRequestBody } from "../types/auth.types";
import * as authService from "../services/auth.service";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const registerReqDetails = req.body as RegisterRequestBody;

    const result = await authService.registerUser(registerReqDetails);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const loginReqDetails = req.body as LoginRequestBody;

    const result = await authService.loginWithPassword(loginReqDetails);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
