'use strict';

const SG = require('strong-globalize');
SG.SetRootDir(require('path').join(__dirname, '..'));

const ACL = require('./acl');

const sacl = (ds, options) => new ACL(ds, options);

sacl.DEFAULT_ACTIONS = ACL.DEFAULT_ACTIONS;
Object.assign(sacl, ACL.DEFAULT_ACTIONS);

// For code assistant of IDE like webstorm
sacl.READ = ACL.DEFAULT_ACTIONS.READ;
sacl.WRITE = ACL.DEFAULT_ACTIONS.WRITE;
sacl.MANAGE = ACL.DEFAULT_ACTIONS.MANAGE;
sacl.EXECUTE = ACL.DEFAULT_ACTIONS.EXECUTE;

sacl.ACL = sacl.Acl = ACL;
sacl.acl = sacl.createAcl = sacl.createACL = (ds, options) => new ACL(ds, options);

module.exports = sacl;
