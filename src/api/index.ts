import Router from 'koa-router';
import auth from './auth';
import upload from './upload';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/upload', upload.routes());

export default api;
