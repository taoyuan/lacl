"use strict";

const shortid = require('shortid');
const utils = require('../utils');

module.exports = function (Role) {
	Role.definition.rawProperties.id.default =
		Role.definition.properties.id.default = function() {
			return shortid.generate();
		};

	Role.findRegulars = function (filter, options) {
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, {scopeType: null, scopeId: null});
		return Role.find(filter, options);
	};

	Role.findByType = function (type, filter, options) {
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, {scopeType: type, scopeId: null});
		return Role.find(filter, options);
	};

	Role.findByScope = function (scope, filter, options) {
		scope = utils.resolvePolymorphic(Role, 'scope', scope);
		filter = filter || {};
		filter.where = Object.assign({}, filter.where, scope);
		return Role.find(filter, options);
	};

	Role.removeByName = function (scope, name) {
		return this.remove({scope, name});
	};

	return Role;
};
