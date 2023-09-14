import Router from 'koa-router';
import auth from './auth';
import upload from './upload';
import hanuri from './hanuri';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/upload', upload.routes());
api.use('/hanuri', hanuri.routes());

export default api;
