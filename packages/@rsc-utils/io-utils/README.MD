# rpg-sage-creative/io-utils

This repository is one of multiple utility libraries used by RSC (RPG Sage Creative) projects.

This particular repo contains wrapper functions for various IO processes:

- `aws` (Amazon Web Services)
  - DDB (DynamoDB) interactions
  - SNS (Simple Notification Service) interactions

- `dsv` (delimiter separated values)
  - wrapper for `csv-parser`

- `fs` (file system)
  - custom wrappers for `node:fs` functions
  - provides simplified/modern async/await usage
  - adds reads / writes that automatically stringify/parse JSON

- `https`
  - custom wrappers for `node:http`, `node:https`, and `follow-redirects`
  - compression options
  - progress tracking/logging options
  - buffer, text, or json return options

- `image`
  - caches remote images before reading as a buffer
  - converts image buffer to metadata

- `pdf`
  - custom wrapper for `pdf2json`
  - caches remote pdfs before parsing contents
  - provides simpler access/navigation of parsed json

- `url`
  - basic url RegExp
  - url typeguard logic


# Pre-Setup

This repo is managed with `pnpm` instead of `npm`.
If you don't have `pnpm` installed, run:

```
npm i -g pnpm@10
```

*Note: There is currently something funky with RSC repos and pnpm@11.*


# Setup

1. clone the repo
	```
	git clone https://github.com/rpg-sage-creative/io-utils.git

	cd io-utils
	```

2. install dependencies
	```
	pnpm install
	```

3. ensure repo builds
	```
	pnpm build
	```

4. ensure jest tests run
	```
	pnpm test:ignore-ddb
	```

5. setup container for DDB tests (optional)
	```
	docker compose up -d
	```

6. run entire test suite (optional; requires step 5)
	```
	pnpm test
	```

# Using VS Code/Codium

This repo includes basic configuration by way of the `.vscode` folder:

- `launch.json`
	- for use with Run > Start Debugging (F5)
	- starts the debugger for the currently open test js file

- `settings.json`
	- my preferred settings
	- primarily: tabs instead of spaces and no minimap

- `tasks.json`
	- default "build" hotkey maps to `pnpm build`
	- includes "test" tasks;
		- open `.test.js` file is run
		- if a `.ts` file is open, corresponding `.test.js` file is run
		- if neither case is met, all tests are run