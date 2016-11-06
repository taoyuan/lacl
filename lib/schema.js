"use strict";

const _ = require('lodash');

const MODELS = {
	Role: 'acl-role',
	Mapping: 'acl-mapping',
	Ability: 'acl-ability',
	Permission: 'acl-permission'
};

const loadModel = (datasource, filename) => {
	const modelDefinition = require('./models/' + filename + '.json');
	let {name, properties, options} = modelDefinition;
	options = _.assign(_.omit(modelDefinition, ['name', 'properties', 'options']), options);
	return datasource.createModel(name, properties, options);
};

const initModel = (Model, filename) => require('./models/' + filename)(Model);

exports.MODELS = Object.keys(MODELS);

exports.loadModels = function loadModels(datasource) {
	const models = {};
	_.forEach(MODELS, (filename, key) => models[key] = loadModel(datasource, filename));
	_.forEach(models, (Model, key) => initModel(Model, MODELS[key]));
	return models;
};
