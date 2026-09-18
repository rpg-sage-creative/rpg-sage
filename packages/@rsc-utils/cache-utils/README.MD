# rpg-sage-creative/cache-utils

This repo contains cache related functionality.
`EphemeralMap` is a `Map` subclass that uses a weakset and removes items after a specified interval.
`EphemeralSet` is a `Set` subclass that uses a weakset and removes items after a specified interval.
`Cache` is a simple caching class that utilizes a `Map` (or `EphemeralMap` if a timeout interval is given).
`HasCache` is an abstract class that provides a `Cache` object via `.cache`.
`uncache` is a helper function designed to clear values out of memory.

## Node

Due to some new RegExp features implemented, this (and thus all RPG Sage Creative projects) requires Node 24.

## Scripts

Included in this repo are scripts for building a repo, releasing a repo (creating a git tag), and testing a repo. Projects that depend on this repo for these features can see https://github.com/rpg-sage-creative/utils-template for how to implement them.

One of the actions performed by the build script is to create an `index.ts` file in each descendant of `/src`. These `index.ts` files are simply a collection of `export * from "";` for each `.ts` file in the folder. Folders named "internal" will be excluded from these `index.ts` folders, but they will have their own `index.ts` folder created.

## Notes about tsdoc / jsdoc

The build scripts included in this repo perform a dual pass build. One builds everything with an entire tsdoc. The second redoes the tsdoc files to remove any documentation with `@internal` in the description.

# v1.1.0

As of v1.1.0 this repo assumes you are using pnpm (instead of npm) and that you are making use of the updated `v1.3.0` version of `dev-scripts`.