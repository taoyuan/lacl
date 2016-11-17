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

	Ability.prototype.safeUpdate = function () {
		const where = {id: this.id, updates: this.updates};
		const data = {actions: this.actions, updates: this.updates}; // updates will auto inc by 1 from updates mixins
		return Ability.updateAll(where, data).then(info => info.count ? this : null);
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

	Ability.removeByResource = function (resource) {
		contract(arguments)
			.params('string|object')
			.end();

		const {type} = utils.typeid(resource);

		return Ability.remove({resource: type})
	};

	return Ability;
};
