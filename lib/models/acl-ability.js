"use strict";

const _ = require('lodash');
const utils = require('../utils');
const contract = require('../contract');

module.exports = function (Ability) {

	// mixin timestamps
	require('../mixins/timestamp')(Ability);
	require('../mixins/updates')(Ability);

	Ability.validatesUniquenessOf('resource');

	Ability.addStaticActions = function (model) {
		const modelClass = this.registry.findModel(model);
		const abilitySettings = modelClass && (modelClass.settings.ability || modelClass.settings.permissions);
		if (abilitySettings && abilitySettings.actions) {
			return Ability.add(modelClass.modelName, abilitySettings.actions);
		}
		return Promise.resolve();
	};

	Ability.findByResource = function (resource) {
		resource = utils.typeid(resource);
		if (resource) {
			return Ability.findOne({where: {resource: resource.type}});
		}
		return Promise.resolve();
	};

	Ability.add = function (resource, names) {
		contract(arguments)
			.params('string','string|array')
			.end();

		resource = utils.typeid(resource);

		names = utils.sureArray(names).map(_.toUpper);
		return this.findByResource(resource).then(ability => {
			if (!ability) {
				ability = new Ability({resource: resource.type});
			}

			ability.actions = _.union(names, ability.actions);

			if (ability.isNewRecord()) {
				return ability.save()
			}

			const where = {id: ability.id, updates: ability.updates};
			const data = {actions: ability.actions, updates: ability.updates}; // updates will auto inc by 1 from updates mixins
			return Ability.updateAll(where, data).then(info => info.count ? ability : null);
		});
	};

	return Ability;
};
