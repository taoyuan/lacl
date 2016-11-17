"use strict";

const assert = require('chai').assert;
const Promise = require('bluebird');
const s = require('./support');

describe('model/Ability', () => {

	const ctx = {};
	before(() => s.setup(ctx));
	after(() => s.teardown(ctx));

	beforeEach(() => s.clearData(ctx));

	it('should add actions', () => {
		const acl = ctx.acl;
		const {Ability} = acl;
		return Ability.addActions('Article', ['read', 'CREATE', 'UPDATE'])
			.then(ability => {
				assert.ok(ability);
				return Ability.findByResource('Article').then(ability => {
					assert.ok(ability);
					assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE']);
				});
			})
			.then(() => Ability.addActions('Article', ['read', 'APPROVAL']))
			.then(ability => {
				assert.ok(ability);
				return Ability.findByResource('Article').then(ability => {
					assert.ok(ability);
					assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE', 'APPROVAL']);
				});
			})
			.then(() => Ability.addActions('Article:123', ['COMMENT']))
			.then(ability => {
				assert.ok(ability);
				return Ability.findByResource('Article').then(ability => {
					assert.ok(ability);
					assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE', 'APPROVAL', 'COMMENT']);
				});
			});
	});

	it('should fail for unmatched updated time', () => {
		const acl = ctx.acl;
		const {Ability} = acl;
		return Ability.addActions('Article', ['read', 'CREATE', 'UPDATE'])
			.then(ability => {
				assert.ok(ability);
				return Ability.findByResource('Article').then(ability => {
					assert.ok(ability);
					assert.sameMembers(ability.actions, ['READ', 'CREATE', 'UPDATE']);
				});
			})
			.then(() => Promise.all([
				Ability.addActions('Article', ['read', 'APPROVAL']),
				Ability.addActions('Article', ['read', 'APPROVAL', 'PUBLISH'])
			]).then(([s1, s2]) => {
				assert.ok(s1);
				assert.notOk(s2);
			}));
	});
});
