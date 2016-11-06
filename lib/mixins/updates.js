"use strict";

const debug = require('debug')('sacl:mixin:updates');

function updates(Model, bootOptions = {}) {
	debug('Updates mixin for Model %s', Model.modelName);

	const options = Object.assign({
		updates: 'updates'
	}, bootOptions);

	debug('options', options);

	Model.defineProperty(options.updates, {
		type: Number,
		required: options.required,
		default: 0,
	});

	Model.observe('before save', (ctx, next) => {
		debug('ctx.options', ctx.options);
		if (ctx.options && ctx.options.skipUpdates) { return next(); }
		if (ctx.instance) {
			debug('%s.%s before save: %s', ctx.Model.modelName, options.updates, ctx.instance.id);
			ctx.instance[options.updates] = (ctx.instance[options.updates] || 0) + 1;
		} else {
			debug('%s.%s before update matching %j', ctx.Model.pluralModelName, options.updates, ctx.where);
			ctx.data[options.updates] = (ctx.data[options.updates] || 0) + 1;
		}
		return next();
	});
}

module.exports = updates;
