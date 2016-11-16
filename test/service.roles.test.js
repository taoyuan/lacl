"use strict";

const assert = require('chai').assert;
const test = require('ava');
const Promise = require('bluebird');
const s = require('./support');

const ctx = {};
test.before(t => s.setup(ctx));
test.after(t => s.teardown(ctx));

test.beforeEach(t => s.clearData(ctx));

test('should find regular roles', t => {
	const acl = ctx.acl;
	return Promise.all([
		acl.roles.create('member'),
		acl.roles.create('member', 'org'),
		acl.roles.create('member', 'team:bar')
	]).then(([role]) => {
		return acl.roles.findRegulars().then(roles => {
			t.is(roles.length, 1);
			t.deepEqual(roles[0].toObject(), role.toObject());
		});
	});
});

test('should find by type', t => {
	const acl = ctx.acl;
	return Promise.all([
		acl.roles.create('member'),
		acl.roles.create('member', 'org'),
		acl.roles.create('member', 'org:bar')
	]).then(([_0, role]) => {
		return acl.roles.findByType('org').then(roles => {
			t.is(roles.length, 1);
			t.deepEqual(roles[0].toObject(), role.toObject());
		});
	});
});

test('should find by scope', t => {
	const acl = ctx.acl;
	return Promise.all([
		acl.roles.create('member'),
		acl.roles.create('member', 'org'),
		acl.roles.create('member', 'org:bar')
	]).then(([_0, _1, role]) => {
		return acl.roles.findByScope('org:bar').then(roles => {
			t.is(roles.length, 1);
			t.deepEqual(roles[0].toObject(), role.toObject());
		});
	});
});

test('should remove role', t => {
	const acl = ctx.acl;
	return Promise.all([
		acl.roles.create('member'),
		acl.roles.create('member', 'org'),
		acl.roles.create('member', 'org:bar')
	]).then(() => {
		return acl.roles.countByScope(null, 'member')
			.then(count => t.truthy(count))
			.then(() => acl.roles.countByScope('org', 'member'))
			.then(count => t.truthy(count))
			.then(() => acl.roles.countByScope('org:bar', 'member'))
			.then(count => t.truthy(count))

			.then(() => acl.roles.removeByScope(null, 'member'))
			.then(() => acl.roles.countByScope(null, 'member'))
			.then(count => t.falsy(count))
			.then(() => acl.roles.countByScope('org', 'member'))
			.then(count => t.truthy(count))
			.then(() => acl.roles.countByScope('org:bar', 'member'))
			.then(count => t.truthy(count))

			.then(() => acl.roles.removeByScope('org', 'member'))
			.then(() => acl.roles.countByScope('org', 'member'))
			.then(count => t.falsy(count))
			.then(() => acl.roles.countByScope('org:bar', 'member'))
			.then(count => t.truthy(count))

			.then(() => acl.roles.removeByScope('org:bar', 'member'))
			.then(() => acl.roles.countByScope('org:bar', 'member'))
			.then(count => t.falsy(count))
	});
});

test('should inherits from parents', t => {
	const {Roles} = ctx.acl;
	return Promise.all([
		Roles.create('member'),
		Roles.create('leader'),
		Roles.create('admin')
	]).then(([member, leader, admin]) => {
		return Roles.inherit(admin, member)
			.then(role => {
				t.deepEqual(role.parentIds, [member.id]);
			})
			.then(() => Roles.inherit(admin, leader))
			.then(role => {
				t.deepEqual(role.parentIds, [member.id, leader.id]);
			})
			.then(() => Roles.uninherit(admin, member))
			.then(role => {
				t.deepEqual(role.parentIds, [leader.id]);
			})
			.then(() => Roles.setInherits(admin, [admin, member, leader]))
			.then(role => {
				t.deepEqual(role.parentIds, [member.id, leader.id]);
			})
	});
});

test('should get roles parents', () => {
	const {Roles} = ctx.acl;
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
			return Roles.getRolesParents([ABC, BCD]).then(parents => {
				assert.sameDeepMembers(parents.map(p => p.name), ['A', 'B', 'C', 'D']);
			});
		});
	});
});




