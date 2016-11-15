"use strict";

const test = require('ava');
const assert = require('chai').assert;
const Promise = require('bluebird');
const s = require('./support');

const ctx = {};
test.before(t => s.setup(ctx));
test.after(t => s.teardown(ctx));

test.beforeEach(t => s.clearData(ctx));

test('should add role user', t => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member')
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member')
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member')
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member')
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member')
	]).then(([role]) => {
		return acl.addRoleUsers(role, 'user-1').then(() => {
			return acl.hasRole('user-1', role).then(hasRole => {
				t.is(hasRole, true);
			})
		});
	});
});


test('should has role by role name', t => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member')
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1')
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1')
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
				return Roles.findById(role.id).then(r => t.falsy(r));
			})
	});
});

test('should remove role by name', t => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1')
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
				return Roles.findById(role.id).then(r => t.falsy(r));
			})
	});
});

test('should get all roles includes inherits', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('A'),
		Roles.create('B'),
		Roles.create('C'),
		Roles.create('D'),
		Roles.create('ABC'),
		Roles.create('BCD'),
		Roles.create('ABCD'),
	]).then(([A, B, C, D, ABC, BCD, ABCD]) => {
		return Promise.all([
			Roles.inherit(ABC, [A, B, C]),
			Roles.inherit(BCD, [B, C, D]),
			Roles.inherit(ABCD, [ABC, BCD]),
		]).then(() => {
			return acl.resolveRoles([ABC, BCD])
				.then(roles => {
					assert.sameDeepMembers(roles.map(p => p.name), ['A', 'B', 'C', 'D', 'ABC', 'BCD']);
				})
				.then(() => acl.resolveRoles(ABCD))
				.then(roles => {
					assert.sameDeepMembers(roles.map(p => p.name), ['A', 'B', 'C', 'D', 'ABC', 'BCD', 'ABCD']);
				})
		});
	});
});


test('should allow', t => {
	const acl = ctx.acl;
	const {Roles, Permission} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1')
	]).then(([role]) => {
		return acl.allow(role, 'article:1', ['read'])
			.then(() => Permission.find())
			.then(permissions => {
				t.is(permissions.length, 1);
				const permission = permissions[0];
				t.deepEqual(permission.actions, ['READ']);
				t.is(permission.resourceType, 'article');
				t.is(permission.resourceId, '1');
				t.is(permission.subjectType, acl.Role.modelName);
				t.is(permission.subjectId, role.id);
			});
	});
});

test('should disallow', t => {
	const acl = ctx.acl;
	const {Roles, Permission} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1')
	]).then(([role]) => {
		return acl.allow(role, 'article:1', ['read', 'write'])
			.then(() => Permission.find())
			.then(permissions => {
				t.is(permissions.length, 1);
				t.deepEqual(permissions[0].actions, ['READ', 'WRITE']);
				t.is(permissions[0].resourceType, 'article');
				t.is(permissions[0].resourceId, '1');
				t.is(permissions[0].subjectType, acl.Role.modelName);
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
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
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

test('should is allowed', t => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.all([
			acl.allow(role1, 'article:1', ['read', 'write']),
			acl.allow(role2, 'photo', ['view', 'delete']),
			acl.allow('tom', 'report', ['view', 'design']),
		]).then(() => acl.addUserRoles('tom', [role1, role2]))
			.then(() => acl.isAllowed('tom', 'report', ['view']).then(allowed => t.is(allowed, true)))
			.then(() => acl.isAllowed('tom', 'photo', ['delete']).then(allowed => t.is(allowed, true)))
			.then(() => acl.isAllowed('tom', 'article:1', ['write']).then(allowed => t.is(allowed, true)))
			.then(() => acl.isAllowed('tom', 'article', ['write']).then(allowed => t.is(allowed, true)))
			.then(() => acl.isAllowed('tom', 'report', ['delete']).then(allowed => t.is(allowed, false)))
	});
});

test('should is allowed for a specific resource that not existed in permission collection', t => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.all([
			acl.allow(role1, 'article:1', ['read', 'write']),
			acl.allow(role2, 'photo:1', ['view', 'delete']),
			acl.allow('tom', 'report', ['view', 'design']),
		]).then(() => acl.addUserRoles('tom', [role1]))
			.then(() => acl.isAllowed('tom', 'photo:2', ['view']).then(allowed => t.is(allowed, true)))
	});
});

test('should is allowed for the resource type that not existed in permission collection', t => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.all([
			acl.allow(role1, 'article:1', ['read', 'write']),
			acl.allow(role2, 'photo', ['view', 'delete']),
			acl.allow('tom', 'report', ['view', 'design']),
		]).then(() => acl.addUserRoles('tom', [role1, role2]))
			.then(() => acl.isAllowed('tom', 'i_am_not_exited_in_permissions', ['view']).then(allowed => t.is(allowed, true)))
	});
});

test('should get allowed resources for all resource types', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role2, 'photo', ['view', 'delete']),
			() => acl.allow(role2, 'article:9', []),
			() => acl.allow('tom', 'report', ['view', 'design']),
			() => acl.allow('tom', 'photo', ['view', 'update']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role1, role2]))
			.then(() => acl.allowedResources('tom', 'view'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '1'},
					{type: 'photo', id: null},
					{type: 'report', id: null}
				]);
			});
	});
});

