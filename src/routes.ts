import { Router } from 'express';
import * as PlayersController from './controllers/players-controller';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

router.get('/players', PlayersController.getPlayers);
router.get('/players/:id', PlayersController.getPlayerById);
router.post('/players', PlayersController.postPlayer);
router.patch('/players/:id', PlayersController.updatePlayer);

export default router;
