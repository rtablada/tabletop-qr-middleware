import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';

interface ContestEntry {
  participant: string;
  game: string;
}

let fakeDb: ContestEntry[] = [];

function storeEntryInDb(entry: ContestEntry) {
  if (fakeDb.find((e) => e.participant == entry.participant && e.game == entry.game)) {
    throw new Error(`You cheater, you can't scan the same game twice!`);
  }

  fakeDb = [...fakeDb, { ...entry }];
}

function getEntryFromSession(ctx: Koa.ParameterizedContext): Partial<ContestEntry> {
  const participant = ctx.cookies.get('participant');
  const game = ctx.cookies.get('game');

  return { participant, game };
}

function setScanToSession(ctx: Koa.ParameterizedContext) {
  const entryPartial = getEntryFromSession(ctx);

  ctx.state.entry = {
    participant: ctx.query.participant ?? entryPartial.participant,
    game: ctx.query.game ?? entryPartial.game,
  };
}

export function createApp() {
  const app = new Koa();

  app.use(cors());

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {
        message: err.message,
      };
    }
  });

  const router = new Router();

  router.get('/entry', async (ctx) => {
    if (ctx.query.participant || ctx.query.game) {
      const participant = Array.isArray(ctx.query.participant) ? ctx.query.participant[0] : ctx.query.participant;
      const game = Array.isArray(ctx.query.game) ? ctx.query.game[0] : ctx.query.game;
      setScanToSession(ctx);

      if (participant) {
        ctx.cookies.set('participant', participant as string);
      }

      if (ctx.state.entry.participant && ctx.state.entry.game) {
        // This is just throwing things in JS array in memory but I used async to simulate db access
        await storeEntryInDb(ctx.state.entry);

        // Unset the game so the user is ready to scan another
        ctx.cookies.set('game');
      } else if (game) {
        // If we couldn't store in the db, then set it on the session for the next request
        ctx.cookies.set('game', game as string);
      }
    }

    ctx.body = {
      entries: fakeDb,
      currentEntry: ctx.state.entry,
      currentSession: getEntryFromSession(ctx),
    };
  });

  app.use(router.allowedMethods());
  app.use(router.routes());

  return app;
}

const app = createApp();

app.listen(3000, () => {
  console.log('Listening on port: 3000');
});
