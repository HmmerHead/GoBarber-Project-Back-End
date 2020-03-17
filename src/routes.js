import { Router } from 'express';
import multer from 'multer';
import { request } from 'https';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentsController from './app/controllers/AppointmentsController';
import NotificationController from './app/controllers/NotificationController';

import authMiddleware from './app/middlewares/auth';
import ScheduleController from './app/controllers/ScheduleController';
import AvalilableController from './app/controllers/AvalilableController';

const routes = new Router();
const upload = multer(multerConfig);

routes.get('/users/index', UserController.index);
routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);
// routes.put('/users', authMiddleware, UserController.update);

routes.put('/users', UserController.update);

routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/available', AvalilableController.index);

routes.get('/Appointments', AppointmentsController.index);
routes.post('/Appointments', AppointmentsController.store);
routes.delete('/Appointments/:id', AppointmentsController.delete);

routes.get('/schedule', ScheduleController.index);
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
