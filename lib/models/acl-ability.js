"use strict";

const _ = require('lodash');
const utils = require('../utils');
const contract = require('../contract');

module.exports = function (Ability) {

	Ability.validatesUniquenessOf('resource');


	Ability.addStaticActions = function (model) {
		const modelClass = this.registry.findModel(model);
		const abilitySettings = modelClass && (modelClass.settings.ability || modelClass.settings.permissions);
		if (abilitySettings && abilitySettings.actions) {
			return Ability.add(modelClass.modelName, abilitySettings.actions);
		}
		return Promise.resolve();
	};

	// ResourceAction.getByResource = function (resource) {
	// 	const staticActions = this.getStaticActions(resource);
	// 	return this.find({where: {resource}}).then(actions => staticActions.concat(actions));
	// };

	Ability.findByResource = function (resource) {
		resource = utils.typeid(resource);
		if (resource && resource.type) {
			return Ability.findOne({where: {resource: resource.type}});
		}
		return Promise.resolve();
	};

	Ability.add = function (resource, names) {
		contract(arguments)
			.params('string','string|array')
			.end();

		resource = utils.typeid(resource);

		names = utils.sureArray(names).map(name => name.toUpperCase());
		return this.findByResource(resource).then(ability => {
			if (!ability) {
				ability = new Ability({resource: resource.type});
			}

			let seq = ability.seq;
			const actions = ability.actions = ability.actions || {};
			names.forEach(name => {
				name = name.toUpperCase();
				if (!actions[name]) {
					actions[name] = ability.seq;
					ability.seq = ability.seq << 1;
				}
			});

			if (ability.isNewRecord()) {
				return ability.save();
			}

			return Ability.updateAll({id: ability.id, seq: seq}, {seq: ability.seq, actions}).then(info => info.count && ability);
		});
	};


	Ability.calc = function (resource, actions) {
		contract(arguments)
			.params('string','string|array')
			.end();

		actions = utils.sureArray(actions).map(name => name.toUpperCase());

		return this.findByResource(resource).then(ability => ability.calc(actions));
	};

	Ability.prototype.calc = function (actions) {
		return _.reduce(actions, (value, action) => value | this.bitwise(action), 0);
	};

	Ability.prototype.bitwise = function (action) {
		return this.actions[action] || 0;
	};

	return Ability;
};
