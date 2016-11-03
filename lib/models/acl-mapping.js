"use strict";

const utils = require('../utils');

module.exports = function (Mapping) {
	Mapping.validatesUniquenessOf('userId', {scopedTo: ['roleId']});

};
