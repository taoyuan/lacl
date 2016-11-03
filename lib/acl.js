"use strict";

const g = require('strong-globalize')();
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

		_resourcePermissions(subjects, resource) {
			subjects = utils.sureArray(subjects);
			if (!subjects.length) return Promise.resolve([]);

			const {Permission} = this;

			const obj = utils.typeid(subjects[0], true);
			const subjectType = obj.type;// && obj.id && (obj.type !== obj.id)? obj.type : Role.modelName;
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

			return Permission.find({where: where}).then(permissions => {
				// TODO union inherited role permissions
				return permissions;
			}).then(permissions => _.reduce(permissions, (result, permission) => _.union(result, permission.actions), []));
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
						this._resourcePermissions(roles, resource)
					]).then(permissions => ({[resource]: _.union(...permissions)}));
				});
			});
		}

		isAllowed(user, resource, actions) {
			contract(arguments)
				.params('object|string|array', 'string|object', 'string|array')
				.end();
			return this.allUserRoles(user).then(roles => this.isRolesAllowed(roles, resource, actions));

		}

		isRolesAllowed(roles, resource, actions) {
			contract(arguments)
				.params('object|string|array', 'string|object', 'string|array')
				.end();

			roles = utils.sureArray(roles);
			actions = utils.sureArray(actions);
			if (!roles.length) return false;
			return this._checkPermissions(roles, resource, actions);
		}

		_checkPermissions(roles, resource, actions) {

		}
	}

	return ACL;
};

