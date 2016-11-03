"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const loopback = require('loopback');
const acls = require('..');

exports.db = loopback.createDataSource('db', {connector: 'memory'});

exports.init = function () {
	_.forEach(acls.models, model => model.attachTo(exports.db));
};

exports.destroyAll = function () {
	return Promise.map(_.values(acls.models), model => model.destroyAll()).thenReturn();
};
