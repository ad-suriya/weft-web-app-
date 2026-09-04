import { config } from '@dotenvx/dotenvx';

export const baseEnv =
  config({
    path: `${import.meta.dirname}/../../../../.env`,
  }).parsed ?? {};

// `pnpm dev` writes CLI_CEB_DEV=true into .env (see scripts/set_global_env.sh);
// `pnpm build` writes CLI_CEB_DEV=false. That's the real dev/prod switch, so key
// CEB_NODE_ENV off it — this is what flips the extension's API_BASE between the
// local backend (localhost:8000, same one the web app dev server proxies to) and
// the deployed Cloud Run backend. CEB_DEV stays supported as a manual override
// for the rare case of running a prod-URL build against a dev flag.
export const dynamicEnvValues = {
  CEB_NODE_ENV:
    baseEnv.CEB_DEV === 'true' || baseEnv.CLI_CEB_DEV === 'true' ? 'development' : 'production',
} as const;
