'use strict';

const SG = require('strong-globalize');
SG.SetRootDir(require('path').join(__dirname, '..'));

const ACL = require('./acl');

const lacl = (ds, options) => new ACL(ds, options);

lacl.ACL = lacl.Acl = ACL;
lacl.acl = lacl.createAcl = lacl.createACL = (ds, options) => new ACL(ds, options);

module.exports = lacl;
