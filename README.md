# React + TypeScript + Vite

## Champion top players

The root `main.py` API collects NA solo-queue Challenger players, not the separate
authentication API in `backend/main.py`. Configure `RIOT_API_KEY` in a root
`.env` file and install the backend dependencies in a Python environment:

```sh
python -m pip install fastapi "uvicorn[standard]" sqlalchemy httpx python-dotenv riotwatcher
uvicorn main:app --host 127.0.0.1 --port 8000
```

Run the API from the repository root so it uses the intended `lol_data.db`.
Run a **single API worker**: each worker runs its own collector and would
otherwise duplicate Riot requests. The collector starts with the API and runs
every six hours while it stays running. It retries unsuccessful refreshes after
15 minutes, respects Riot's 429 `Retry-After`, and retains the last complete
snapshot if a refresh fails. Restarting the API retries a failed or interrupted
refresh immediately. An initial refresh may take several minutes.
Development keys expire and must be renewed; restart the API after changing one.

The ranking samples the 20 highest-LP NA Challenger solo-queue players and each
player's latest 20 matches across all queues, not all players on the server.
For each champion, it ranks the sample by `games * (win rate + capped KDA / 6) / 2`;
win rate is a fraction and KDA is capped at 6 for scoring. There is no minimum
champion game count, so results with small samples can be misleading. The page
shows the last successful update and a warning if the latest refresh fails.
Existing profile-search match caches are not included in this ranking.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
