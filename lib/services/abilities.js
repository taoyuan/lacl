"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const utils = require('../utils');
const contract = require('../contract');

module.exports = class Abilities {

	/**
	 *
	 * @param acl
	 */
	constructor(acl) {
		this.acl = acl;
	}

	// addStaticActions(models) {
	// 	return this.acl.Ability.addStaticActions(...arguments);
	// };

	findByResource(resource) {
		return this.acl.Ability.findByResource(...arguments);
	};

	addActions(resource, actions) {
		return this.acl.Ability.addActions(...arguments);
	};

	removeActions(resource, actions) {
		return this.acl.Ability.removeActions(...arguments);
	}

	updateActions(resource, actions) {
		return this.acl.Ability.updateActions(...arguments);
	}

	remove(resource) {
		contract(arguments)
			.params('string|object')
			.end();

		const {type} = utils.typeid(resource);

		return this.acl.Ability.remove({resource: type})
	}
};
