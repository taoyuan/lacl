"use strict";

const test = require('ava');
const assert = require('chai').assert;
const Promise = require('bluebird');
const s = require('../support');
const acl = require('../..');

const ctx = {};
test.before(t => s.setup(ctx));
test.after(t => s.teardown(ctx));

test.beforeEach(t => s.clearData());

test('should add actions', t => {
	const {Ability} = acl;
	return Ability.add('Article', ['read', 'CREATE', 'UPDATE'])
		.then(ability => {
			assert.ok(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				assert.ok(ability);
				assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE']);
			});
		})
		.then(() => Ability.add('Article', ['read', 'APPROVAL']))
		.then(ability => {
			assert.ok(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				assert.ok(ability);
				assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE', 'APPROVAL']);
			});
		})
		.then(() => Ability.add('Article:123', ['COMMENT']))
		.then(ability => {
			assert.ok(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				assert.ok(ability);
				assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE', 'APPROVAL', 'COMMENT']);
			});
		});
});

test('should fail for unmatched updated time', t => {
	const {Ability} = acl;
	return Ability.add('Article', ['read', 'CREATE', 'UPDATE'])
		.then(ability => {
			assert.ok(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				assert.ok(ability);
				assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE']);
			});
		})
		.then(() => Promise.all([
			Ability.add('Article', ['read', 'APPROVAL']),
			Ability.add('Article', ['read', 'APPROVAL', 'PUBLISH'])
		]).then(([s1, s2]) => {
			assert.ok(s1);
			assert.notOk(s2);
		}));
});

