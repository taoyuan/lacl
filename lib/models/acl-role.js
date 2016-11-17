"use strict";

const g = require('strong-globalize')();
const _ = require('lodash');
const assert = require('assert');
const shortid = require('shortid');
const Promise = require('bluebird');
const utils = require('../utils');
const contract = require('../contract');

module.exports = function (Role) {
	require('../mixins/timestamp')(Role);

	Role.definition.rawProperties.id.default =
		Role.definition.properties.id.default = function () {
			return shortid.generate();
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
		if (scope === undefined) {
			scope = null; // force to search in global
		}
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


	Role.sure = function (name, scope) {
		contract(arguments)
			.params('string', 'string|object|undefined')
			.params('string')
			.end();

		if (scope === undefined) {
			scope = null;
		}
		if (scope === '*') {
			throw new Error(g.f('create scope can not be *, you cant ignore it or set null to creating global role'));
		}
		const data = utils.resolvePolymorphic(Role, 'scope', scope) || {};
		data.name = name;
		return Role.findOrCreate({where: data}, data).then(result => result[0]);
	};

	Role.removeByScope = function (scope, name) {
		contract(arguments)
			.params('string|object|undefined', 'string|undefined')
			.params('string|object|undefined')
			.end();

		if (scope === undefined) {
			scope = null;
		}
		if (scope === '*') {
			throw new Error(g.f('create scope can not be *, you cant ignore it or set null to creating global role'));
		}
		const where = utils.resolvePolymorphic(Role, 'scope', scope);
		if (name) where.name = name;
		return Role.destroyAll(where);
	};

	Role.countByScope = function (scope, name) {
		contract(arguments)
			.params('string|array|object|undefined', 'string|undefined')
			.params('string|array|object|undefined')
			.end();

		const where = utils.resolvePolymorphic(Role, 'scope', scope || null) || {};
		if (name) where.name = name;
		return Role.count(where);
	};

	Role.getRolesParents = function(roles) {
		contract(arguments)
			.params('object|array')
			.end();

		roles = utils.sureArray(roles);
		return Promise.map(roles, role => Promise.fromCallback(cb => role.inherits(cb)))
			.then(data => _(data).flatten().uniqBy(item => item.id).value());
	};

	Role.inherit = function(role, parents) {
		contract(arguments)
			.params('string|object', 'string|array|object')
			.end();

		return Promise.resolve(typeof role === 'string' ? Role.findById(role) : role)
			.then(role => role.inherit(parents));
	};

	Role.uninherit = function (role, parents) {
		contract(arguments)
			.params('string|object', 'string|array|object')
			.end();
		return Promise.resolve(typeof role === 'string' ? Role.findById(role) : role)
			.then(role => role.uninherit(parents));
	};

	Role.setInherits = function (role, parents) {
		contract(arguments)
			.params('string|object', 'string|array|object')
			.end();
		return Promise.resolve(typeof role === 'string' ? Role.findById(role) : role)
			.then(role => role.setInherits(parents));
	};

	return Role;
};
