import { Router } from 'express';
import * as PlayersController from './controllers/players-controller';
import * as ClubsController from './controllers/clubs-controller';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

router.get('/players', PlayersController.getPlayers);
router.get('/players/:id', PlayersController.getPlayerById);
router.post('/players', PlayersController.postPlayer);
router.patch('/players/:id', PlayersController.updatePlayer);
router.delete('/players/:id', PlayersController.deletePlayer);

router.get('/clubs', ClubsController.getClubs);
router.get('/clubs/:id', ClubsController.getClubById);
router.post('/clubs', ClubsController.postClub);
router.delete('/clubs/:id', ClubsController.deleteClub);

export default router;
