"use strict";

const assert = require('chai').assert;
const s = require('./support');
const utils = require('../lib/utils');

describe('utils', () => {
	const ctx = {};

	before(() => s.setup(ctx));
	after(() => s.teardown(ctx));

	it('should resolve polymorphic for model object', () => {
		const {Permission, Role} = ctx.acl;
		return Role.create({name: "test"}).then(role => {
			const subject = utils.resolvePolymorphic(Permission, 'subject', role);
			assert.equal(subject.subjectType, Role.modelName);
			assert.equal(subject.subjectId, role.id);
		});
	});

	it('should resolve polymorphic for string', () => {
		const {Permission, Role} = ctx.acl;
		return Role.create({name: "test"}).then(role => {
			const subject = utils.resolvePolymorphic(Permission, 'subject', 'AclRole:role-id');
			assert.equal(subject.subjectType, Role.modelName);
			assert.equal(subject.subjectId, 'role-id');
		});
	});

	it('should resolve polymorphic for array', () => {
		const {Permission, Role} = ctx.acl;
		return Role.create({name: "test"}).then(role => {
			const subject = utils.resolvePolymorphic(Permission, 'subject', ['AclRole', 'role-id']);
			assert.equal(subject.subjectType, Role.modelName);
			assert.equal(subject.subjectId, 'role-id');
		});
	});

});
