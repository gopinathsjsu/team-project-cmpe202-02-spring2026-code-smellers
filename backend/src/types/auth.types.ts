export interface RegisterRequestBody {
  email: string;
  password: string;
  displayName: string;
  is_admin: boolean;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}
