"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const loopback = require('loopback');
const lacl = require('..');

exports.db = loopback.createDataSource('db', {connector: 'mongodb', database: 'lacl-test'});

exports.init = function () {
	_.forEach(lacl.models, model => model.attachTo(exports.db));
};

exports.destroyAll = function () {
	return Promise.map(_.values(lacl.models), model => model.destroyAll());
};
