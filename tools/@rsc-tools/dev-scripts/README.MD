# rpg-sage-creative/dev-scripts

This repo is merely a reusable collection of the various util/ci/cd scripts used by all RPG Sage Creative repos.

## Entry Point

As of v1.3.0, `pnpm` (not `npm`) is the assumed package manager and all scripts should be called via `pnpm dev-scripts SCRIPT`.

## mjs

These are called by `bin.sh` to do heavy lifting that is easier in NodeJS than in Bash.

### mjs/index.mjs

This script is the entry point for the other `.mjs` scripts.
The first arg indicates which of the others scripts will be called.
The remaining args are passed along as either string args or flag keys.

### mjs/indexTs.mjs

This script creates an `index.ts` file in every folder under `src` *not* named `internal`.
The created `index.ts` file includes an `export * from ...` line for each ts file in the folder and every child folder *not* named `internal`.

> **v1.3.0 Note:**
> Index files should be created using `pnpm dev-scripts create-indexes`.

### mjs/testJs.mjs

This script scans the `src` folder for any `.ts` file that doesn't have a corresponding `.test.js` file in the `test` folder.
For each missing test file, one is created with a `test.todo("FILENAME")` so that Vitest can pick it up.

> **v1.6.1 Note:**
> Test files should be created using `pnpm dev-scripts create-test-todos`.

## sh

### bin.sh

This script is exposed such that all scripts can be called using `pnpm dev-scripts SCRIPT`.

### build.sh

Performs a build of the `src` folder.
This includes deleting all prior `build` folders and `.tsbuildinfo` files.
It also triggers `mjs/indexTs.mjs` before starting the build unless `--skipIndexTs` is passed.
The build runs twice: once to build all `.js` files and a second time to redo the `.d.ts` files w/o private/internal functions.
Optionally can "refresh" `node_modules` and `package-lock.json` if `--refreshNodeModules` is passed.

> **v1.3.0 Note:**
> Building should be triggered by `pnpm build` or tasks (cmd/ctrl+b) and use updated scripts in package.json
> See recommended "scripts" section.

### release.sh

Tricks a version release.
First performs a complete build and test.
Checks for files that need to be checked in or pushed.
Creates a release branch, bumps version number, then merges it to main and back to develop.

> **v1.3.0 Note:**
> Releases should be created using `pnpm dev-scripts release TYPE`.
> See recommended "scripts" section.

## Recommended Scripts

The following represents a great starting point for the "scripts" section of your package.json that utilizes the scripts in this repo.

> **as of v1.6.1**

```
	"scripts": {
		"scrub": "pnpm run '/^scrub::.*/'",
		"scrub::node_modules": "rm -rf node_modules",
		"scrub::npm": "rm -f package-lock.json",
		"scrub::pnpm": "rm -f pnpm-lock.yaml",
		"scrub::logs": "rm -rf ./logs/*.log",
		"postscrub": "pnpm install",

		"scrubIfMissing": "[ -d './node_modules' ] && [ -f './pnpm-lock.yaml' ] || pnpm scrub",

		"prebuild": "pnpm scrubIfMissing && pnpm run '/^build::.*/'",
		"build::clean-build-folder": "rm -rf build",
		"build::clean-build-info": "rm -f *.tsbuildinfo",
		"build::create-indexes": "[ -d './src' ] && pnpm dev-scripts create-indexes",
		"build": "[ -f './tsconfig.json' ] && tsc -b --force tsconfig.json",

		"buildIfMissing": "[ -d './build' ] || pnpm build",
		"build:fresh": "pnpm scrub && pnpm build",

		"pretest": "[ -d './test' ] && pnpm build && node -e \"import * as utils from './build/index.js';\" && pnpm scrub::logs",
		"test": "pnpm vitest --run --globals",

		"pretest:dot-test-dot-js": "[ -d './test' ] && pnpm scrub::logs",
		"test:dot-test-dot-js": "pnpm vitest --run --globals",

		"pretest:dot-test-dot-ts": "[ -d './test' ] && pnpm scrub::logs",
		"test:dot-test-dot-ts": "pnpm vitest --run --globals",

		"pretest:one-ts": "pnpm pretest",
		"test:one-ts": "pnpm pretest && pnpm vitest --run --globals",

		"release": "pnpm dev-scripts create-release",

		"refresh-tags": "pnpm dev-scripts refresh-tags"
	},
```