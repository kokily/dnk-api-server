import { Context } from 'koa';
import { SignOptions, sign, verify } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { RefreshTokenType, TokensType } from '../types';
import db from './database';

/**
 * Cookie Setting
 * @param ctx
 * @param tokens
 */
export function setCookies(
  ctx: Context,
  tokens?: { accessToken: string; refreshToken: string },
): void {
  if (tokens) {
    ctx.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: tokens.accessToken ? true : undefined,
      domain:
        process.env.NODE_ENV === 'production' ? '.hanuri.or.kr' : undefined,
      secure: process.env.NODE_ENV === 'production' && true,
      sameSite: 'lax',
      maxAge: tokens.accessToken ? 1000 * 15 : undefined,
    });
    ctx.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: tokens.refreshToken ? true : undefined,
      domain:
        process.env.NODE_ENV === 'production' ? '.hanuri.or.kr' : undefined,
      secure: process.env.NODE_ENV === 'production' && true,
      sameSite: 'lax',
      maxAge: tokens.refreshToken ? 1000 * 60 * 60 * 24 * 30 : undefined,
    });
  } else {
    ctx.cookies.set('accessToken');
    ctx.cookies.set('refreshToken');
  }
}

/**
 * Generate Token
 * @param payload
 * @param options
 * @returns string
 */
export async function generateToken(
  payload: any,
  options?: SignOptions,
): Promise<string> {
  const secretKey = process.env.JWT_SECRET!;
  const jwtOptions: SignOptions = {
    issuer: 'hanuri.or.kr',
    expiresIn: '15d',
    ...options,
  };

  if (!jwtOptions.expiresIn) {
    delete jwtOptions.expiresIn;
  }

  return new Promise((resolve, reject) => {
    if (!secretKey) return;

    sign(payload, secretKey, jwtOptions, (err, token) => {
      if (err || token === undefined) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

export async function createToken(user: User): Promise<TokensType> {
  const accessToken = await generateToken(
    { userId: user.id, username: user.username },
    { subject: 'accessToken', expiresIn: '15m' },
  );

  const refreshToken = await generateToken(
    { userId: user.id },
    { subject: 'refreshToken', expiresIn: '15d' },
  );

  await db.user.update({
    where: { id: user.id },
    data: {
      token: refreshToken,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Decode Token
 * @param token
 * @returns
 */
export async function decodeToken<T = any>(token: string): Promise<T> {
  const secretKey = process.env.JWT_SECRET!;

  return new Promise((resolve, reject) => {
    if (!secretKey) return;

    verify(token, secretKey, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded as any);
    });
  });
}

/**
 * Token Refresh
 * @param ctx
 * @param prevRefreshToken
 * @returns
 */
export async function tokenRefresh(
  ctx: Context,
  prevRefreshToken: string,
): Promise<string> {
  try {
    const decoded = await decodeToken<RefreshTokenType>(prevRefreshToken);
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      ctx.throw(500, 'Invalid User Error');
    }

    const now = new Date().getTime();
    const diff = decoded.exp * 1000 - now;
    let refreshToken = prevRefreshToken;

    if (diff < 1000 * 60 * 60 * 24 * 15) {
      refreshToken = await generateToken(
        {
          userId: user.id,
        },
        { subject: 'refreshToken', expiresIn: '15d' },
      );
    }

    const accessToken = await generateToken(
      { user_id: user.id, username: user.username },
      { subject: 'accessToken', expiresIn: '15m' },
    );

    setCookies(ctx, { accessToken, refreshToken });

    await db.user.update({
      where: { id: user.id },
      data: {
        token: refreshToken,
      },
    });

    return decoded.userId;
  } catch (err: any) {
    ctx.throw(500, err);
  }
}
