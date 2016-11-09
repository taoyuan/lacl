"use strict";

const debug = require('debug')('sacl:permission');
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

	/**
	 *
	 * @param resource
	 * @param roles
	 */
	Permission.findByResourceRoles = function (resource, roles) {
		contract(arguments)
			.params('object|string|array', 'string|array')
			.end();

		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		const where = Object.assign({}, subject, resource);
		return this.findOne({where: where});
	};

	/**
	 *
	 * @param resource
	 * @returns {Promise.<boolean>|Promise.<U>|*}
	 */
	Permission.isResourceRestricted = function (resource) {
		contract(arguments)
			.params('object|string|array|function')
			.end();

		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		const where = Object.assign({actions: {gt: []}}, resource);
		return Permission.count(where).then(count => count > 0);
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

	/**
	 *
	 * @param subject
	 * @param resource
	 * @param actions
	 */
	Permission.disallow = function (subject, resource, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.params('object|string|array', 'object|string|array')
			.end();
		return this._perform('disallow', ...arguments);
	};

	/**
	 *
	 * @param subject
	 * @param resource
	 * @param actions
	 */
	Permission.assign = function (subject, resource, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.params('object|string|array', 'object|string|array')
			.end();
		return this._perform('assign', ...arguments);
	};

	/**
	 *
	 * @param subjects
	 * @param actions
	 * @param resourceType
	 * @returns {*}
	 */
	Permission.allowedResources = function (subjects, actions, resourceType) {
		contract(arguments)
			.params('string|array')
			.params('string|array', 'string|array')
			.params('string|array', 'string|array', 'function|string|undefined')
			.end();

		subjects = utils.sureArray(subjects);
		if (!subjects.length) return Promise.resolve([]);

		if (typeof resourceType === 'function') {
			resourceType = resourceType.modelName || resourceType.name;
		}

		// concat * to match admin permissions.
		// maybe actions has been contained *, what ever.
		actions = utils.sureArray(actions).map(_.toUpper).concat(['*']);

		const groupedSubjects = _.reduce(subjects, (result, subject) => {
			subject = utils.typeid(subject, true);
			result[subject.type] = result[subject.type] || [];
			result[subject.type].push(subject.id);
			return result;
		}, {});

		const whereSubjects = _.map(groupedSubjects, (ids, type) => {
			if (type === 'null') {
				type = null;
			}
			if (type === 'undefined') {
				type = undefined;
			}

			return {subjectType: type, subjectId: {inq: ids}};
		});

		// only support mongodb
		// const where = {resourceType, or: [{actions: {lte: []}}, {and: [{actions: {inq: actions}}, {or: whereSubjects}]}]};
		const where = {resourceType, actions: {inq: actions}, or: whereSubjects};

		debug('allowed resources where: %j', where);

		return Permission.find({where: where})
			.then(permissions => _.map(permissions, p => ({type: p.resourceType, id: p.resourceId})));
	};

	/**
	 *
	 * @param subjects
	 * @param actions
	 * @param resourceType
	 * @returns {*}
	 */
	Permission.disallowedResources = function (subjects, actions, resourceType) {
		contract(arguments)
			.params('string|array')
			.params('string|array', 'string|array')
			.params('string|array', 'string|array', 'function|string|undefined')
			.end();

		subjects = utils.sureArray(subjects);
		if (!subjects.length) return Promise.resolve([]);

		if (typeof resourceType === 'function') {
			resourceType = resourceType.modelName || resourceType.name;
		}

		actions = utils.sureArray(actions).map(_.toUpper);

		const groupedSubjects = _.reduce(subjects, (result, subject) => {
			subject = utils.typeid(subject, true);
			result[subject.type] = result[subject.type] || [];
			result[subject.type].push(subject.id);
			return result;
		}, {});

		const whereSubjects = _.map(groupedSubjects, (ids, type) => {
			if (type === 'null') {
				type = null;
			}
			if (type === 'undefined') {
				type = undefined;
			}

			return {or: [{subjectType: {neq: type}}, {subjectId: {nin: ids}}]};
		});

		const actionsWhere = [{actions: {nin: actions}}, {actions: {gt: []}}];
		// only support mongodb
		const where = {resourceType, or: [{and: actionsWhere}, {and: whereSubjects}]};

		debug('allowed resources where: %j', where);

		return Permission.find({where: where})
			.then(permissions => _.map(permissions, p => ({type: p.resourceType, id: p.resourceId})));
	};

	//------------------------------------------------------
	// Private functions
	//------------------------------------------------------
	Permission._perform = function (operation, subject, resource, actions) {
		subject = utils.resolvePolymorphic(Permission, 'subject', subject, true);
		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		actions = utils.sureArray(actions).map(_.toUpper);

		const data = Object.assign({}, subject, resource);
		return Promise.fromCallback(cb => Permission.findOrCreate({where: data}, data, cb), {multiArgs: true})
			.then(([permission]) => permission[operation](actions).savesafe())
	};


	//------------------------------------------------------
	// Prototype functions
	//------------------------------------------------------
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
