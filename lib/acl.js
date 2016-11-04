"use strict";

const g = require('strong-globalize')();
const debug = require('debug')('lacl:acl');
const _ = require('lodash');
const Promise = require('bluebird');
const utils = require('./utils');
const contract = require('./contract');

module.exports = function (models) {

	class ACL {
		/**
		 *
		 * @param options
		 */
		constructor(options) {
			options = options || {};
			Object.assign(this, models, _.pick(options.models, ['Role', 'Mapping', 'Ability', 'Permission']));
		}

		findUserRoles(user, scope) {
			const {Mapping, Role} = this;
			const userId = utils.getId(user);
			return Mapping.find({where: {userId}}).then(mappings => mappings.map(mapping => mapping.roleId))
				.then(roleIds => Role.findByScope(scope, {where: {id: {inq: roleIds}}}));
		}

		addUserRoles(user, roles) {
			const {Mapping} = this;
			const userId = utils.getId(user);
			roles = utils.sureArray(roles).map(utils.getId);
			return Promise.map(roles, roleId => {
				return Promise.fromCallback(cb => Mapping.findOrCreate({where: {userId, roleId}}, {userId, roleId}, cb));
			});
		}

		removeUserRoles(user, roles) {
			const {Mapping} = this;
			const userId = utils.getId(user);
			roles = utils.sureArray(roles).map(utils.getId);
			return Mapping.remove({userId, roleId: {inq: roles}});
		}

		findRoleUserIds(role) {
			const {Mapping} = this;
			const roleId = utils.getId(role);
			return Mapping.find({where: {roleId}}).then(mappings => mappings.map(mapping => mapping.userId));
		}

		addRoleUsers(role, users) {
			const {Mapping} = this;
			const roleId = utils.getId(role);
			users = utils.sureArray(users).map(utils.getId);
			return Promise.map(users, userId => {
				return Promise.fromCallback(cb => Mapping.findOrCreate({where: {userId, roleId}}, {userId, roleId}, cb));
			});
		}

		removeRoleUsers(role, users) {
			const {Mapping} = this;
			const roleId = utils.getId(role);
			users = utils.sureArray(users).map(utils.getId);
			return Mapping.remove({roleId, userId: {inq: users}});
		}

		allUserRoles(user, scope) {
			contract(arguments)
				.params('object|string', 'object|string|array')
				.params('object|string')
				.end();

			return this.findUserRoles(user, scope).then(roles => this.allRoles(roles, scope));
		}

		allRoles(roles, scope) {
			// TODO join inherited roles
			return roles || [];
		}

		hasRole(user, role) {
			const {Mapping} = this;
			const userId = utils.getId(user);
			const roleId = utils.getId(role);
			return Mapping.count({userId, roleId}).then(count => !!count);
		}

		hasRoleByName(user, name, scope) {
			const {Role} = this;
			return Role.findByScope(scope, {where: {name}})
				.then(roles => roles && roles.length && this.hasRole(user, roles[0]))
				.then(value => !!value);
		}

		removeRole(role) {
			const {Role, Mapping, Permission} = this;
			const where = {};
			const roleId = utils.getId(role);
			if (typeof role === 'object') {
				where.subject = role;
			} else {
				where.subjectType = Role.modelName;
				where.subjectId = role;
			}
			return Permission.remove(where)
				.then(() => Mapping.remove({roleId}))
				.then(() => Role.remove({id: roleId}))
		}

		removeRoleByName(name, scope) {
			const {Role, Mapping, Permission} = this;

			return Role.findByScope(scope, {name}).then(roles => {
				if (!roles.length) return;
				const role = roles[0];
				const where = utils.resolvePolymorphic(Permission, 'subject', role);
				return Permission.remove(where)
					.then(() => Mapping.remove({roleId: role.id}))
					.then(() => Role.remove({id: role.id}))
			});
		}

		removeResourcePermissions(resource) {
			contract(arguments)
				.params('object|string|array')
				.end();

			const {Permission} = this;
			const where = utils.resolvePolymorphic(Permission, 'resource', resource);
			return Permission.remove(where);
		}

		allow(subject, resources, actions) {
			contract(arguments)
				.params('object|string|array', 'object|string|array', 'string|array')
				.end();

			const {Ability, Permission} = this;
			resources = utils.sureArray(resources);
			actions = utils.sureArray(actions).map(_.toUpper);
			return Promise.map(resources, res => {
				return Ability.findByResource(res).then(ability => ability || Ability.add(res, actions))
					.then(ability => Permission.allow(subject, res, actions));
			});
		}

		disallow(subject, resources, actions) {
			contract(arguments)
				.params('object|string|array', 'object|string|array', 'string|array')
				.end();

			const {Ability, Permission} = this;
			resources = utils.sureArray(resources);
			actions = utils.sureArray(actions).map(_.toUpper);
			return Promise.map(resources, res => {
				return Ability.findByResource(res)
					.then(ability => ability && Permission.disallow(subject, res, actions));
			});
		}


		allowedPermissions(user, resources) {
			contract(arguments)
				.params('object|string|array', 'string|object|array')
				.end();

			resources = utils.sureArray(resources);
			return this.allUserRoles(user).then(roles => {
				return Promise.map(resources, resource => {
					return Promise.all([
						this._resourcePermissions(user, resource),
						this._recurseResourcePermissions(roles, resource)
					]).then(permissions => ({[resource]: _.union(...permissions)}));
				});
			});
		}

		isAllowed(user, resource, actions) {
			contract(arguments)
				.params('object|string|array', 'string|object', 'string|array')
				.end();
			return this._checkPermissions(user, resource, actions).then(allowed => {
				if (allowed) return allowed;
				return this.allUserRoles(user).then(roles => this.isAllowedForRoles(roles, resource, actions));
			});
		}

		isAllowedForRoles(roles, resource, actions) {
			contract(arguments)
				.params('object|string|array', 'string|object', 'string|array')
				.end();

			roles = utils.sureArray(roles);
			actions = utils.sureArray(actions);
			if (!roles.length) return false;
			return this._recurseCheckPermissions(roles, resource, actions);
		}

		allowedResources(user, actions, resourceType) {
			contract(arguments)
				.params('string|array')
				.params('string|array', 'string|array')
				.params('string|array', 'string|array', 'function|string|undefined')
				.end();

			return this.allUserRoles(user).then(roles => this._allowedResources([user].concat(roles), actions, resourceType))
				.then(permissions => _.unionBy(permissions, p => (p.type || '_') + (p.id || '_')));

			// return Promise.all([
			// 	this._allowedResources(user, actions, resourceType),
			// 	this.allUserRoles(user).then(roles => this._allowedResources(roles, actions, resourceType))
			// ]).then(permissions => _.concat(...permissions))
			// 	.then(permissions => _.unionBy(permissions, p => (p.type || '_') + (p.id || '_')))
		}

		// TODO 排除不属于当前用户的所有无权限的 resourceType
		disallowedResources(user, actions, resourceType) {
			contract(arguments)
				.params('string|array')
				.params('string|array', 'string|array')
				.params('string|array', 'string|array', 'function|string|undefined')
				.end();

			return Promise.all([
				this._disallowedResources(user, actions, resourceType),
				this.allUserRoles(user).then(roles => this._disallowedResources(roles, actions, resourceType))
			]).then(permissions => _.concat(...permissions))
				.then(permissions => _.unionBy(permissions, p => (p.type || '_') + (p.id || '_')))
		}


		//-----------------------------------------------------------------------------
		//
		// Private methods
		//
		//-----------------------------------------------------------------------------

		_recurseResourcePermissions(subjects, resource) {
			return this._resourcePermissions(subjects, resource);
		}

		_resourcePermissions(subjects, resource) {
			subjects = utils.sureArray(subjects);
			if (!subjects.length) return Promise.resolve([]);

			const {Permission} = this;

			const obj = utils.typeid(subjects[0], true);
			const subjectType = obj.type;
			const subjectIds = subjects.map(subject => utils.typeid(subject, true)).map(item => {
				if (item.type !== subjectType) {
					throw new Error('subjects must be same model');
				}
				return item.id;
			});

			const where = Object.assign(
				{subjectType: subjectType, subjectId: {inq: subjectIds}},
				utils.resolvePolymorphic(Permission, 'resource', resource)
			);

			return Permission.find({where: where})
				.then(permissions => _.reduce(permissions, (result, permission) => _.union(result, permission.actions), []));
		}

		_recurseCheckPermissions(roles, resource, actions) {
			// TODO check inherits
			return this._checkPermissions(roles, resource, actions);
		}

		_checkPermissions(roles, resource, actions) {
			actions = utils.sureArray(actions).map(_.toUpper);
			return this._resourcePermissions(roles, resource).then(permissions => {
				if (_.includes(permissions, '*')) return true;
				actions = actions.filter(action => !_.includes(permissions, action));
				return !actions.length;
			});
		}

		// TODO 按 subjectType 分类组合 where 语句，支持用户和角色混合 subjects
		_allowedResources(subjects, actions, resourceType) {
			subjects = utils.sureArray(subjects);
			if (!subjects.length) return Promise.resolve([]);

			actions = utils.sureArray(actions).map(_.toUpper);

			const {Permission} = this;

			// const obj = utils.typeid(subjects[0], true);
			// const subjectType = obj.type;
			// const subjectIds = subjects.map(subject => utils.typeid(subject, true)).map(item => {
			// 	if (item.type !== subjectType) {
			// 		throw new Error('subjects must be same model');
			// 	}
			// 	return item.id;
			// });

			const groupedSubjects = _.reduce(subjects, (result, subject) => {
				subject =  utils.typeid(subject, true);
				result[subject.type] = result[subject.type] || [];
				result[subject.type].push(subject.id);
				return result;
			}, {});

			const whereSubjects = _.map(groupedSubjects, (ids, type) => {
				if (type === 'null') {
					type = null;
				}
				if (type === 'undefined') {
					type = undefined;
				}

				return {subjectType: type, subjectId: {inq: ids}};
			});

			// only support mongodb
			const whereActions = actions.map(action => ({actions: action}));

			// const conds = _.map(whereSubjects, condSubject => {
			// 	return Object.assign({}, condSubject, {resourceType, or: whereActions});
			// });

			const where = {resourceType, and: [{or: whereSubjects}, {or: whereActions}]};

			debug('allowed resources where:', where);

			return Permission.find({where: where})
				.then(permissions => _.map(permissions, p => ({type: p.resourceType, id: p.resourceId})));
		}
	}

	return ACL;
};

