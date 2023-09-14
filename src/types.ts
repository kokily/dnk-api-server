export type TokensType = {
  accessToken: string;
  refreshToken: string;
};

export type TokenType = {
  iat: number;
  exp: number;
  iss: string;
  sub: string;
};

export type AccessTokenType = {
  userId: string;
  username: string;
} & TokenType;

export type RefreshTokenType = {
  userId: string;
} & TokenType;
