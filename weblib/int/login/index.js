kerio.login = {
	/**
	 * Strings ACCEPT_LANGUAGES, SUPPORTED_LANGUAGES has to be replaced by
	 * valid values in PHP (JSP)
	 */
	_k_buildHash: '?v=545c0e91ce9a37a41eb97a1641855615',

	/**
	 * Loads js and/or css files
	 * Note: Js files can be loaded only before whole page is loaded.
	 *
	 * @param k_config [Object] list of js and/or to load
	 * @example
	 * <code>
	 *    var k_config = {
	 *      k_js: [
	 *          'file1.js',
	 *          'file2.js'
	 *    	],
	 *      k_css: [
	 *          'file1.css',
	 *          'file2.css'
	 *      ]
	 *    };
	 * </code>
	 *
	 * @return [void]
	 */
	k_load: function(k_config) {
		var k_i;

		for (k_i=0; k_i < k_config.k_css.length; k_i++) {
			this.k_loadCss(k_config.k_css[k_i]);
		}

		for (k_i=0; k_i < k_config.k_js.length; k_i++) {
			this.k_loadJs(k_config.k_js[k_i]);
		}
	},

	/**
	 * Loads Js file
	 * Note: this method could be used only during loading of page
	 *
	 * @param k_path [String] path to file to load
	 * @return [void]
	 */
	k_loadJs: function(k_path) {
		document.write('<script type="text/javascript" src="' + this._k_addBuildHash(k_path) + '"></'+'script>');
	},

	/**
	 * Creates link tag used for fav icon or for css.
	 * @private
	 *
	 * @param k_config [Object] attributes of link tag
	 * @return [void]
	 */
	_k_createLinkTag: function (k_config) {
		document.write('<link href="' + this._k_addBuildHash(k_config.href) + '" rel="' + k_config.rel + '" type="' + k_config.type + '">');
	},

	/**
	 * Loads css file
	 *
	 * @param k_path [String] path to file to load
	 * @return [void]
	 */
	k_loadCss: function(k_path) {
		var k_linkCfg;

		k_linkCfg = {
			type: 'text/css',
			rel: 'stylesheet',
			href: k_path,
			media: 'screen'
		};

		this._k_createLinkTag(k_linkCfg);
	},

	/**
	 * Creates link tag for fav icon
	 * @private
	 *
	 * @param k_path [String] path to fav icon
	 * @return [void]
	 */
	_k_initFavIcon: function(k_path) {
		var k_linkCfg;

		k_linkCfg = {
			type: 'image/vnd.microsoft.icon',
			rel: 'shortcut icon',
			href: k_path
		};

		this._k_createLinkTag(k_linkCfg);
	},

	/**
	 * Creates meta tags for "Home screen" icon on iOS.
	 * Note: The icon for home screen should be 72x72 (png)
	 * - see http://developer.apple.com/library/ios/#documentation/userexperience/conceptual/mobilehig/IconsImages/IconsImages.html .
	 * @private
	 *
	 * @param k_path {String} path to the icon
	 */
	_k_initHomeScreenIcon: function(k_path) {
		document.write('<meta name="apple-mobile-web-app-capable" content="yes">');
		document.write('<link rel="apple-touch-icon" href="' + this._k_addBuildHash(k_path) + '">');
	},

	/**
	 * Initialize login page.
	 * Loads required files and attachs window.onload event handler
	 *
	 * @param [void]
	 * @return [void]
	 */
	k_init: function () {
		var
			k_weblibRoot = k_defaults.k_weblibRoot || '/weblib',
			k_favIconUrl = k_defaults.k_favIconUrl || '../img/favicon.ico?v=545c0e91ce9a37a41eb97a1641855615',
			k_iOsAppIcon = k_defaults.k_iOsAppIcon || '../img/appleTouchIcon.png?v=545c0e91ce9a37a41eb97a1641855615',
			k_filesToLoad;

		// loginPage GUI has to be generated before load event, see script at the end of body,
		// but defaults can be applied and login dialog can be displayed after whole page (css, js) is loaded.
		try {  //Windows Mobile 2003
			window.onload = function () {
				kerio.login.k_loginDialog.k_init();
			};
		}
		catch (e) {}

		if ('iPad' === navigator.platform) {
			this._k_initHomeScreenIcon(k_iOsAppIcon);
		}

		this._k_initFavIcon(k_favIconUrl);

		k_filesToLoad = {
			k_js: [
				k_weblibRoot + '/int/lib/login.js',
				k_weblibRoot + '/int/login/script.js'
			].concat(k_defaults.k_scripts || []),
			k_css: [
				k_weblibRoot + '/int/login/style.css'
			].concat(k_defaults.k_css)
		};

		this._k_weblibRoot = k_weblibRoot;

		this.k_load(k_filesToLoad);
	},

	/**
	 * Adds the build hash to the URL if it douesn't present yet.
	 *
	 * @param  {String} k_url.
	 * @return {String} The URL with the build hash.
	 */
	_k_addBuildHash: function(k_url) {

		if (-1 === k_url.indexOf(this._k_buildHash)) {
			k_url += this._k_buildHash;
		}

		return k_url;
	},

	/**
	 * Calculates language from application supported langs and browser preffered langs
	 * and load translation file.
	 *
	 * Note: This method has to be called from separated script tag
	 *
	 * @param k_langConfig [Object] Product language configuration
	 * @return [void]
	 */
	k_initTranslations: function (k_langConfig) {
		var
			k_language,
			k_pathToTranslations = k_defaults.k_pathToTranslations || '../translations';

		kerio.lib.k_setSupportedLanguages(k_langConfig._k_supportedLanguages);
		k_language = kerio.lib.k_getCalculatedLanguage(k_langConfig._k_acceptedLanguages);
		this.k_loadJs(k_pathToTranslations + '/' + k_language + '_login.js');
	},


	/**
	 * Get parameters from  URL location.search
	 * @return [Object] parsed params
	 */
	k_getUrlParams: function() {
		var
			k_output = {},
			k_params,
			k_i,
			k_splittedItem,
			k_searchString;

		k_searchString = location.search.replace('?', '');
		if (!k_searchString) {
			return k_output;
		}

		k_params = k_searchString.split('&');

		for (k_i = 0; k_i < k_params.length; k_i++) {
			k_splittedItem = k_params[k_i].split('=');
			k_output[k_splittedItem[0]] = k_splittedItem[1];
		}

		return k_output;
	}
};

kerio.login.k_init();