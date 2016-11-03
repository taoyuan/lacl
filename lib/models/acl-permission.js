"use strict";

const _ = require('lodash');
const shortid = require('shortid');
const Promise = require('bluebird');
const utils = require('../utils');
const contract = require('../contract');

module.exports = function (Permission) {

	// mixin timestamps
	require('../mixins/timestamp')(Permission);
	require('../mixins/updates')(Permission);

	Permission.definition.rawProperties.id.default =
		Permission.definition.properties.id.default = function () {
			return shortid.generate();
		};

    //
	// Permission.afterInitialize = function () {
	// 	// remember initial data for safe save
	// 	this._origin = this.toObject();
	// };

	Permission.findByResourceRoles = function(resource, roles) {
		contract(arguments)
			.params('object|string|array','string|array')
			.end();

		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		const where = Object.assign({}, subject, resource);
		return this.findOne({where: where});
	};

	/**
	 *
	 * @param {Object|String|[String]} subject subject has been allow to perform actions
	 * @param {Object|String|[String]} resource resource allow to perform
	 * @param {String|Array} actions action bits
	 * @returns {Promise.<boolean>}
	 */
	Permission.allow = function (subject, resource, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.params('object|string|array', 'object|string|array')
			.end();

		return this._perform('allow', ...arguments);
	};

	Permission.disallow = function (subject, resource, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.params('object|string|array', 'object|string|array')
			.end();
		return this._perform('disallow', ...arguments);
	};

	Permission.assign = function (subject, resource, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.params('object|string|array', 'object|string|array')
			.end();
		return this._perform('assign', ...arguments);
	};

	Permission._perform = function (operation, subject, resource, actions) {
		subject = utils.resolvePolymorphic(Permission, 'subject', subject, true);
		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		actions = utils.sureArray(actions).map(_.toUpper);

		const data = Object.assign({}, subject, resource);
		return Promise.fromCallback(cb => Permission.findOrCreate({where: data}, data, cb), {multiArgs: true})
			.then(([permission]) => permission[operation](actions).savesafe())
	};


	Permission.prototype.saveWithWhere = function (where) {
		where = Object.assign({}, where, {id: this.id});
		return Permission.updateAll(where, _.omit(this.toObject(), 'id')).then(info => info.count ? this : null);
	};

	Permission.prototype.savesafe = function () {
		return this.saveWithWhere({updates: this.updates});
	};

	Permission.prototype.allow = function (actions) {
		this.actions = _.union(this.actions, ...arguments);
		return this;
	};

	Permission.prototype.disallow = function (actions) {
		this.actions = _.without(this.actions, ..._.flatten(arguments));
		return this;
	};

	Permission.prototype.assign = function (actions) {
		this.actions = actions;
		return this;
	};

	return Permission;
};
