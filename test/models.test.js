"use strict";

const test = require('ava');
const Promise = require('bluebird');
const s = require('./support');
const acl = require('..');

test.beforeEach(t => {
	return s.destroyAll();
});

test('', t => {
	t.pass();
});

//
// test('should add user from role', t => {
// 	const {Role} = acl;
// 	return Promise.all([
// 		Role.create({name: 'member'})
// 	]).then(([role]) => {
// 		return acl.addRoleUsers(role, 'user-1').then(userId => {
// 			return acl.findRolesByUserId(userId).then(roles => {
// 				t.is(roles.length, 1);
// 				t.deepEqual(roles[0].toObject(), role.toObject());
// 			})
// 		});
// 	});
// });
//
// test('should add role from user', t => {
// 	const {User, Role} = acl;
// 	return Promise.all([
// 		User.create({id: 1}),
// 		Role.create({name: 'member'})
// 	]).then(([user, role]) => {
// 		return user.roles.add(role).then(() => {
// 			return Promise.fromCallback(cb => role.users(cb)).then(users => {
// 				t.is(users.length, 1);
// 				t.deepEqual(users[0].toObject(), user.toObject());
// 			})
// 		});
// 	});
// });
//
// test('should create permission', t => {
// 	const {Permission} = acl;
// 	return Permission.create({
// 		subjectType: 'User',
// 		subjectId: 'user-id',
// 		resourceType: 'Article',
// 		resourceId: 'article-id'
// 	}).then(permission => {
// 		return Permission.find().then(permissions => {
// 			t.is(permissions.length, 1);
// 			t.deepEqual(permissions[0].toObject(), permission.toObject());
// 		});
// 	});
// });
//
// test('should add and remove permission to user', t => {
// 	const {User, Permission} = acl;
// 	return Promise.all([
// 		User.create({id: 1})
// 	]).then(([user]) => {
// 		return user.permissions.create({resourceType: 'Article', resourceId: 'article-1', permission: 'read'}).then(permission => {
// 			return User.findById(user.id).then(u => Promise.fromCallback(cb => u.permissions(cb))).then(permissions => {
// 				t.is(permissions.length, 1);
// 				t.deepEqual(permissions[0].toObject(), permission.toObject());
// 			}).then(() => {
// 				return user.permissions.destroy(permission.id).then(() => Permission.count().then(count => t.is(count, 0)));
// 			});
// 		})
// 	});
// });
//
// test('should add and remove permission to role', t => {
// 	const {Role, Permission} = acl;
// 	return Promise.all([
// 		Role.create({name: 'member'})
// 	]).then(([role]) => {
// 		return role.permissions.create({resourceType: 'Article', resourceId: 'article-2', permission: 'read'}).then(permission => {
// 			return Role.findById(role.id).then(r => Promise.fromCallback(cb => r.permissions(cb))).then(permissions => {
// 				t.is(permissions.length, 1);
// 				t.deepEqual(permissions[0].toObject(), permission.toObject());
// 			}).then(() => {
// 				return role.permissions.destroy(permission.id).then(() => Permission.count().then(count => t.is(count, 0)));
// 			})
// 		});
// 	});
// });
