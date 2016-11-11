"use strict";

const assert = require('assert');
const _ = require('lodash');
const Promise = require('bluebird');
const g = require('strong-globalize')();
const utils = require('../utils');
const contract = require('../contract');

module.exports = class {

	/**
	 *
	 * @param acl
	 */
	constructor(acl) {
		this.acl = acl;
	}

	findById(id, filter) {
		return this.acl.Role.findById(...arguments);
	}

	findRegulars(filter, options) {
		return this.acl.Role.findRegulars(...arguments);
	};

	findByType(type, filter, options) {
		return this.acl.Role.findByType(...arguments);
	};

	findByScope(scope, filter, options) {
		if (scope === undefined) {
			scope = null; // force to search in global
		}
		return this.acl.Role.findByScope(scope, filter, options);
	};

	findOrCreate(name, scope) {
		contract(arguments)
			.params('string', 'string|array|object|undefined')
			.params('string')
			.end();

		const {Role} = this.acl;
		if (scope === undefined) {
			scope = null;
		}
		if (scope === '*') {
			throw new Error(g.f('create scope can not be *, you cant ignore it or set null to creating global role'));
		}
		const data = utils.resolvePolymorphic(Role, 'scope', scope) || {};
		data.name = name;
		return Role.findOrCreate({where: data}, data);
	}

	create(name, scope) {
		contract(arguments)
			.params('string', 'string|array|object|undefined')
			.params('string')
			.end();

		const {Role} = this.acl;
		if (scope === undefined) {
			scope = null;
		}
		if (scope === '*') {
			throw new Error(g.f('create scope can not be *, you cant ignore it or set null to creating global role'));
		}
		const data = utils.resolvePolymorphic(Role, 'scope', scope) || {};
		data.name = name;
		return Role.create(data);
	}

	remove(name, scope) {
		contract(arguments)
			.params('string', 'string|array|object|undefined')
			.params('string')
			.end();

		assert(scope !== '*', 'scope * is not allowed');

		const {Role} = this.acl;
		const where = utils.resolvePolymorphic(Role, 'scope', scope || null) || {};
		where.name = name;
		return Role.remove(where);
	};

	count(name, scope) {
		contract(arguments)
			.params('string', 'string|array|object|undefined')
			.params('string')
			.end();

		const {Role} = this.acl;
		const where = utils.resolvePolymorphic(Role, 'scope', scope || null) || {};
		where.name = name;
		return Role.count(where);
	}

	getRolesParents(roles) {
		contract(arguments)
			.params('object|array')
			.end();

		roles = utils.sureArray(roles);
		return Promise.map(roles, role => Promise.fromCallback(cb => role.inherits(cb)))
			.then(data => _(data).flatten().uniqBy(item => item.id).value());
	}

	inherit(role, parents) {
		contract(arguments)
			.params('string|object', 'string|array|object')
			.end();

		return Promise.resolve(typeof role === 'string' ? this.findById(role) : role)
			.then(role => role.inherit(parents));
	}

	uninherit(role, parents) {
		contract(arguments)
			.params('string|object', 'string|array|object')
			.end();
		return Promise.resolve(typeof role === 'string' ? this.findById(role) : role)
			.then(role => role.uninherit(parents));
	}

	setInherits(role, parents) {
		contract(arguments)
			.params('string|object', 'string|array|object')
			.end();
		return Promise.resolve(typeof role === 'string' ? this.findById(role) : role)
			.then(role => role.setInherits(parents));
	}

};
