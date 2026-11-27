import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import router from './routes';

/**
 * Configura o Express (sem abrir porta). O server.ts é quem sobe o servidor.
 *
 * A ORDEM IMPORTA: o Express executa os middlewares na sequência em que são registrados.
 * No código da aula o cors() vinha depois das rotas, então as respostas da /api
 * nunca recebiam os cabeçalhos de CORS.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', router);

  // Nenhuma rota respondeu: 404 em JSON.
  app.use((req, res) => {
    res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
  });

  // Erros: JSON malformado vira 400; o resto vira 500 sem expor detalhes.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ message: 'O corpo da requisição não é um JSON válido.' });
      return;
    }
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ message: 'O corpo da requisição é grande demais.' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  };
  app.use(errorHandler);

  return app;
}

export default createApp;
