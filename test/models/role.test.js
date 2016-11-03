"use strict";

const test = require('ava');
const Promise = require('bluebird');
const s = require('../support');
const acl = require('../..');

test.beforeEach(() => {
	return s.destroyAll();
});

test('should find regular roles', t => {
	const {Role} = acl;
	return Promise.all([
		Role.create({name: 'member'}),
		Role.create({name: 'member', scopeType: 'org'}),
		Role.create({name: 'member', scopeType: 'team', scopeId: 'bar'})
	]).then(([role]) => {
		return Role.findRegulars().then(roles => {
			t.is(roles.length, 1);
			t.deepEqual(roles[0].toObject(), role.toObject());
		});
	});
});

test('should find by type', t => {
	const {Role} = acl;
	return Promise.all([
		Role.create({name: 'member'}),
		Role.create({name: 'member', scopeType: 'org'}),
		Role.create({name: 'member', scopeType: 'org', scopeId: 'bar'})
	]).then(([_0, role]) => {
		return Role.findByType('org').then(roles => {
			t.is(roles.length, 1);
			t.deepEqual(roles[0].toObject(), role.toObject());
		});
	});
});

test('should find by scope', t => {
	const {Role} = acl;
	return Promise.all([
		Role.create({name: 'member'}),
		Role.create({name: 'member', scopeType: 'org'}),
		Role.create({name: 'member', scopeType: 'org', scopeId: 'bar'})
	]).then(([_0, _1, role]) => {
		return Role.findByScope('org:bar').then(roles => {
			t.is(roles.length, 1);
			t.deepEqual(roles[0].toObject(), role.toObject());
		});
	});
});

