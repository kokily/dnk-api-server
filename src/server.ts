import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { IncomingForm } from 'formidable';
import path from 'path';
import fs from 'fs';

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

router.get('/', (ctx) => (ctx.body = 'test'));

/*
on(eventName: 'data', listener: (data: EventData) => void): this;
    on(eventName: 'error', listener: (err: any) => void): this;
    on(eventName: 'field', listener: (name: string, value: string) => void): this;
    on(eventName: 'fileBegin' | 'file', listener: (formName: string, file: File) => void): this;
    on(eventName: 'progress', listener: (bytesReceived: number, bytesExpected: number) => void): this;
*/

router.post('/upload', async (ctx, next) => {
  const uploadDir = path.join(process.cwd(), 'uploads');
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

  await form.parse(ctx.req);
});

app.listen(4000, () => {
  console.log('Koa server on 4000 port');
});
