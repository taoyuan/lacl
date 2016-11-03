"use strict";

const test = require('ava');
const Promise = require('bluebird');
const s = require('./support');
const acls = require('..');

test.beforeEach(() => {
	return s.destroyAll();
});

test('should add role user', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1').then(mappings => {
			t.is(mappings.length, 1);
			return acl.findUserRoles('user-1').then(roles => {
				t.is(roles.length, 1);
				t.deepEqual(roles[0].toObject(), role.toObject());
			})
		});
	});
});

test('should add user role', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member'})
	]).then(([role]) => {
		return acl.addUserRoles('user-1', role).then(mappings => {
			t.is(mappings.length, 1);
			return acl.findUserRoles('user-1').then(roles => {
				t.is(roles.length, 1);
				t.deepEqual(roles[0].toObject(), role.toObject());
			})
		});
	});
});

test('should remove user roles', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member'})
	]).then(([role]) => {
		return acl.addUserRoles('user-1', role)
			.then(() => {
				return acl.findUserRoles('user-1').then(roles => {
					t.is(roles.length, 1);
				});
			})
			.then(() => {
				return acl.removeUserRoles('user-1', role);
			})
			.then(() => {
				return acl.findUserRoles('user-1').then(roles => {
					t.is(roles.length, 0);
				});
			})
	});
});


test('should remove role users', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1')
			.then(() => {
				return acl.findRoleUserIds(role).then(userIds => {
					t.is(userIds.length, 1);
				});
			})
			.then(() => {
				return acl.removeRoleUsers(role, 'user-1');
			})
			.then(() => {
				return acl.findRoleUserIds(role).then(userIds => {
					t.is(userIds.length, 0);
				});
			})
	});
});

test('should has role by role id', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1').then(() => {
			return acl.hasRole('user-1', role).then(hasRole => {
				t.is(hasRole, true);
			})
		});
	});
});


test('should has role by role name', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1')
			.then(() => {
				return acl.hasRoleByName('user-1', 'member').then(hasRole => {
					t.is(hasRole, true);
				})
			}).then(() => {
				return acl.hasRoleByName('user-2', 'member').then(hasRole => {
					t.is(hasRole, false);
				})
			})
	});
});


test('should has role by role name with scope', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member', scopeType: 'org', scopeId: 'org-1'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1')
			.then(() => {
				return acl.hasRoleByName('user-1', 'member', 'org:org-1').then(hasRole => {
					t.is(hasRole, true);
				})
			})
			.then(() => {
				return acl.hasRoleByName('user-1', 'member', 'org').then(hasRole => {
					t.is(hasRole, false);
				});
			});
	});
});


test('should remove role by id', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member', scopeType: 'org', scopeId: 'org-1'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1')
			.then(() => {
				return acl.hasRoleByName('user-1', 'member', 'org:org-1').then(hasRole => {
					t.is(hasRole, true);
				})
			})
			.then(() => acl.removeRole(role))
			.then(() => {
				return acl.hasRoleByName('user-1', 'member', 'org:org-1').then(hasRole => {
					t.is(hasRole, false);
				})
			})
			.then(() => {
				return Role.findById(role.id).then(r => t.falsy(r));
			})
	});
});

test('should remove role by name', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member', scopeType: 'org', scopeId: 'org-1'})
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1')
			.then(() => {
				return acl.hasRole('user-1', role).then(hasRole => {
					t.is(hasRole, true);
				})
			})
			.then(() => acl.removeRoleByName('member', 'org:org-1'))
			.then(() => {
				return acl.hasRole('user-1', role).then(hasRole => {
					t.is(hasRole, false);
				})
			})
			.then(() => {
				return Role.findById(role.id).then(r => t.falsy(r));
			})
	});
});

test('should allow', t => {
	const {Role, Permission} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member', scopeType: 'org', scopeId: 'org-1'})
	]).then(([role]) => {
		return acl.allow(role, 'article:1', ['read'])
			.then(() => Permission.find())
			.then(permissions => {
				t.is(permissions.length, 1);
				const permission = permissions[0];
				t.deepEqual(permission.actions, ['READ']);
				t.is(permission.resourceType, 'article');
				t.is(permission.resourceId, '1');
				t.is(permission.subjectType, Role.modelName);
				t.is(permission.subjectId, role.id);
			});
	});
});

test('should disallow', t => {
	const {Role, Permission} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member', scopeType: 'org', scopeId: 'org-1'})
	]).then(([role]) => {
		return acl.allow(role, 'article:1', ['read', 'write'])
			.then(() => Permission.find())
			.then(permissions => {
				t.is(permissions.length, 1);
				t.deepEqual(permissions[0].actions, ['READ', 'WRITE']);
				t.is(permissions[0].resourceType, 'article');
				t.is(permissions[0].resourceId, '1');
				t.is(permissions[0].subjectType, Role.modelName);
				t.is(permissions[0].subjectId, role.id);
			})
			.then(() => acl.disallow(role, 'article:1', ['write']))
			.then(() => Permission.find())
			.then(permissions => {
				t.is(permissions.length, 1);
				t.deepEqual(permissions[0].actions, ['READ']);
			})
	});
});

test('should get allowed permissions', t => {
	const {Role} = acls;
	const acl = new acls.Acl();
	return Promise.all([
		Role.create({name: 'member', scopeType: 'org', scopeId: 'org-1'}),
		Role.create({name: 'leader', scopeType: 'org', scopeId: 'org-1'})
	]).then(([role1, role2]) => {
		return Promise.all([
			acl.allow(role1, 'article:1', ['read', 'write']),
			acl.allow(role2, 'photo', ['view', 'delete']),
			acl.allow('tom', 'report', ['view', 'design']),
		]).then(() => acl.addUserRoles('tom', [role1, role2]))
			.then(() => acl.allowedPermissions('tom', ['article:1', 'photo', 'report']))
			.then(permissions => {
				t.deepEqual(permissions, [
					{'article:1': ['READ', 'WRITE']},
					{'photo': ['VIEW', 'DELETE']},
					{'report': ['VIEW', 'DESIGN']}
				]);
			})
	});
});
