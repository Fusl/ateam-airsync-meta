#!/usr/bin/env node

'use strict';

const express = require('express');
const child_process = require('child_process');
const app = express();
const port = process.env.PORT || 3000;
const checkscript = process.env.CHECKSCRIPT || undefined;
const directory = process.env.DIRECTORY || '/';
const min = Number(process.env.SIZE_MIN) || 0;
const max = Number(process.env.SIZE_MAX) || Number.MAX_SAFE_INTEGER;

['SIGHUP', 'SIGINT', 'SIGTERM'].forEach((signal) => {
	process.on(signal, () => {
		process.exit(0);
	});
});

let cachedavail = undefined;

const get_avail = cb => {
	if (cachedavail !== undefined) {
		return cb(cachedavail);
	}
	const proc = child_process.spawn('df', ['--output=avail', '--block-size=1', '--no-sync', directory]);
	let stdout = '';
	let stderr = '';
	proc.stdout.on('data', chunk => stdout += chunk);
	proc.stderr.on('data', chunk => stderr += chunk);
	proc.on('error', err => {
		let avail = 0;
		cachedavail = avail;
		setTimeout(() => {
			cachedavail = undefined;
		}, 5000);
		return cb(cachedavail);
	});
	proc.on('exit', code => {
		let avail = 0;
		if (code === 0) {
			avail = Number(stdout.split('\n')[1]);
		}
		cachedavail = avail;
		setTimeout(() => {
			cachedavail = undefined;
		}, 5000);
		return cb(cachedavail);
	});
};

const testaccepts = (name, size, cb) => {
	size = Number(size);
	if (isNaN(size)) {
		return cb(true);
	}
	if (size < min || size > max || size > cachedavail) {
		return cb(false);
	}
	if (!checkscript) {
		return cb(true);
	}
	const env = {
		ITEM_SIZE: size
	};
	if (name) {
		env.ITEM_NAME = name;
	}
	const proc = child_process.spawn(checkscript, [], {env:env});
	proc.stdout.pipe(process.stdout, {end: false});
	proc.stderr.pipe(process.stderr, {end: false});
	proc.on('error', err => {
		console.error(err);
		return cb(false);
	});
	proc.on('exit', code => {
		return cb(code === 0);
	});
};

app.get('/', (req, res) => {
	get_avail(avail => {
		testaccepts(req.query.name, req.query.size, accepts => {
			res.json({
				min: min,
				max: max,
				avail: avail || 0,
				accepts: accepts
			});
		});
	});
});

app.listen(port);
