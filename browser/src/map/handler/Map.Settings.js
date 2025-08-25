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

		const cssVar = getComputedStyle(document.documentElement).getPropertyValue(
			'--co-primary-element',
		);

		const params = [
			{ mobile: window.mode.isMobile() },
			{ cssvar: cssVar },
			{ doc_type: this._map.getDocType() },
			{ access_token: window.accessToken },
			{ access_token_ttl: window.accessTokenTTL },
			{ wopi_setting_base_url: window.wopiSettingBaseUrl },
		];

		const options = {
			prefix: 'iframe-settings',
			stylesheets: ['../settings.css'],
			modalButtons: [
				{
					id: 'iframe-settings-cancel',
					text: 'Cancel',
					align: 'right',
				},
				{
					id: 'iframe-settings-save',
					text: 'Save',
					align: 'right',
				},
			],
			dialogCssClass:
				'jsdialog-container ui-dialog lokdialog_container ui-widget-content',
		};

		this._iframeDialog = L.iframeDialog(this._url, params, null, options);

		const cancelButton = document.getElementById('iframe-settings-cancel');
		const saveButton = document.getElementById('iframe-settings-save');

		L.DomEvent.on(
			cancelButton,
			'click',
			function () {
				// TODO: discard all the changes made in the settings
				this.removeIframe();
			},
			this,
		);

		L.DomEvent.on(
			saveButton,
			'click',
			function () {
				// TODO: handle save button
			},
			this,
		);
	},

	onMessage: function (e) {
		if (typeof e.data !== 'string') return; // Some extensions may inject scripts resulting in load events that are not strings
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
