"use strict";

const test = require('ava');
const Promise = require('bluebird');
const s = require('./support');
const lacl = require('..');

const ctx = {};
test.before(t => s.setup(ctx));
test.after(t => s.teardown(ctx));

test.beforeEach(t => s.clearData());

test('should find regular roles', t => {
	const acl = new lacl.Acl();
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
	const acl = new lacl.Acl();
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
	const acl = new lacl.Acl();
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

