"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const Joi = require('joi');
const utils = require('../utils');
const contract = require('../contract');

module.exports = function (Ability) {

	// mixin timestamps
	require('../mixins/timestamp')(Ability);
	require('../mixins/updates')(Ability);

	Ability.validatesUniquenessOf('resource');

	Ability.addStaticActions = function (models) {
		Joi.assert(models, Joi.alternatives().try(Joi.string(), Joi.func(), Joi.array().items(Joi.string())));

		const modelsToUse = utils.sureArray(models);
		const abilities = [];
		return Promise.each(modelsToUse, m => _addStaticActions(m).then(a => a && abilities.push(a)))
			.then(() => _.isArray(models) ? abilities : abilities[0]);
	};

	Ability.findByResource = function (resource) {
		Joi.assert(resource, Joi.alternatives().try(
			Joi.string(),
			Joi.func(),
			Joi.object(),
			Joi.array().items(Joi.string())));

		resource = utils.typeid(resource);
		if (resource) {
			return Ability.findOne({where: {resource: resource.type}});
		}
		return Promise.resolve();
	};


	Ability.addActions = function (resource, actions) {
		contract(arguments)
			.params('string', 'string|array')
			.end();

		resource = utils.typeid(resource);
		actions = utils.sureArray(actions).map(_.toUpper);
		return Ability.findByResource(resource).then(ability => {
			if (!ability) {
				ability = new Ability({resource: resource.type});
			}
			ability.actions = _.union(actions, ability.actions);
			if (ability.isNewRecord()) {
				return ability.save()
			}
			return ability.safeUpdate();
		});
	};


	Ability.removeActions = function (resource, actions) {
		contract(arguments)
			.params('string', 'string|array')
			.end();

		resource = utils.typeid(resource);
		actions = utils.sureArray(actions).map(_.toUpper);
		return Ability.findByResource(resource).then(ability => {
			if (!ability) return;
			ability.actions = _.without(ability.actions, ...actions);
			return ability.safeUpdate();
		});
	};

	Ability.updateActions = function (resource, actions) {
		contract(arguments)
			.params('string', 'string|array')
			.end();

		const {Ability} = this.acl;

		resource = utils.typeid(resource);
		actions = utils.sureArray(actions).map(_.toUpper);
		return Ability.findByResource(resource).then(ability => {
			if (!ability) {
				ability = new Ability({resource: resource.type});
			}
			ability.actions = actions;
			if (ability.isNewRecord()) {
				return ability.save()
			}
			return ability.safeUpdate();
		});
	};

	Ability.prototype.safeUpdate = function () {
		const where = {id: this.id, updates: this.updates};
		const data = {actions: this.actions, updates: this.updates}; // updates will auto inc by 1 from updates mixins
		return Ability.updateAll(where, data).then(info => info.count ? this : null);
	};


	function _addStaticActions(model) {
		const modelClass = Ability.registry.findModel(model);

		const abilitySettings = _.get(modelClass, 'settings.ability')
			|| _.get(modelClass, 'settings.abilities')
			|| _.get(modelClass, 'settings.permissions');

		if (abilitySettings && abilitySettings.actions) {
			return Ability.addActions(modelClass.modelName, abilitySettings.actions);
		}
		return Promise.resolve();
	}

	return Ability;
};
