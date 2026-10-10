#!/bin/sh
# build + regenerate the simulator (ESBUILD may point to esbuild's main.js when it is not installed locally)
set -e
cd "$(dirname "$0")/.."
node build.mjs
node tests/make-sim.mjs
