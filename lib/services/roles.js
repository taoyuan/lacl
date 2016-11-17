"use strict";

const g = require('strong-globalize')();
const deprecated = require('depd')('sacl');

module.exports = class {

	/**
	 *
	 * @param acl
	 */
	constructor(acl) {
		this.acl = acl;
		this.Role = acl.Role;
	}

	findById(id, filter) {
		deprecate('findById');
		return this.Role.findById(...arguments);
	}

	findRegulars(filter, options) {
		deprecate('findRegulars');
		return this.Role.findRegulars(...arguments);
	};

	findByType(type, filter, options) {
		deprecate('findByType');
		return this.Role.findByType(...arguments);
	};

	findByScope(scope, filter, options) {
		deprecate('findByScope');
		return this.Role.findByScope(scope, filter, options);
	};

	findByTypedScopes(type, scopeIds, filter, options) {
		deprecate('findByTypedScopes');
		return this.Role.findByTypedScopes(...arguments);
	};

	findOrCreate(name, scope) {
		deprecate('findOrCreate', 'sure');
		return this.Role.sure(...arguments);
	}

	create(name, scope) {
		deprecate('create', 'sure');
		return this.Role.sure(...arguments);
	}

	remove(where) {
		deprecate('remove');
		return this.Role.remove(...arguments);
	}

	count(where) {
		deprecate('count');
		return this.Role.count(...arguments);
	}

	removeByScope(scope, name) {
		deprecate('removeByScope');
		return this.Role.removeByScope(...arguments);
	}

	countByScope(scope, name) {
		deprecate('countByScope');
		return this.Role.countByScope(...arguments);
	}

	getRolesParents(roles) {
		deprecate('getRolesParents');
		return this.Role.getRolesParents(...arguments);
	}

	inherit(role, parents) {
		deprecate('inherit');
		return this.Role.inherit(...arguments);
	}

	uninherit(role, parents) {
		deprecate('uninherit');
		return this.Role.uninherit(...arguments);
	}

	setInherits(role, parents) {
		deprecate('setInherits');
		return this.Role.setInherits(...arguments);
	}

};

function deprecate(oldMethod, newMethod) {
	newMethod = newMethod || oldMethod;
	return deprecated(g.f('Roles.%s() is deprecated. Using Role.%s() instead.', oldMethod, newMethod));
}
