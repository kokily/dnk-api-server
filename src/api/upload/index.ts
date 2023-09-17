import Router from 'koa-router';
import { IncomingForm } from 'formidable';
import { authorizeUser } from '../../libs/middlewares';
import path from 'path';
import db from '../../libs/database';

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
    let fileName = '';

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 800 * 1024 * 1024,
    });

    form.on('error', (err) => {
      console.log(err);
    });

    form.on('fileBegin', (name, file) => {
      file.filepath = `${uploadDir}/${file.originalFilename}`;
      fileName = file.originalFilename!;
    });

    form.on('progress', (bytesReceived, bytesExpected) => {
      let percent = ((bytesReceived / bytesExpected) * 100) | 0;
      console.log(`Video Uploading: ${percent} %`);
    });

    await form.parse(ctx.req);
    const video = await db.video.create({
      data: {
        title: fileName.split('.')[0],
        source: fileName,
      },
    });

    ctx.body = video;
  } catch (err: any) {
    ctx.throw(500, err);
  }
});

export default upload;
