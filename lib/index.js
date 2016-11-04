'use strict';

const _ = require('lodash');
const path = require('path');
const SG = require('strong-globalize');
SG.SetRootDir(path.join(__dirname, '..'));

const loopback = require('loopback');
const PersistedModel = loopback.PersistedModel || loopback.DataModel;

module.exports = lacl;

function lacl(app, options) {
	options = _.defaults({}, options, {});
	app.set('acl', lacl.acl(options));
}

function loadModel(jsonFile) {
	const modelDefinition = require(jsonFile);
	let {name, properties, options} = modelDefinition;
	options = _.assign(_.omit(modelDefinition, ['name', 'properties', 'options']), options);
	return PersistedModel.extend(name, properties, options);
}

const models = lacl.models = {
	Role: loadModel('./models/acl-role.json'),
	Mapping: loadModel('./models/acl-mapping.json'),
	Ability: loadModel('./models/acl-ability.json'),
	Permission: loadModel('./models/acl-permission.json')
};

lacl.Role = require('./models/acl-role')(models.Role);
lacl.Mapping = require('./models/acl-mapping')(models.Mapping);
lacl.Ability = require('./models/acl-ability')(models.Ability);
lacl.Permission = require('./models/acl-permission')(models.Permission);

Object.keys(models).forEach(name => models[name].autoAttach = 'db');

lacl.ACL = lacl.Acl = require('./acl')(models);
lacl.acl = options => new lacl.ACL(options);
