"use strict";

const _ = require('lodash');

exports.sureArray = function (arr) {
	return Array.isArray(arr) ? arr : [arr];
};

exports.get = function (object, prop) {
	return object && (_.get(object, prop) || object)
};

exports.getId = function (object) {
	return exports.get(object, 'id');
};

exports.typeid = function (object) {
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
		return {type: parts[0], id: parts[0]}
	}

	if (typeof object === 'object' && object.constructor && object.constructor.modelName) {
		return {type: object.constructor.modelName, id: object.id};
	}

	return object;
};

exports.resolvePolymorphic = function (Model, relname, object) {
	const rel = Model.relations[relname];
	if (!rel || !rel.polymorphic || !object) return object;

	const {discriminator, foreignKey} = rel.polymorphic;

	const result = exports.typeid(object);
	return {
		[discriminator]: result.type,
		[foreignKey]: result.id
	}
};
