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

export type UsuarioRole = 'BARBER' | 'CUSTOMER';

export type AuthTokenPayload = {
  sub: number;
  id: number;
  nome: string;
  email: string;
  barbeariaId: number;
  barbeiro: boolean;
  role: UsuarioRole;
  telefone?: string;
};
