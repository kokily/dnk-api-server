import Router from 'koa-router';
import fs from 'fs';

const movie = new Router();

// Streaming Movie
movie.get('/:title', async (ctx) => {
  const { title } = ctx.params;
  const fileName = `${process.cwd()}/uploads/videos/${title}.mp4`;
  const fileStat = fs.statSync(fileName);
  const { size } = fileStat;
  const { range } = ctx.request.headers;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0]);
    const end = parts[1] ? parseInt(parts[1]) : size - 1;
    const chunk = end - start + 1;
    const stream = fs.createReadStream(fileName, { start, end });

    ctx.response.set('Content-Type', `bytes ${start}-${end}/${size}`);
    ctx.response.set('Accept-Ranges', 'bytes');
    ctx.response.set('Content-Length', `${chunk}`);
    ctx.response.set('Content-Type', 'video/mp4');

    ctx.body = stream;
  } else {
    ctx.response.set('Content-type', `${size}`);
    ctx.response.set('Content-Type', 'video/mp4');

    ctx.body = fs.createReadStream(fileName);
  }
});

export default movie;
