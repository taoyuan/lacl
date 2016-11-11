"use strict";

const _ = require('lodash');
const assert = require('assert');
const shortid = require('shortid');
const Promise = require('bluebird');
const utils = require('../utils');

module.exports = function (Role) {
	require('../mixins/timestamp')(Role);

	Role.definition.rawProperties.id.default =
		Role.definition.properties.id.default = function () {
			return shortid.generate();
		};

	Role.findRegulars = function (filter, options) {
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, {
			and: [
				{or: [{scopeType: null}, {scopeType: {nlike: ''}}]},
				{or: [{scopeId: null}, {scopeId: {nlike: ''}}]},
			]
		});
		return Role.find(filter, options);
	};

	Role.findByType = function (type, filter, options) {
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, {
			scopeType: type,
			or: [{scopeId: null}, {scopeId: {nlike: ''}}]
		});
		return Role.find(filter, options);
	};

	Role.findByScope = function (scope, filter, options) {
		scope = utils.resolvePolymorphic(Role, 'scope', scope);
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, scope);
		return Role.find(filter, options);
	};

	Role.findByTypedScopes = function (type, scopeIds, filter, options) {
		if (!Array.isArray(scopeIds)) {
			scopeIds = [scopeIds];
		}
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, {
			scopeType: type,
			scopeId: {inq: scopeIds}
		});
		return Role.find(filter, options);
	};

	Role.prototype._idsForParents = function (parents) {
		const ids = [];
		parents = utils.sureArray(parents).filter(p => {
			if (!p) return false;
			if (typeof p === 'string') {
				ids.push(p);
				return false;
			}

			return (p.scopeType === this.scopeType) && (p.scopeId === this.scopeId);
		});

		const where = ids.length && {id: {inq: ids}, scopeType: this.scopeType, scopeId: this.scopeId};
		return Promise.resolve(where && Role.find({where: where, fields: ['id']}))
			.then(roles => {
				if (roles && roles.length) {
					parents = parents.concat(roles)
				}
				return parents;
			})
			.filter(p => p.id !== this.id) // filter self
			.map(p => p.id).then(_.union);
	};

	Role.prototype.inherit = function (parents) {
		return this._idsForParents(parents)
			.then(parents => {
				this.parentIds = _.union(this.parentIds, parents)
			})
			.then(() => this.save());
	};

	Role.prototype.uninherit = function (parents) {
		return this._idsForParents(parents)
			.then(parents => this.parentIds = _.without(this.parentIds, ...parents))
			.then(() => this.save());
	};

	Role.prototype.setInherits = function (parents) {
		return this._idsForParents(parents)
			.then(parents => this.parentIds = parents)
			.then(() => this.save());
	};

	return Role;
};
