"use strict";

const _ = require('lodash');
const shortid = require('shortid');
const Promise = require('bluebird');
const utils = require('../utils');
const contract = require('../contract');

module.exports = function (Permission) {
	Permission.definition.rawProperties.id.default =
		Permission.definition.properties.id.default = function () {
			return shortid.generate();
		};


	Permission.afterInitialize = function () {
		// remember initial data for safe save
		this._origin = this.toObject();
	};

	Permission.findBySubjectAndResource = function(subject, resource) {
		contract(arguments)
			.params('object|string|array','string|array')
			.end();

		subject = utils.resolvePolymorphic(Permission, 'subject', subject);
		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		const where = Object.assign({}, subject, resource);
		return this.findOne({where: where});
	};

	/**
	 *
	 * @param {Object|String|[String]} subject subject has been allow to perform actions
	 * @param {Object|String|[String]} resource resource allow to perform
	 * @param {Number} bitwiseValue action bits
	 * @returns {Promise.<boolean>}
	 */
	Permission.allow = function (subject, resource, bitwiseValue) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'number')
			.params('object|string|array', 'object|string|array')
			.end();

		return this._perform('allow', ...arguments);
	};

	Permission.disallow = function (subject, resource, bitwiseValue) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'number')
			.params('object|string|array', 'object|string|array')
			.end();
		return this._perform('disallow', ...arguments);
	};

	Permission.assign = function (subject, resource, bitwiseValue) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'number')
			.params('object|string|array', 'object|string|array')
			.end();
		return this._perform('assign', ...arguments);
	};

	Permission._perform = function (operation, subject, resource, bitwiseValue) {
		bitwiseValue = bitwiseValue || 0;

		subject = utils.resolvePolymorphic(Permission, 'subject', subject);
		resource = utils.resolvePolymorphic(Permission, 'resource', resource);

		const data = Object.assign({}, subject, resource);
		return Promise.fromCallback(cb => Permission.findOrCreate({where: data}, data, cb), {multiArgs: true})
			.then(([permission]) => permission[operation](bitwiseValue).savesafe())
	};


	Permission.prototype.saveWithWhere = function (where) {
		where = Object.assign({}, where, {id: this.id});
		return Permission.updateAll(where, _.omit(this.toObject(), 'id')).then(info => info.count ? this : null);
	};

	Permission.prototype.savesafe = function () {
		const actions = !this.isNewRecord() && this._origin ? this._origin.actions : this.actions;
		return this.saveWithWhere({actions: actions});
	};

	/**
	 *
	 * @param {Number} bitwiseValue
	 * @returns {Permission}
	 */
	Permission.prototype.allow = function (bitwiseValue) {
		this.actions = bitwiseValue | (this.actions || 0);
		return this;
	};

	/**
	 *
	 * @param {Number} bitwiseValue
	 * @returns {Permission}
	 */
	Permission.prototype.disallow = function (bitwiseValue) {
		this.actions = (~bitwiseValue) & (this.actions || 0);
		return this;
	};

	Permission.prototype.assign = function (bitwiseValue) {
		this.actions = bitwiseValue || 0;
		return this;
	};

	return Permission;
};