test('should get allowed resources for specified type', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	], fn => fn()).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role1, 'article:2', ['read']),
			() => acl.allow(role2, 'article:2', []),
			() => acl.allow(role2, 'article:3', ['delete']),
			() => acl.allow(role2, 'photo', ['view', 'delete']),
			() => acl.allow('tom', 'report', ['view', 'design']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role1]))
			.then(() => acl.allowedResources('tom', 'view', 'article'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '1'},
					// {type: 'article', id: '2'}
				]);
			});
	});
});

test('should get allowed resources includes inherits', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('A'),
		Roles.create('B'),
		Roles.create('AB'),
	]).then(([A, B, AB]) => {
		return Promise.each([
			() => Roles.inherit(AB, [A, B]),
			() => acl.addUserRoles('tom', [AB]),
			() => acl.allow(A, 'article:1', ['view']),
			() => acl.allow(B, 'photo:1', ['view']),
			() => acl.allow('tom', 'report', ['view']),
		], fn => fn())
			.then(() => acl.allowedResources('tom', 'view'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '1'},
					{type: 'photo', id: '1'},
					{type: 'report', id: null}
				]);
			});
	});
});

test('should get disallowed resources for all resource types', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1'),
	]).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'photo', ['view', 'delete']),
			() => acl.allow(role1, 'article:1', []),
			() => acl.allow(role2, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role2, 'article:2', ['view', 'read', 'write']),
			() => acl.allow(role2, 'folder:1', ['view', 'read', 'write']),
			() => acl.allow(role2, 'folder:2', ['read', 'write']),
			() => acl.allow('tom', 'report', ['view', 'design']),
			() => acl.allow('tom', 'photo', ['view', 'update']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role1]))
			.then(() => acl.disallowedResources('tom', 'view'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '1'},
					{type: 'article', id: '2'},
					{type: 'folder', id: '1'},
					{type: 'folder', id: '2'},
				]);
			});
	});
});

test('should get disallowed resources for specified type', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	], fn => fn()).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role1, 'article:2', ['read']),
			() => acl.allow(role2, 'article:2', []),
			() => acl.allow(role2, 'article:3', ['delete']),
			() => acl.allow(role2, 'photo', ['view', 'delete']),
			() => acl.allow('tom', 'report', ['view', 'design']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role1]))
			.then(() => acl.disallowedResources('tom', 'view', 'article'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '2'},
					{type: 'article', id: '3'}
				]);
			});
	});
});

test('should get disallowed resources includes inherits', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('A'),
		Roles.create('B'),
		Roles.create('C'),
		Roles.create('AB'),
	]).then(([A, B, C, AB]) => {
		return Promise.each([
			() => Roles.inherit(AB, [A, B]),
			() => acl.addUserRoles('tom', [AB]),
			() => acl.allow(A, 'article:1', ['view']),
			() => acl.allow(B, 'photo:1', ['view']),
			() => acl.allow(C, 'folder:1', ['view']),
			() => acl.allow('tom', 'report', ['view']),
		], fn => fn())
			.then(() => acl.disallowedResources('tom', 'view'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'folder', id: '1'},
				]);
			});
	});
});

test('should allowed resources for specified type', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role1, 'folder:1', ['view', 'read', 'write']),
			() => acl.allow(role2, 'photo', ['view', 'delete']),
			() => acl.allow(role2, 'article:9', []),
			() => acl.allow('tom', 'report', ['view', 'design']),
			() => acl.allow('tom', 'photo', ['view', 'update']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role2]))
			.then(() => acl.disallowedResources('tom', 'view', 'article'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '1'}
				]);
			});
	});
});

test('should remove all permissions for resource type', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role1, 'folder:1', ['view', 'read', 'write']),
			() => acl.allow(role2, 'photo', ['view', 'delete']),
			() => acl.allow(role2, 'article:9', []),
			() => acl.allow('tom', 'report', ['view', 'design']),
			() => acl.allow('tom', 'photo', ['view', 'update']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role1, role2]))
			.then(() => acl.removePermissionsByResource('article'))
			.then(() => acl.allowedResources('tom', 'view', 'article'))
			.then(resources => {
				assert.sameDeepMembers(resources, []);
			});
	});
});

test('should remove all permissions for individual resource', () => {
	const acl = ctx.acl;
	const {Roles} = acl;
	return Promise.all([
		Roles.create('member', 'org:org-1'),
		Roles.create('leader', 'org:org-1')
	]).then(([role1, role2]) => {
		return Promise.each([
			() => acl.allow(role1, 'article:1', ['view', 'read', 'write']),
			() => acl.allow(role1, 'folder:1', ['view', 'read', 'write']),
			() => acl.allow(role2, 'photo', ['view', 'delete']),
			() => acl.allow(role2, 'article:9', ['view']),
			() => acl.allow('tom', 'report', ['view', 'design']),
			() => acl.allow('tom', 'photo', ['view', 'update']),
		], fn => fn())
			.then(() => acl.addUserRoles('tom', [role1, role2]))
			.then(() => acl.removePermissionsByResource('article:1'))
			.then(() => acl.allowedResources('tom', 'view', 'article'))
			.then(resources => {
				assert.sameDeepMembers(resources, [
					{type: 'article', id: '9'}
				]);
			});
	});
});

