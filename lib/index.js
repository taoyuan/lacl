'use strict';

const _ = require('lodash');
const path = require('path');
const SG = require('strong-globalize');
SG.SetRootDir(path.join(__dirname, '..'));

const loopback = require('loopback');
const PersistedModel = loopback.PersistedModel || loopback.DataModel;

module.exports = acls;

function acls(app, options) {
	options = _.defaults({}, options, {});
	app.set('acl', new acls.ACL(options));
}

function loadModel(jsonFile) {
	const modelDefinition = require(jsonFile);
	return PersistedModel.extend(modelDefinition.name, modelDefinition.properties, {
		relations: modelDefinition.relations,
	});
}

const models = acls.models = {
	Role: loadModel('./models/acl-role.json'),
	User: loadModel('./models/acl-user.json'),
	Mapping: loadModel('./models/acl-mapping.json'),
	Ability: loadModel('./models/acl-ability.json'),
	Permission: loadModel('./models/acl-permission.json')
};

acls.Role = require('./models/acl-role')(models.Role);
acls.User = require('./models/acl-user')(models.User);
acls.Mapping = require('./models/acl-mapping')(models.Mapping);
acls.Ability = require('./models/acl-ability')(models.Ability);
acls.Permission = require('./models/acl-permission')(models.Permission);

Object.keys(models).forEach(name => models[name].autoAttach = 'db');

acls.ACL = acls.Acl = require('./acl')(models);
