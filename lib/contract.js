"use strict";

/**
 Design by Contract module (c) OptimalBits 2011.

 Roadmap:
 - Optional parameters. ['(string)', 'array']
 - Variable number of parameters.['number','...']

 api?:

 contract(arguments)
 .params('string', 'array', '...')
 .params('number')
 .end()

 */
"use strict";

const util = require('util');
const _ = require('lodash');

class NoopContract {
	params() {
		return this;
	}

	end() {
	}
}

const noop = new NoopContract();

class Contract {
	constructor(args) {
		this.fulfilled = false;
		this.args = _.toArray(args);
		this.checkedParams = [];
	}

	params() {
		this.fulfilled |= checkParams(this.args, _.toArray(arguments));
		if (this.fulfilled) {
			return noop;
		} else {
			this.checkedParams.push(arguments);
			return this;
		}
	}

	end() {
		if (!this.fulfilled) {
			printParamsError(this.args, this.checkedParams);
			throw new Error('Broke parameter contract');
		}
	}
}

const typeOf = function (obj) {
	return Array.isArray(obj) ? 'array' : typeof obj;
};

const checkParams = function (args, contract) {
	let fulfilled, types, type, i, j;

	if (args.length !== contract.length) {
		return false;
	} else {
		for (i = 0; i < args.length; i++) {
			try {
				types = contract[i].split('|');
			} catch (e) {
				console.log(e, args)
			}

			type = typeOf(args[i]);
			fulfilled = false;
			for (j = 0; j < types.length; j++) {
				if (type === types[j]) {
					fulfilled = true;
					break;
				}
			}
			if (fulfilled === false) {
				return false;
			}
		}
		return true;
	}
};

const printParamsError = function (args, checkedParams) {
	let msg = 'Parameter mismatch.\nInput:\n( ',
		type,
		i;
	_.forEach(args, function (input, key) {
		type = typeOf(input);
		if (key != 0) {
			msg += ', '
		}
		msg += input + ': ' + type;
	});

	msg += ')\nAccepted:\n';

	for (i = 0; i < checkedParams.length; i++) {
		msg += '(' + argsToString(checkedParams[i]) + ')\n';
	}

	console.log(msg);
};

const argsToString = function (args) {
	let res = "";
	_.forEach(args, function (arg, key) {
		if (key != 0) {
			res += ', ';
		}
		res += arg;
	});
	return res;
};

exports = module.exports = function (args) {
	if (exports.debug) {
		return new Contract(args);
	}
	return noop;
};



