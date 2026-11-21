import express from 'express';
import type { Server } from 'http';
import routers from '../../app/routes/routes';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(routers);
  return app;
}

export function listen(app: express.Express): Promise<Server> {
  return new Promise(resolve => {
    const server = app.listen(0, () => resolve(server));
  });
}

export function close(server: Server): Promise<void> {
  return new Promise(resolve => server.close(() => resolve()));
}
