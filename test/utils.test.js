"use strict";

const test = require('ava');
const s = require('./support');
const utils = require('../lib/utils');

const ctx = {};
test.before(t => s.setup(ctx));
test.after(t => s.teardown(ctx));

test('should resolve polymorphic for model object', t => {
	const {Permission, Role} = ctx.acl;
	return Role.create({name: "test"}).then(role => {
		const subject = utils.resolvePolymorphic(Permission, 'subject', role);
		t.is(subject.subjectType, Role.modelName);
		t.is(subject.subjectId, role.id);
	});
});

test('should resolve polymorphic for string', t => {
	const {Permission, Role} = ctx.acl;
	return Role.create({name: "test"}).then(role => {
		const subject = utils.resolvePolymorphic(Permission, 'subject', 'AclRole:role-id');
		t.is(subject.subjectType, Role.modelName);
		t.is(subject.subjectId, 'role-id');
	});
});

test('should resolve polymorphic for array', t => {
	const {Permission, Role} = ctx.acl;
	return Role.create({name: "test"}).then(role => {
		const subject = utils.resolvePolymorphic(Permission, 'subject', ['AclRole', 'role-id']);
		t.is(subject.subjectType, Role.modelName);
		t.is(subject.subjectId, 'role-id');
	});
});
