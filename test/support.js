"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const loopback = require('loopback');
const sacl = require('..');

require('../lib/contract').debug = true;

const ds = loopback.createDataSource('mongodb://localhost');
const acl = sacl.acl(ds);

exports.setup = function (ctx) {
	ctx.acl = acl;
};

exports.teardown = function (ctx) {
	return exports.clearData(ctx);
};

exports.clearData = function (ctx) {
	return _.has(ctx, 'acl.models') && Promise.map(_.values(ctx.acl.models), model => model.destroyAll());
};
