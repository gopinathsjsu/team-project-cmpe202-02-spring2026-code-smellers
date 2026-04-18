export interface RegisterRequestBody {
  email: string;
  password: string;
  name: string;
  is_admin: boolean;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}
