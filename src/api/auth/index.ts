import Joi from 'joi';
import Router from 'koa-router';
import { hash, compare } from 'bcryptjs';
import { validateBody } from '../../libs/utils';
import db from '../../libs/database';
import { createToken, setCookies } from '../../libs/tokens';

const auth = new Router();

auth.post('/register', async (ctx) => {
  type RequestType = {
    username: string;
    password: string;
  };

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });

  if (!validateBody(ctx, schema)) return;

  const { username, password } = ctx.request.body as RequestType;

  try {
    const exists = await db.user.findUnique({
      where: { username },
    });

    if (exists) {
      ctx.throw(409, '이미 이용 중인 아이디입니다.');
      return;
    }

    const user = await db.user.create({
      data: {
        username,
        password: await hash(password, 10),
      },
    });

    ctx.body = user.id;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

auth.post('/login', async (ctx) => {
  type RequestType = {
    username: string;
    password: string;
  };

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });

  if (!validateBody(ctx, schema)) return;

  const { username, password } = ctx.request.body as RequestType;

  try {
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      ctx.throw(404, '등록된 사용자가 없습니다.');
      return;
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      ctx.throw(401, '비밀번호가 다릅니다.');
      return;
    }

    // Prev RefreshToken delete
    const prevToken = user.token;

    if (prevToken && prevToken.length === 0) {
      await db.user.update({
        where: { id: user.id },
        data: {
          token: '',
          updatedAt: new Date(),
        },
      });
    }

    const tokens = await createToken(user);

    setCookies(ctx, tokens);

    ctx.body = user.id;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

auth.post('/logout', async (ctx) => {
  try {
    const { userId } = ctx.state.user;
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      ctx.throw(401, '로그인 후 이용하세요');
      return;
    }

    if (user.token && user.token.length === 0) {
      ctx.throw(401, '발행된 토큰이 없습니다.');
      return;
    }

    setCookies(ctx);

    ctx.state.user = undefined;

    await db.user.update({
      where: { id: userId },
      data: {
        token: '',
        updatedAt: new Date(),
      },
    });

    ctx.status = 204;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

auth.get('/check', async (ctx) => {
  try {
    if (!ctx.state.user) {
      ctx.throw(401, '로그인 후 이용해 주세요.');
    }

    const { userId } = ctx.state.user;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      ctx.throw(401, '로그인 후 이용하세요.');
      return;
    }

    const token = user.token;

    if (token && token.length === 0) {
      ctx.throw(401, '발행된 토큰이 없습니다.');
      return;
    }

    ctx.body = userId;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

export default auth;
