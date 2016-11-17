"use strict";

const assert = require('chai').assert;
const Promise = require('bluebird');
const s = require('./support');

describe('acl', () => {

	const ctx = {};

	before(() => s.setup(ctx));
	after(() => s.teardown(ctx));

	beforeEach(() => s.clearData(ctx));

	it('should add role user', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1').then(mappings => {
				assert.equal(mappings.length, 1);
				return acl.findUserRoles('user-1').then(roles => {
					assert.equal(roles.length, 1);
					assert.deepEqual(roles[0].toObject(), role.toObject());
				})
			});
		});
	});

	it('should add user role', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member')
		]).then(([role]) => {
			return acl.addUserRoles('user-1', role).then(mappings => {
				assert.equal(mappings.length, 1);
				return acl.findUserRoles('user-1').then(roles => {
					assert.equal(roles.length, 1);
					assert.deepEqual(roles[0].toObject(), role.toObject());
				})
			});
		});
	});

	it('should remove user roles', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member')
		]).then(([role]) => {
			return acl.addUserRoles('user-1', role)
				.then(() => {
					return acl.findUserRoles('user-1').then(roles => {
						assert.equal(roles.length, 1);
					});
				})
				.then(() => {
					return acl.removeUserRoles('user-1', role);
				})
				.then(() => {
					return acl.findUserRoles('user-1').then(roles => {
						assert.equal(roles.length, 0);
					});
				})
		});
	});

	it('should remove role users', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1')
				.then(() => {
					return acl.findRoleUserIds(role).then(userIds => {
						assert.equal(userIds.length, 1);
					});
				})
				.then(() => {
					return acl.removeRoleUsers(role, 'user-1');
				})
				.then(() => {
					return acl.findRoleUserIds(role).then(userIds => {
						assert.equal(userIds.length, 0);
					});
				})
		});
	});

	it('should has role by role id', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1').then(() => {
				return acl.hasRole('user-1', role).then(hasRole => {
					assert.equal(hasRole, true);
				})
			});
		});
	});


	it('should has role by role name', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1')
				.then(() => {
					return acl.hasRoleByName('user-1', 'member').then(hasRole => {
						assert.equal(hasRole, true);
					})
				}).then(() => {
					return acl.hasRoleByName('user-2', 'member').then(hasRole => {
						assert.equal(hasRole, false);
					})
				})
		});
	});


	it('should has role by role name with scope', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1')
				.then(() => {
					return acl.hasRoleByName('user-1', 'member', 'org:org-1').then(hasRole => {
						assert.equal(hasRole, true);
					})
				})
				.then(() => {
					return acl.hasRoleByName('user-1', 'member', 'org').then(hasRole => {
						assert.equal(hasRole, false);
					});
				});
		});
	});


	it('should remove role by id', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1')
				.then(() => {
					return acl.hasRoleByName('user-1', 'member', 'org:org-1').then(hasRole => {
						assert.equal(hasRole, true);
					})
				})
				.then(() => acl.removeRole(role))
				.then(() => {
					return acl.hasRoleByName('user-1', 'member', 'org:org-1').then(hasRole => {
						assert.equal(hasRole, false);
					})
				})
				.then(() => {
					return acl.Role.findById(role.id).then(r => assert.notOk(r));
				})
		});
	});

	it('should remove role by name', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1')
		]).then(([role]) => {
			return acl.addRoleUsers(role, 'user-1')
				.then(() => {
					return acl.hasRole('user-1', role).then(hasRole => {
						assert.equal(hasRole, true);
					})
				})
				.then(() => acl.removeRoleByName('member', 'org:org-1'))
				.then(() => {
					return acl.hasRole('user-1', role).then(hasRole => {
						assert.equal(hasRole, false);
					})
				})
				.then(() => {
					return acl.Role.findById(role.id).then(r => assert.notOk(r));
				})
		});
	});

	it('should get all roles includes inherits', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('A'),
			acl.Role.sure('B'),
			acl.Role.sure('C'),
			acl.Role.sure('D'),
			acl.Role.sure('ABC'),
			acl.Role.sure('BCD'),
			acl.Role.sure('ABCD'),
		]).then(([A, B, C, D, ABC, BCD, ABCD]) => {
			return Promise.all([
				acl.Role.inherit(ABC, [A, B, C]),
				acl.Role.inherit(BCD, [B, C, D]),
				acl.Role.inherit(ABCD, [ABC, BCD]),
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

	it('should allow', () => {
		const acl = ctx.acl;
		const {Permission} = acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1')
		]).then(([role]) => {
			return acl.allow(role, 'article:1', ['read'])
				.then(() => Permission.find())
				.then(permissions => {
					assert.equal(permissions.length, 1);
					const permission = permissions[0];
					assert.sameMembers(permission.actions, ['READ']);
					assert.equal(permission.resourceType, 'article');
					assert.equal(permission.resourceId, '1');
					assert.equal(permission.subjectType, acl.Role.modelName);
					assert.equal(permission.subjectId, role.id);
				});
		});
	});

	it('should disallow', () => {
		const acl = ctx.acl;
		const {Permission} = acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1')
		]).then(([role]) => {
			return acl.allow(role, 'article:1', ['read', 'write'])
				.then(() => Permission.find())
				.then(permissions => {
					assert.equal(permissions.length, 1);
					assert.sameMembers(permissions[0].actions, ['READ', 'WRITE']);
					assert.equal(permissions[0].resourceType, 'article');
					assert.equal(permissions[0].resourceId, '1');
					assert.equal(permissions[0].subjectType, acl.Role.modelName);
					assert.equal(permissions[0].subjectId, role.id);
				})
				.then(() => acl.disallow(role, 'article:1', ['write']))
				.then(() => Permission.find())
				.then(permissions => {
					assert.equal(permissions.length, 1);
					assert.sameMembers(permissions[0].actions, ['READ']);
				})
		});
	});

	it('should get allowed permissions', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
		]).then(([role1, role2]) => {
			return Promise.all([
				acl.allow(role1, 'article:1', ['read', 'write']),
				acl.allow(role2, 'photo', ['view', 'delete']),
				acl.allow('tom', 'report', ['view', 'design']),
			]).then(() => acl.addUserRoles('tom', [role1, role2]))
				.then(() => acl.allowedPermissions('tom', ['article:1', 'photo', 'report']))
				.then(permissions => {
					assert.deepEqual(permissions, [
						{'article:1': ['READ', 'WRITE']},
						{'photo': ['VIEW', 'DELETE']},
						{'report': ['VIEW', 'DESIGN']}
					]);
				})
		});
	});

	it('should is allowed', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
		]).then(([role1, role2]) => {
			return Promise.all([
				acl.allow(role1, 'article:1', ['read', 'write']),
				acl.allow(role2, 'photo', ['view', 'delete']),
				acl.allow('tom', 'report', ['view', 'design']),
			]).then(() => acl.addUserRoles('tom', [role1, role2]))
				.then(() => acl.isAllowed('tom', 'report', ['view']).then(allowed => assert.equal(allowed, true)))
				.then(() => acl.isAllowed('tom', 'photo', ['delete']).then(allowed => assert.equal(allowed, true)))
				.then(() => acl.isAllowed('tom', 'article:1', ['write']).then(allowed => assert.equal(allowed, true)))
				.then(() => acl.isAllowed('tom', 'article', ['write']).then(allowed => assert.equal(allowed, true)))
				.then(() => acl.isAllowed('tom', 'report', ['delete']).then(allowed => assert.equal(allowed, false)))
		});
	});

	it('should is allowed for a specific resource that not existed in permission collection', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
		]).then(([role1, role2]) => {
			return Promise.all([
				acl.allow(role1, 'article:1', ['read', 'write']),
				acl.allow(role2, 'photo:1', ['view', 'delete']),
				acl.allow('tom', 'report', ['view', 'design']),
			]).then(() => acl.addUserRoles('tom', [role1]))
				.then(() => acl.isAllowed('tom', 'photo:2', ['view']).then(allowed => assert.equal(allowed, true)))
		});
	});

	it('should is allowed for the resource type that not existed in permission collection', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
		]).then(([role1, role2]) => {
			return Promise.all([
				acl.allow(role1, 'article:1', ['read', 'write']),
				acl.allow(role2, 'photo', ['view', 'delete']),
				acl.allow('tom', 'report', ['view', 'design']),
			]).then(() => acl.addUserRoles('tom', [role1, role2]))
				.then(() => acl.isAllowed('tom', 'i_am_not_exited_in_permissions', ['view']).then(allowed => assert.equal(allowed, true)))
		});
	});

	it('should get allowed resources for all resource types', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
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

	it('should get allowed resources for specified type', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
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

	it('should get allowed resources includes inherits', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('A'),
			acl.Role.sure('B'),
			acl.Role.sure('AB'),
		]).then(([A, B, AB]) => {
			return Promise.each([
				() => acl.Role.inherit(AB, [A, B]),
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

	it('should get disallowed resources for all resource types', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1'),
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

	it('should get disallowed resources for specified type', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
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

	it('should get disallowed resources includes inherits', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('A'),
			acl.Role.sure('B'),
			acl.Role.sure('C'),
			acl.Role.sure('AB'),
		]).then(([A, B, C, AB]) => {
			return Promise.each([
				() => acl.Role.inherit(AB, [A, B]),
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

	it('should allowed resources for specified type', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
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

	it('should remove all permissions for resource type', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
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

	it('should remove all permissions for individual resource', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member', 'org:org-1'),
			acl.Role.sure('leader', 'org:org-1')
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


});
