'use strict';

const SG = require('strong-globalize');
SG.SetRootDir(require('path').join(__dirname, '..'));

const ACL = require('./acl');

const sacl = (ds, options) => new ACL(ds, options);

sacl.ACL = sacl.Acl = ACL;
sacl.acl = sacl.createAcl = sacl.createACL = (ds, options) => new ACL(ds, options);

module.exports = sacl;
