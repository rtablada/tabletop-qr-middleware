import { faker } from '@faker-js/faker';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import path from 'path';
import QRCode from 'qrcode';

const program = new Command();

const longLine = Array.from({ length: 20 }, () => '-').join('');

program
  .name('create-qrs')
  .description('A modern way to progressively update your code to the best practices using lint rules')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require(path.join(__dirname, '../', 'package.json')).version);

program
  .command('generate-random')
  .option('--qty <num>', 'Quantity of random games and players to create', '1')
  .option('--base-url', 'What URL to use as a base ', 'http://localhost:3000')
  .action(async (args) => {
    const length = parseInt(args.qty);
    const games = Array.from({ length }, () => faker.company.name());
    const participants = Array.from({ length }, () => faker.internet.userName());

    console.log(chalk.redBright(`Games QRs\n${longLine}`));

    const gamesOutput = await Promise.all(
      games.map((game) => QRCode.toString(`${args.baseUrl}?game=${game}`, { type: 'terminal' }))
    );

    console.log(gamesOutput.join('/n/n'));

    console.log(chalk.redBright(`Participants QRs\n${longLine}`));

    const participantsOutput = await Promise.all(
      participants.map((participant) =>
        QRCode.toString(`${args.baseUrl}?participant=${participant}`, { type: 'terminal' })
      )
    );

    console.log(participantsOutput.join('/n/n'));
  });

program.parse();
