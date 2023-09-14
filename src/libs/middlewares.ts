import { Middleware } from 'koa';
import { createToken, decodeToken, setCookies, tokenRefresh } from './tokens';
import { AccessTokenType, RefreshTokenType } from '../types';
import db from './database';

/**
 * Cors config
 * @param ctx
 * @param next
 * @returns
 */
export const cors: Middleware = (ctx, next) => {
  const allowedHosts = [
    /^https:\/\/api.dnkdream.com$/,
    /^https:\/\/hanuri.or.kr$/,
    /^https:\/\/www.hanuri.or.kr$/,
  ];

  if (process.env.NODE_ENV !== 'production') {
    allowedHosts.push(/^http:\/\/localhost/);
  }

  const { origin } = ctx.headers;

  if (origin) {
    const valid = allowedHosts.some((regex) => regex.test(origin));

    if (!valid) return next();

    ctx.set('Access-Control-Allow-Origin', origin);
    ctx.set('Access-Control-Allow-Credentials', 'true');

    if (ctx.method === 'OPTIONS') {
      ctx.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Cookie',
      );
      ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH');
    }

    return next();
  } else {
    return next();
  }
};

/**
 * Jwt Middleware
 * @param ctx
 * @param next
 * @returns
 */
export const jwtMiddleware: Middleware = async (ctx, next) => {
  let accessToken: string | undefined = ctx.cookies.get('accessToken');
  let refreshToken: string | undefined = ctx.cookies.get('refreshToken');

  // 두 토큰이 없을 경우
  if (!accessToken && !refreshToken) {
    ctx.state.user = undefined;
    console.log('토큰 없음');
    return next();
  }

  try {
    if ((accessToken && refreshToken) || (!accessToken && refreshToken)) {
      // 두 토큰 다 있거나 Refresh Token이 있을 경우 디코딩 후 리프레쉬
      const refreshTokenData = await decodeToken<RefreshTokenType>(
        refreshToken,
      );
      const diff = refreshTokenData.exp * 1000 - new Date().getTime();

      if (diff < 1000 * 60 * 30 || !accessToken) {
        await tokenRefresh(ctx, refreshToken);
      }

      ctx.state.user = {
        userId: refreshTokenData.userId,
      };

      return next();
    } else if (accessToken && !refreshToken) {
      // Access Token 유효, Refresh Token 만료
      const accessTokenData = await decodeToken<AccessTokenType>(accessToken);
      const user = await db.user.findUnique({
        where: { id: accessTokenData.userId },
      });

      if (!user) {
        ctx.throw(500, '사용자가 없습니다.');
        return next();
      }

      const refreshTokenData = await decodeToken<RefreshTokenType>(user.token!);

      if (refreshTokenData) {
        await db.user.update({
          where: { id: user.id },
          data: {
            token: '',
          },
        });
      }

      const tokens = await createToken(user);

      setCookies(ctx, tokens);

      ctx.state.user = {
        userId: user.id,
      };

      return next();
    }
  } catch (err: any) {
    console.error(err);
    return next();
  }
};

export const authorizeUser: Middleware = async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.throw(403, '로그인 후 이용하세요.');
    return;
  }

  const user = await db.user.findUnique({
    where: { id: ctx.state.user.userId },
  });

  if (!user) {
    ctx.throw(401, '사용자가 없습니다.');
    return;
  }

  return next();
};
