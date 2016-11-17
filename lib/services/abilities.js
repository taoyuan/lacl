"use strict";

const g = require('strong-globalize')();
const deprecated = require('depd')('sacl');

module.exports = class Abilities {

	/**
	 *
	 * @param acl
	 */
	constructor(acl) {
		this.acl = acl;
		this.Ability = acl.Ability;
	}

	findByResource(resource) {
		deprecate('findByResource');
		return this.Ability.findByResource(...arguments);
	};

	addActions(resource, actions) {
		deprecate('addActions');
		return this.Ability.addActions(...arguments);
	};

	removeActions(resource, actions) {
		deprecate('removeActions');
		return this.Ability.removeActions(...arguments);
	}

	updateActions(resource, actions) {
		deprecate('updateActions');
		return this.Ability.updateActions(...arguments);
	}

	remove(resource) {
		deprecate('remove', 'removeByResource');
		return this.Ability.removeByResource(resource)
	}
};

function deprecate(oldMethod, newMethod) {
	newMethod = newMethod || oldMethod;
	return deprecated(g.f('Abilities.%s() is deprecated. Using Ability.%s() instead.', oldMethod, newMethod));
}
