#!/bin/sh
# local preview build: sections point to https://ddhd-preview.invalid/, which the tests serve from release/<v>/
cd "$(git rev-parse --show-toplevel)" && ESBUILD="${ESBUILD:-}" DHD_BASE="${DHD_BASE:-https://ddhd-preview.invalid/}" node divine-home-discovery/build.mjs
