import { Router } from 'express';
import protocolRoutes from './protocols';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/protocols', protocolRoutes);

export default router;
