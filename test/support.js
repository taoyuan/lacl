"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const loopback = require('loopback');
const lacl = require('..');

require('../lib/contract').debug = true;

exports.connect = function (ctx) {
	ctx = ctx || {};
	const db = ctx.db = loopback.createDataSource('db', {connector: 'mongodb', database: 'lacl-test'});
	return Promise.resolve(db.automigrate())
		.then(() => _.forEach(lacl.models, model => model.attachTo(db)))
		.thenReturn(db);
};

exports.disconnect = function (ctx) {
	return ctx.db.disconnect();
};

exports.setup = function (ctx) {
	return exports.connect(ctx);
};

exports.teardown = function (ctx) {
	return exports.clearData().then(() => exports.disconnect(ctx));
};

exports.clearData = function () {
	return Promise.map(_.values(lacl.models), model => model.destroyAll());
};
