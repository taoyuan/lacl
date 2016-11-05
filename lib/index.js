'use strict';

const _ = require('lodash');
const path = require('path');
const SG = require('strong-globalize');
SG.SetRootDir(path.join(__dirname, '..'));

const schema = require('./schema');
const ACL = require('./acl');

function lacl(app, options) {
	options = _.defaults({}, options, {});

	// resolve custom models
	const models = Object.assign({}, schema.models, _.pick(options, schema.MODELS));
	_.forEach(models, (val, key) => {
			models[key] = app.registry.getModelByType(models[key]);
	});
	Object.assign(options, models);

	let ds = options.dataSource || options.datasource || options.ds;
	if (typeof ds) {
		ds = app.datasources[ds];
	}
	if (ds) {
		_.forEach(models, Model => Model.attachTo(ds));
	}

	app.set('acl', lacl.acl(options));
}

module.exports = lacl;

lacl.models = schema.models;
Object.assign(lacl, schema.models);

lacl.ACL = lacl.Acl = ACL;
lacl.acl = options => new ACL(options);
