"use strict";

const g = require('strong-globalize')();
const debug = require('debug')('sacl:acl');
const _ = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');
const utils = require('./utils');
const contract = require('./contract');
const schema = require('./schema');
const Roles = require('./services/roles');
const Abilities = require('./services/abilities');

class ACL {
	/**
	 *
	 * @param {String|DataSource} ds
	 * @param options
	 */
	constructor(ds, options) {
		assert(ds, g.f('`datasource` is required'));

		options = options || {};

		if (typeof ds === 'string') {
			ds = require('loopback').createDataSource(ds);
			this.connect = () => ds.connect();
			this.disconnect = () => ds.disconnect();
		}

		//noinspection JSUnresolvedVariable
		this.ds = this.datasource = this.dataSource = ds;

		this.models = schema.loadModels(ds);
		Object.assign(this, this.models);

		//noinspection JSUnresolvedVariable
		this.Roles = this.roles = new Roles(this);
		//noinspection JSUnresolvedVariable
		this.Abilities = this.abilities = new Abilities(this);

		if (options.abilities) {
			this.abilities.addStaticActions(options.abilities);
		}
	}

	findUserRoles(user, scope) {
		const {Mapping, Roles} = this;
		const userId = utils.getId(user);
		return Mapping.find({where: {userId}}).then(mappings => mappings.map(mapping => mapping.roleId))
			.then(roleIds => Roles.findByScope(scope || '*', {where: {id: {inq: roleIds}}}));
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

	hasRole(user, role) {
		const {Mapping} = this;
		const userId = utils.getId(user);
		const roleId = utils.getId(role);
		return Mapping.count({userId, roleId}).then(count => !!count);
	}

	hasRoleByName(user, name, scope) {
		const {Role} = this;
		if (scope === undefined) {
			scope = null; // force to search in global
		}
		if (scope === '*') {
			throw new Error(g.f('Invalid * scope for hasRoleByName, you can ignore it or set null for global role'));
		}
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

	removeResource(resource) {
		contract(arguments)
			.params('object|string|array')
			.end();

		const {Permission} = this;
		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		if (resource.resourceId === null) delete resource.resourceId;
		return Permission.remove(resource);
	}

	allow(subject, resources, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.end();

		const {Permission} = this;
		resources = utils.sureArray(resources);
		actions = utils.sureArray(actions).map(_.toUpper);
		return Promise.map(resources, resource => {
			return Permission.allow(subject, resource, actions);
		});
	}

	disallow(subject, resources, actions) {
		contract(arguments)
			.params('object|string|array', 'object|string|array', 'string|array')
			.end();

		const {Permission} = this;
		resources = utils.sureArray(resources);
		actions = utils.sureArray(actions).map(_.toUpper);
		return Promise.map(resources, resource => {
			return Permission.disallow(subject, resource, actions);
		});
	}


	allowedPermissions(user, resources) {
		contract(arguments)
			.params('object|string|array', 'string|object|array')
			.end();

		resources = utils.sureArray(resources);
		return this._allUserRoles(user).then(roles => {
			return Promise.map(resources, resource => {
				return Promise.all([
					this._resourcePermissions(user, resource),
					this._recurseResourcePermissions(roles, resource)
				]).then(permissions => ({[resource]: _.union(...permissions)}));
			});
		});
	}

	hasPermission(user, resource, actions) {
		return this.isAllowed(...arguments);
	}

	hasPermissionForRoles(roles, resource, actions) {
		return this.isAllowedForRoles(...arguments);
	}

	isAllowed(user, resource, actions) {
		contract(arguments)
			.params('object|string|array', 'string|object', 'string|array')
			.end();
		return this.Permission.isResourceRestricted(resource).then(restricted => {
			// resource has not been restricted, allow it
			if (!restricted) return true;
			return this._checkPermissions(user, resource, actions).then(allowed => {
				if (allowed) return allowed;
				return this._allUserRoles(user).then(roles => this.isAllowedForRoles(roles, resource, actions));
			});
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

		return this._allUserRoles(user).then(roles => this.Permission.allowedResources([user].concat(roles), actions, resourceType))
			.then(permissions => _.unionBy(permissions, p => (p.type || '_') + (p.id || '_')));
	}

	disallowedResources(user, actions, resourceType) {
		contract(arguments)
			.params('string|array')
			.params('string|array', 'string|array')
			.params('string|array', 'string|array', 'function|string|undefined')
			.end();

		return this._allUserRoles(user).then(roles => this.Permission.disallowedResources([user].concat(roles), actions, resourceType))
			.then(permissions => _.unionBy(permissions, p => (p.type || '_') + (p.id || '_')));
	}

	//-----------------------------------------------------------------------------
	//
	// Private methods
	//
	//-----------------------------------------------------------------------------

	/**
	 *
	 * @param roles
	 * @returns {*|Array}
	 * @private
	 */
	_allRoles(roles) {
		contract(arguments)
			.params('object|array')
			.end();

		roles = utils.sureArray(roles);

		return this.Roles.getRolesParents(roles).then(parents => {
			if (parents && parents.length > 0) {
				return this._allRoles(parents).then(pps => _.unionBy(roles, pps, item => item.id))
			}
			return roles;
		});
	}


	/**
	 *
	 * @param user
	 * @param scope
	 * @returns {Promise.<Array>}
	 * @private
	 */
	_allUserRoles(user, scope) {
		contract(arguments)
			.params('object|string', 'object|string|array')
			.params('object|string')
			.end();

		return this.findUserRoles(user, scope).then(roles => this._allRoles(roles));
	}

	/**
	 *
	 * @param roles
	 * @param resource
	 * @returns {*}
	 * @private
	 */
	_recurseResourcePermissions(roles, resource) {
		if (!roles || roles.length === 0) {
			return Promise.resolve([]);
		}

		const {Roles} = this;
		return this._resourcePermissions(roles, resource).then(actions => {
			return Roles.getRolesParents(roles).then(parents => {
				if (parents || parents.length) {
					return this._recurseResourcePermissions(parents, resource).then(pas => {
						return _.union(actions, pas);
					});
				}
				return actions;
			})
		});
	}

	/**
	 *
	 * @param subjects
	 * @param resource
	 * @returns {*}
	 * @private
	 */
	_resourcePermissions(subjects, resource) {
		subjects = utils.sureArray(subjects);
		if (!subjects.length) return Promise.resolve([]);

		const {Permission} = this;

		const groupedSubjects = _.reduce(subjects, (result, subject) => {
			subject = utils.typeid(subject, true);
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

		resource = utils.resolvePolymorphic(Permission, 'resource', resource);
		const where = Object.assign({or: whereSubjects}, resource);

		debug('find resource permissions where: %j', where);

		return Permission.find({where: where})
			.then(permissions => _.reduce(permissions, (result, permission) => _.union(result, permission.actions), []));
	}


	/**
	 *
	 * @param roles
	 * @param resource
	 * @param actions
	 * @returns {*}
	 * @private
	 */
	_recurseCheckPermissions(roles, resource, actions) {
		const {Roles} = this;
		return this._checkPermissions(roles, resource, actions).then(hasPermission => {
			if (hasPermission) return true;
			return Roles.getRolesParents(roles).then(parents => {
				if (parents && parents.length) {
					return this._recurseCheckPermissions(parents, resource, actions);
				}
				return false;
			})
		})
	}

	/**
	 *
	 * @param roles
	 * @param resource
	 * @param actions
	 * @returns {Promise.<Boolean>}
	 * @private
	 */
	_checkPermissions(roles, resource, actions) {
		actions = utils.sureArray(actions).map(_.toUpper);
		return this._resourcePermissions(roles, resource).then(permissions => {
			if (_.includes(permissions, '*')) return true;
			actions = actions.filter(action => !_.includes(permissions, action));
			return !actions.length;
		});
	}

}

module.exports = ACL;
