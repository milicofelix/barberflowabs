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

export type AlterarSenhaDto = { senhaAtual: string; novaSenha: string };

export type UsuarioRole = 'SUPER_ADMIN' | 'APP_OWNER' | 'ESTABLISHMENT_OWNER' | 'ESTABLISHMENT_MEMBER' | 'CUSTOMER';

export type AuthTokenPayload = {
  trocarSenhaObrigatoria?: boolean;
  fotoURL?: string | null;
  sub: number;
  id: number;
  nome: string;
  email: string;
  estabelecimentoId: number | null;
  membroEstabelecimento: boolean;
  papel?: UsuarioRole;
  role: UsuarioRole;
  telefone?: string;
};
