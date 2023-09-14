import Router from 'koa-router';
import { IncomingForm } from 'formidable';
import { authorizeUser } from '../../libs/middlewares';
import path from 'path';

const upload = new Router();

upload.post('/image', authorizeUser, async (ctx) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads/images');
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
    });

    form.on('error', (err) => {
      console.log(err);
    });

    const target = await form.parse(ctx.req);

    ctx.body = target;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

upload.post('/video', authorizeUser, async (ctx) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads/videos');
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 800 * 1024 * 1024,
    });

    form.on('error', (err) => {
      console.log(err);
    });

    form.on('progress', (bytesReceived, bytesExpected) => {
      console.log(bytesReceived, bytesExpected);
    });

    form.parse(ctx.req);
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

export default upload;
