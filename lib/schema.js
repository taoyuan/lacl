"use strict";

const _ = require('lodash');
const loopback = require('loopback');
const PersistedModel = loopback.PersistedModel || loopback.DataModel;

const MODELS = {
	Role: 'acl-role',
	Mapping: 'acl-mapping',
	Ability: 'acl-ability',
	Permission: 'acl-permission'
};

const loadModel = (filename) => {
	const modelDefinition = require('./models/' + filename + '.json');
	let {name, properties, options} = modelDefinition;
	options = _.assign(_.omit(modelDefinition, ['name', 'properties', 'options']), options);
	return PersistedModel.extend(name, properties, options);
};

const initModel = (Model, filename) => require('./models/' + filename)(Model);

exports.MODELS = Object.keys(MODELS);

const loadModels = exports.loadModels = function loadModels(autoAttach) {
	autoAttach = autoAttach || 'db';
	const models = {};
	_.forEach(MODELS, (filename, key) => models[key] = loadModel(filename));
	_.forEach(models, (Model, key) => initModel(Model, MODELS[key]));
	_.forEach(models, Model => Model.autoAttach = autoAttach);
	return models;
};

exports.models = loadModels();

