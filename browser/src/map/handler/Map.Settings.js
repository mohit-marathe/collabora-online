/* -*- js-indent-level: 8 -*- */
/*
 * Copyright the Collabora Online contributors.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*
 * L.Map.Settings.
 */

/* global app _ */

L.Map.mergeOptions({
	settings: true,
});

L.Map.Settings = L.Handler.extend({
	_getLocalSettingsUrl: function () {
		var settingsLocation = app.LOUtil.getURL(
			'/admin/adminIntegratorSettings.html',
		);
		if (window.socketProxy)
			settingsLocation = window.makeWsUrl(settingsLocation);
		return settingsLocation;
	},

	initialize: function (map) {
		L.Handler.prototype.initialize.call(this, map);

		this._url = this._getLocalSettingsUrl();
	},

	addHooks: function () {
		if (this._map.wopi)
			this._map.on('updateviewslist', this.onUpdateList, this);

		L.DomEvent.on(window, 'message', this.onMessage, this);
	},

	removeHooks: function () {
		L.DomEvent.off(window, 'message', this.onMessage, this);
	},

	removeIframe: function () {
		if (this._iframeDialog) this._iframeDialog.remove();
	},

	showSettingsDialog: function () {
		if (this._iframeDialog && this._iframeDialog.hasLoaded())
			this.removeIframe();

		var cssVar = getComputedStyle(document.documentElement).getPropertyValue(
			'--co-primary-element',
		);
		var params = [
			{ mobile: window.mode.isMobile() },
			{ cssvar: cssVar },
			{ doc_type: this._map.getDocType() },
		];

		this._iframeDialog = L.iframeDialog(this._url, params, null, {
			prefix: 'iframe-settings',
		});
	},

	onMessage: function (e) {
		if (typeof e.data !== 'string') return; // Some extensions may inject scripts resulting in load events that are not strings

		if (e.data.startsWith('updatecheck-show')) return;

		let data = e.data;
		data = JSON.parse(data);

		if (data.MessageId == 'settings-show') {
			this._iframeDialog.show();
		} else if (data.MessageId == 'settings-cancel') {
			this.removeIframe();
		} else if (data.MessageId == 'settings-ready') {
			this._iframeDialog.postMessage(data);
		}
	},
});

if (window.prefs.canPersist) {
	L.Map.addInitHook('addHandler', 'settings', L.Map.Settings);
}
