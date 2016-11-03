"use strict";

const _ = require('lodash');
const contract = require('./contract');

exports.sureArray = function (arr) {
	return Array.isArray(arr) ? arr : [arr];
};

exports.get = function (object, prop) {
	return object && (_.get(object, prop) || object)
};

exports.getId = function (object) {
	return exports.get(object, 'id');
};

exports.typeid = function (object, defaultAsId) {
	if (!object) return object;

	let parts;
	if (typeof object === 'string') {
		parts = object.split(':');
	} else if (Array.isArray(object)) {
		parts = object;
	}

	if (parts) {
		if (parts.length > 1) {
			const last = parts.length - 1;
			return {type: parts.slice(0, last).join(':'), id: parts[last]};
		}
		return defaultAsId ? {type: null, id: parts[0]} : {type: parts[0], id: null};

	}

	if (typeof object === 'object' && object.constructor && object.constructor.modelName) {
		return {type: object.constructor.modelName, id: object.id};
	}

	return object;
};

exports.resolvePolymorphic = function (Model, name, object, defaultAsId) {
	contract(arguments)
		.params('function', 'string', 'string|object|array|undefined', 'boolean')
		.params('function', 'string', 'string|object|array|undefined')
		.params('function', 'string')
		.end();
	const rel = Model.relations[name];
	if (!rel || !rel.polymorphic || !object) return object;

	const {discriminator, foreignKey} = rel.polymorphic;

	const result = exports.typeid(object, defaultAsId);
	return {
		[discriminator]: result.type,
		[foreignKey]: result.id
	}
};
