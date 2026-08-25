export type RegistrarUsuarioDto = {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
};

export type LoginDto = {
  email: string;
  senha: string;
};

export type RefreshTokenDto = {
  token: string;
};

export type UsuarioRole = 'SUPER_ADMIN' | 'BARBER' | 'CUSTOMER';

export type AuthTokenPayload = {
  sub: number;
  id: number;
  nome: string;
  email: string;
  barbeariaId: number;
  barbeiro: boolean;
  papel?: UsuarioRole;
  role: UsuarioRole;
  telefone?: string;
};
