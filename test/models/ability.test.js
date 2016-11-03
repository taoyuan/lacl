"use strict";

const test = require('ava');
const Promise = require('bluebird');
const s = require('../support');
const acl = require('../..');

test.beforeEach(() => {
	return s.destroyAll();
});

test('should add actions', t => {
	const {Ability} = acl;
	return Ability.add('Article', ['read', 'CREATE', 'UPDATE'])
		.then(ability => {
			t.truthy(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				t.truthy(ability);
				t.is(ability.seq, 1 << 3);
				t.deepEqual(ability.actions, {
					READ: 1,
					CREATE: 2,
					UPDATE: 4
				});
			});
		})
		.then(() => Ability.add('Article', ['read', 'APPROVAL']))
		.then(ability => {
			t.truthy(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				t.truthy(ability);
				t.is(ability.seq, 1 << 4);
				t.deepEqual(ability.actions, {
					READ: 1,
					CREATE: 2,
					UPDATE: 4,
					APPROVAL: 8
				});
			});
		})
		.then(() => Ability.add('Article:123', ['COMMENT']))
		.then(ability => {
			t.truthy(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				t.truthy(ability);
				t.is(ability.seq, 1 << 5);
				t.deepEqual(ability.actions, {
					READ: 1,
					CREATE: 2,
					UPDATE: 4,
					APPROVAL: 8,
					COMMENT: 16
				});
			});
		});
});

test('should fail for unmatched seq', t => {
	const {Ability} = acl;
	return Ability.add('Article', ['read', 'CREATE', 'UPDATE'])
		.then(ability => {
			t.truthy(ability);
			return Ability.findOne({where: {resource: 'Article'}}).then(ability => {
				t.truthy(ability);
				t.is(ability.seq, 1 << 3);
				t.deepEqual(ability.actions, {
					READ: 1,
					CREATE: 2,
					UPDATE: 4
				});
			});
		})
		.then(() => Promise.all([
			Ability.add('Article', ['read', 'APPROVAL']),
			Ability.add('Article', ['read', 'APPROVAL', 'PUBLISH'])
		]).then(([s1, s2]) => {
			t.truthy(s1);
			t.falsy(s2);
		}));
});

