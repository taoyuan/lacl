"use strict";

const g = require('strong-globalize')();
const utils = require('../utils');
const contract = require('../contract');

module.exports = class Roles {

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
		return this.acl.Role.findByScope(...arguments);
	};

	findOrCreate(name, scope) {
		contract(arguments)
			.params('string', 'string|array|object|undefined')
			.params('string')
			.end();

		const {Role} = this.acl;
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

};
