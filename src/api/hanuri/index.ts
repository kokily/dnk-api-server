import Router from 'koa-router';
import Joi from 'joi';
import { authorizeUser } from '../../libs/middlewares';
import { validateBody } from '../../libs/utils';
import db from '../../libs/database';

const hanuri = new Router();

hanuri.post('/', authorizeUser, async (ctx) => {
  type RequestType = {
    title: string;
    body: string;
    tags: string[];
    thumbnail: string;
    year: string;
  };

  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    thumbnail: Joi.string().required(),
    year: Joi.string().required(),
  });

  if (!validateBody(ctx, schema)) return;

  const { title, body, tags, thumbnail, year } = ctx.request
    .body as RequestType;

  try {
    const hanuri = await db.hanuri.create({
      data: {
        title,
        body,
        tags,
        thumbnail,
        year,
      },
    });

    ctx.body = hanuri;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

hanuri.get('/', async (ctx) => {
  type QueryType = {
    year: string;
    cursor?: string;
  };

  const { year, cursor } = ctx.query as QueryType;

  try {
    const page = cursor ?? '';
    const cursorObj = page === '' ? undefined : { id: page };
    const limit = 9;

    const hanuries = await db.hanuri.findMany({
      where: {
        year,
      },
      cursor: cursorObj,
      skip: page !== '' ? 1 : 0,
      take: limit,
    });

    ctx.body = hanuries;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

hanuri.get('/:id', async (ctx) => {
  const { id } = ctx.params;

  try {
    const hanuri = await db.hanuri.findUnique({
      where: { id },
    });

    if (!hanuri) {
      ctx.throw(404, '존재하지 않는 게시글입니다.');
      return;
    }

    ctx.body = hanuri;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

hanuri.put('/:id', authorizeUser, async (ctx) => {
  const { id } = ctx.params;

  type RequestType = {
    title: string;
    body: string;
    tags: string[];
    thumbnail: string;
    year: string;
  };

  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    thumbnail: Joi.string().required(),
    year: Joi.string().required(),
  });

  if (!validateBody(ctx, schema)) return;

  const { title, body, tags, thumbnail, year } = ctx.request
    .body as RequestType;

  try {
    const hanuri = await db.hanuri.update({
      where: { id },
      data: {
        title,
        body,
        tags,
        thumbnail,
        year,
        updatedAt: new Date(),
      },
    });

    ctx.body = hanuri;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

hanuri.delete('/:id', authorizeUser, async (ctx) => {
  const { id } = ctx.params;

  try {
    await db.hanuri.delete({ where: { id } });

    ctx.status = 204;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

export default hanuri;
