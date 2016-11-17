"use strict";

const assert = require('chai').assert;
const Promise = require('bluebird');
const s = require('./support');

describe('service/Role', () => {

	const ctx = {};
	before(() => s.setup(ctx));
	after(() => s.teardown(ctx));

	beforeEach(() => s.clearData(ctx));

	it('should find regular roles', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member'),
			acl.Role.sure('member', 'org'),
			acl.Role.sure('member', 'team:bar')
		]).then(([role]) => {
			return acl.Role.findRegulars().then(roles => {
				assert.equal(roles.length, 1);
				assert.deepEqual(roles[0].toObject(), role.toObject());
			});
		});
	});

	it('should find by type', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member'),
			acl.Role.sure('member', 'org'),
			acl.Role.sure('member', 'org:bar')
		]).then(([_0, role]) => {
			return acl.Role.findByType('org').then(roles => {
				assert.equal(roles.length, 1);
				assert.deepEqual(roles[0].toObject(), role.toObject());
			});
		});
	});

	it('should find by scope', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member'),
			acl.Role.sure('member', 'org'),
			acl.Role.sure('member', 'org:bar')
		]).then(([_0, _1, role]) => {
			return acl.Role.findByScope('org:bar').then(roles => {
				assert.equal(roles.length, 1);
				assert.deepEqual(roles[0].toObject(), role.toObject());
			});
		});
	});

	it('should remove role', () => {
		const acl = ctx.acl;
		return Promise.all([
			acl.Role.sure('member'),
			acl.Role.sure('member', 'org'),
			acl.Role.sure('member', 'org:bar')
		]).then(() => {
			return acl.Role.countByScope(null, 'member')
				.then(count => assert.ok(count))
				.then(() => acl.Role.countByScope('org', 'member'))
				.then(count => assert.ok(count))
				.then(() => acl.Role.countByScope('org:bar', 'member'))
				.then(count => assert.ok(count))

				.then(() => acl.Role.removeByScope(null, 'member'))
				.then(() => acl.Role.countByScope(null, 'member'))
				.then(count => assert.notOk(count))
				.then(() => acl.Role.countByScope('org', 'member'))
				.then(count => assert.ok(count))
				.then(() => acl.Role.countByScope('org:bar', 'member'))
				.then(count => assert.ok(count))

				.then(() => acl.Role.removeByScope('org', 'member'))
				.then(() => acl.Role.countByScope('org', 'member'))
				.then(count => assert.notOk(count))
				.then(() => acl.Role.countByScope('org:bar', 'member'))
				.then(count => assert.ok(count))

				.then(() => acl.Role.removeByScope('org:bar', 'member'))
				.then(() => acl.Role.countByScope('org:bar', 'member'))
				.then(count => assert.notOk(count))
		});
	});

	it('should inherits from parents', () => {
		const {acl} = ctx;
		return Promise.all([
			acl.Role.sure('member'),
			acl.Role.sure('leader'),
			acl.Role.sure('admin')
		]).then(([member, leader, admin]) => {
			return acl.Role.inherit(admin, member)
				.then(role => {
					assert.sameMembers(role.parentIds, [member.id]);
				})
				.then(() => acl.Role.inherit(admin, leader))
				.then(role => {
					assert.sameMembers(role.parentIds, [member.id, leader.id]);
				})
				.then(() => acl.Role.uninherit(admin, member))
				.then(role => {
					assert.sameMembers(role.parentIds, [leader.id]);
				})
				.then(() => acl.Role.setInherits(admin, [admin, member, leader]))
				.then(role => {
					assert.sameMembers(role.parentIds, [member.id, leader.id]);
				})
		});
	});

	it('should get roles parents', () => {
		const {acl} = ctx;
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
				return acl.Role.getRolesParents([ABC, BCD]).then(parents => {
					assert.sameDeepMembers(parents.map(p => p.name), ['A', 'B', 'C', 'D']);
				});
			});
		});
	});
});

