import createApp from './app';

function readPort(value: string | undefined): number {
  if (value === undefined || value === '') return 3333;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT inválida: "${value}". Use um número entre 0 e 65535.`);
  }
  return port;
}

const port = readPort(process.env.PORT);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`⚽ Champions API rodando em http://localhost:${port}/api`);
});

// Encerra com calma: termina as requisições em andamento antes de sair.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log('\n   Desligando o servidor...');
    server.close(() => process.exit(0));
    server.closeAllConnections();
  });
}
