import 'dotenv/config';

import https from 'https';
import http from 'http';
import fs from 'fs';

import app from './app';

async function _bootStrap() {
  try {
    const configurations = {
      production: { ssl: true, port: 443, hostname: 'api.dnkdream.com' },
      development: { ssl: false, port: 4000, hostname: 'localhost' },
    };
    const environment = process.env.NODE_ENV || 'production';
    const config = configurations[environment];

    let httpServer;
    let httpsServer;

    if (config.ssl) {
      httpServer = http.createServer(app.callback());
      httpsServer = https.createServer(
        {
          key: fs.readFileSync(`${process.env.SSL_KEY}`),
          cert: fs.readFileSync(`${process.env.SSL_CERT}`),
        },
        app.callback(),
      );

      httpServer.listen(80);
      httpsServer.listen(config.port, () => {
        console.log(`Dnk Dreams Backend server on ${config.port}`);
      });
    } else {
      httpServer = http.createServer(app.callback());

      httpServer.listen(config.port, () => {
        console.log(`Dnk dreams Development server on ${config.port}`);
      });
    }
  } catch (err: any) {
    console.error(err);
  }
}

_bootStrap();
