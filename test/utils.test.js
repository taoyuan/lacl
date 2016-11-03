"use strict";

const test = require('ava');
const Promise = require('bluebird');
const s = require('./support');
const acl = require('..');
const utils = require('../lib/utils');

test.beforeEach(t => {
	return s.destroyAll();
});

test('should resolve polymorphic for model object', t => {
	const {Permission, Role} = acl;
	return Role.create({name: "test"}).then(role => {
		const subject = utils.resolvePolymorphic(Permission, 'subject', role);
		t.is(subject.subjectType, Role.modelName);
		t.is(subject.subjectId, role.id);
	});
});

test('should resolve polymorphic for string', t => {
	const {Permission, Role} = acl;
	return Role.create({name: "test"}).then(role => {
		const subject = utils.resolvePolymorphic(Permission, 'subject', 'AclRole:role-id');
		t.is(subject.subjectType, Role.modelName);
		t.is(subject.subjectId, 'role-id');
	});
});

test('should resolve polymorphic for array', t => {
	const {Permission, Role} = acl;
	return Role.create({name: "test"}).then(role => {
		const subject = utils.resolvePolymorphic(Permission, 'subject', ['AclRole', 'role-id']);
		t.is(subject.subjectType, Role.modelName);
		t.is(subject.subjectId, 'role-id');
	});
});
