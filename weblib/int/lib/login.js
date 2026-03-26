/*!
 * @file   translator.js
 * @brief  obtain translated text
 *
 * @responsible Pavel Benes
 * @author Zdenek Benes <zbenes@kerio.com>, Pavel Benes, Dusan Juhas
 * @version \$Id$
 * @copyright Copyright &copy; 1997-2008 Kerio Technologies
 */

// create kerio.lib name space if it is not created yet
if (!window.kerio) {
	kerio = {lib: {k_reportError: window.alert}};
}

/**
 * @class kerio.lib
 * Set supported languages (called by the application)
 *
 * @param {Array} k_languageArray array of supported language
 */
kerio.lib.k_setSupportedLanguages = function(k_languageArray) {
	if (!kerio.lib._k_settings) {
		kerio.lib._k_settings = {};
	}
	kerio.lib._k_settings._k_supportedLanguages = k_languageArray;
};

/**
 * Gets supported languages.
 *
 * @return {Array} array of supported language
 */
kerio.lib.k_getSupportedLanguages = function() {
	if (kerio.lib._k_settings) {
		return kerio.lib._k_settings._k_supportedLanguages;
	}
	else {
		return undefined;
	}
};

/**
 * Returns the language according to language settings in web browser and app supported languages.
 *
 * @param {Array} k_browserPreferred browser languages, expected format: ['en','de','cs']
 *                There is allowed 5 character string for English: en-us/en-gb/.... "en-gb" is used to distinguish
 *                between British and other English languages (it is ignored here).
 * @return {String} The language identificator
 */
kerio.lib.k_getCalculatedLanguage = function(k_browserPreferred) {
	var
		k_supportedLanguages = kerio.lib.k_getSupportedLanguages().join(','),
		k_browserLang,
		k_i, k_cnt;

	//match languages
	for (k_i = 0, k_cnt = k_browserPreferred.length; k_i < k_cnt; k_i++) {
		k_browserLang = k_browserPreferred[k_i].substring(0,2);

		if (-1 !== k_supportedLanguages.indexOf(k_browserLang)) {
			return k_browserPreferred[k_i];
		}
	}
	return 'en'; //no match, return english identificator
};

/**
 * Returns grammar category for currently used language.
 *
 * @param {Integer} k_amount quantifier
 * @return {String} The language identificator;  posibilities are: 'singular', 'dual', 'plural'
 */
kerio.lib.k_getGrammarCategory = function(k_amount) {
	var
		k_singularText = 'singular',
		k_dualText = 'dual',
		k_pluralText = 'plural',
		k_amountMod10,
		k_amountMod100,
		k_language;

	// language abbreviation (eg. 'cs') from engine constants is used if is missing in translation file
	k_language = kerio.lib.k_translation.k_currentLanguage || kerio.lib.k_engineConstants.k_CURRENT_LANGUAGE;

	switch (k_language) {
		case 'cs':
		case 'sk':
			if (1 === k_amount) {
				return k_singularText;
			}
			if ((k_amount > 1) && (k_amount < 5)) {
				// according new Czech grammar rules "101 uzivatelu" not "101 uzivatel"
				return k_dualText;
			}
			break;
		case 'fr':
			if (k_amount < 2) {
				// 0 means singular!
				return k_singularText;
			}
			break;
		case 'ru':
			k_amountMod10  = k_amount % 10;
			k_amountMod100 = k_amount % 100;
			if ((1 === k_amountMod10) && (11 !== k_amountMod100)) {
				return k_singularText;
			}
			if ((k_amountMod10 > 1) && (k_amountMod10 < 5) && ((k_amountMod100 < 10) || (k_amountMod100 > 20))) {
				return k_dualText;
			}
			break;
		case 'pl':
			if (1 === k_amount) {
				return k_singularText;
			}
			k_amountMod10  = k_amount % 10;
			k_amountMod100 = k_amount % 100;
			if ((k_amountMod10 > 1) && (k_amountMod10 < 5) && ((k_amountMod100 < 10) || (k_amountMod100 > 20))) {
				return k_dualText;
			}
			break;
		case 'hr':
			k_amountMod10  = k_amount % 10;
			k_amountMod100 = k_amount % 100;
			if ((1 === k_amountMod10) && (11 !== k_amountMod100)) {
				return k_singularText;
			}
			if ((k_amountMod10 > 1) && (k_amountMod10 < 5) && ((k_amountMod100 < 12) || (k_amountMod100 > 14))) {
				return k_dualText;
			}
			break;
		default:
			// in other language we suppose same rules as in English
			if (1 === k_amount) {
				// 0 means plural!
				return k_singularText;
			}
	}
	return k_pluralText;
};

/**
 * Converts an english string into the current language or find proper variant (singular/plural) for an english string containing
 * [SINGULAR|PLURAL], e.g. "There [is|are] %1 user[|s]". It expects the en.js file exists (but it can contain only string with plurality).
 *
 * @param {String} k_enString english string
 * @param {String} k_context translation context, e.g. name of dialog (k_sourceName or k_objectName)
 * @param {Object} k_options (optional, default: undefined) config options for translation
 * <div class="mdetail-params">
 * <strong>Properties:</strong>
 * <ul>
 * <li> {Boolean} k_isSecure (optional, default: false) If false, translation will be HTML escaped to avoid XSS.</li>
 * <li> {Number} k_pluralityBy (optional, default: plurality is not defined) Quantifier used to get grammar category (singular, dual, plural).</li>
 * <li> {Array} k_args (optinal, default: undefined) If placeholders are defined in string, k_args contains their values.
 *                     Placeholder is defined by '%' sign and number (e.g. %1). Placeholders are counted from one.</li>
 * </ul></div>
 *
 * @return {String} translated string
 */
kerio.lib.k_tr = function(k_enString, k_context, k_options) {

	if ('' === k_enString) {
		return k_enString;
	}

	var
		k_translation = k_enString,
		k_defaultContext = 'common',
		k_pluralityDefined = false,
		k_pluralityRequired,
		k_placeholdersRequired,
		k_placeholdersDefined,
		k_args, k_i, k_cnt;

	if (undefined === k_options) {
		k_options = {};
	}

	if (undefined !== k_options.k_pluralityBy) {
		k_pluralityDefined = true;
	}

	// TODO: There can be checked if the translation exists and report errors
	if (undefined === k_context) {
		k_context = k_defaultContext;
	}

	if (kerio.lib.k_translation) {
		// get localized string from existing translations or make an object with fake translations
		if (kerio.lib.k_translation[k_context]) {
			k_translation = kerio.lib.k_translation[k_context][k_enString];

			if (undefined === k_translation && k_defaultContext !== k_context && kerio.lib.k_translation[k_defaultContext]) {
				// Translation was not found in given context. Try to find it in the default context.
				k_translation = kerio.lib.k_translation[k_defaultContext][k_enString];
			}

			if (undefined === k_translation) {
				k_translation = kerio.lib._k_createEngPluralText(k_enString);
			}
		}
		// make an object with fake translatons for non-existing context
		else {
			k_translation = kerio.lib._k_createEngPluralText(k_enString);
		}
	}

	k_pluralityRequired = false;
	if ('object' === typeof k_translation) {
			k_pluralityRequired = true;
	}

	if (k_pluralityRequired && !k_pluralityDefined) {
			kerio.lib.k_reportError('Internal error: Translator error' + '\n' + 'enMessage: ' + k_enString + '\n' + 'Context: '
				+ k_context + '\n' + '\n' + 'No plurality parameters defined but required!', 'translator.js');
			return k_translation.k_singular;
	}

	if (k_pluralityRequired && k_pluralityDefined) {

		//choose right sentence
		switch (kerio.lib.k_getGrammarCategory(k_options.k_pluralityBy)) {
			case 'singular':
				if (undefined !== k_translation.k_singular) {
					k_translation = k_translation.k_singular;
				}
				else {
					kerio.lib.k_reportError('Internal error: Translator error' + '\n' + 'enMessage: ' + k_enString + '\n' + 'Context: ' + k_context + '\n' + '\n' + 'Singular not defined!', 'translator.js');
				}
				break;

			case 'dual':
				if (undefined !== k_translation.k_dual) {
					k_translation = k_translation.k_dual;
				}
				else {
					kerio.lib.k_reportError('Internal error: Translator error' + '\n' + 'enMessage: ' + k_enString + '\n' + 'Context: ' + k_context + '\n' + '\n' + 'Dual/Paucal not defined!', 'translator.js');
				}
				break;

			default:
				if (undefined !== k_translation.k_plural) {
					k_translation = k_translation.k_plural;
				}
				else {
					kerio.lib.k_reportError('Internal error: Translator error' + '\n' + 'enMessage: ' + k_enString + '\n' + 'Context: ' + k_context + '\n' + '\n' + 'Plural not defined!', 'translator.js');
				}
		}
	}

	k_placeholdersRequired = false;
	if (-1 !== k_translation.toString().indexOf('%')) {
		k_placeholdersRequired = true;
	}

	k_placeholdersDefined = false;
	if (undefined !== k_options.k_args) {
		k_placeholdersDefined = true;
	}

	if (k_placeholdersRequired && !k_placeholdersDefined) {
		kerio.lib.k_reportError('Internal error: Translator error' + '\n' + 'enMessage: ' + k_enString + '\n' + 'Context: ' + k_context + '\n' + '\n' + 'No placeholder parameters defined but required!', 'translator.js');
		return k_translation;
	}

	if ( k_placeholdersRequired && k_placeholdersDefined) {

		k_args = k_options.k_args;
		k_cnt = k_args.length;

		// At first we have to repace all occurences of %x by something more unique
		// because there is possible colision with placeholder value (e.g. encoded URI)
		// see bug 69206 comment 10.
		for (k_i = 0; k_i < k_cnt; k_i++) {
			k_translation = k_translation.replace(('%' + (k_i + 1)), '{%' + (k_i + 1) + '%}');
		}

		for (k_i = 0; k_i < k_cnt; k_i++) {
			k_translation = k_translation.replace(('{%' + (k_i + 1) + '%}'), true === k_options.k_isSecure ? k_args[k_i] : kerio.lib.k_htmlEncode(k_args[k_i]));
		}
	}

	return k_translation;
}; // end of kerio.lib.k_tr

/**
 * Converts a string into proper variant (singular/plural)
 * for text containing [SINGULAR|PLURAL], e.g. "There [is|are] %1 user[|s]"
 * or return text itself
 *
 * Analysis of regular expresion to be used:
 * [^\[]*(\[([^\[\|\]]{1,})\|([^\]\|\[]{1,})\]).*
 *  - [^\[]*            Any characters any length which don't contained '['
 *  - (                 Catch whole [SINGULAR|PLURAL] string
 *  - \[                '['
 *  - ([^\[\|\]]{1,})   SINGULAR - Chatch any string with more than one character and without '[','|' and ']'
 *  - \|                '|'
 *  - ([^\]\|\[]{1,})   PLURAL - Chatch any string with more than one character and without '[','|' and ']'
 *  - \]                ']'
 *  - )                 End catching whole [SINGULAR|PLURAL] string
 *  - .*                String can contained anything after plural string
 *
 * @param {String} k_text Text to be converted
 * @return {String|Object} string or object with strings k_singular, k_dual, k_plural
 */
kerio.lib._k_createEngPluralText = function(k_text) {
	var
		k_isCompoundMessageRegex = new RegExp('[^\\[]*(\\[([^\\[\\|\\]]{1,})\\|([^\\]\\|\\[]{1,})\\]).*'),
		k_compoundText;

	//if the text is not with plurality, return text itself
	if (!k_isCompoundMessageRegex.test(k_text)) {
		return k_text;
	}

	k_compoundText = {
		k_singular: k_text,
		k_plural: k_text
	};

	kerio.lib._k_compileCompoundText(k_compoundText, k_isCompoundMessageRegex);

	return {
		k_singular: k_compoundText.k_singular,
		k_dual: k_compoundText.k_plural,
		k_plural: k_compoundText.k_plural
	};
};

/**
 * Recursive function to compile [SINGULAR|PLURAL] text to only singular and only plural form
 *
 * @param {Object} k_text Text with k_sigular and k_plural text to be compiled
 * @param {Regex} k_regex Regular expresion to be used in compiling
 */
kerio.lib._k_compileCompoundText = function(k_text, k_regex) {
	var
		k_parsedSingular,
		k_parsedPlural;

	if (!k_regex.test(k_text.k_singular) || !k_regex.test(k_text.k_plural)) {
		return;
	}

	k_parsedSingular = k_regex.exec(k_text.k_singular);
	k_parsedPlural = k_regex.exec(k_text.k_plural);

	k_text.k_singular = k_parsedSingular[0].replace(k_parsedSingular[1],k_parsedSingular[2]);
	k_text.k_plural = k_parsedPlural[0].replace(k_parsedPlural[1],k_parsedPlural[3]);

	kerio.lib._k_compileCompoundText(k_text, k_regex);
};
/*!
 * @file   browser.js
 * @brief  Collects information about currently used browser
 *
 * @responsible Pavel Benes
 * @author Pavel Benes
 * @version \$Id$
 * @copyright Copyright &copy; 1997-2008 Kerio Technologies
 */

kerio = window.kerio || {};
kerio.lib = kerio.lib || {};

/**
 * @class kerio.lib.k_browserInfo
 * Information about currently used browser.
 *
 * Note: this file can be loaded more times inside one application.
 * It is merged at least into both kLib.js and webAssist.js - kLib.js cannot know, if the webAssist is loaded,
 * and webAssist.js is used by other products which are not based on kLib. But the object has to be initialized only once.
 * Therefore it has to be checked if kerio.lib.k_browserInfo is not already defined (bug 86211).
 *
 * @singleton
 */
kerio.lib.k_browserInfo = kerio.lib.k_browserInfo || {
	/**
	 * List of browsers and their versions supported by WebLibs.
	 * It has to be updated when a new browser appears and is fully supported by WebLibs
	 */
	k_supportedBrowsers: {
		MSIE: {
			k_min: 9,
			k_max: 11,
			k_name: 'Internet Explorer'
		},
		MS_Edge: {
			k_min: 20,
//			k_max: 20,  // All future versions of Edge are supported (WEBLIB-3890)
			k_name: 'Microsoft Edge'
		},
		Firefox: {
			k_min: 23,
			//k_max: 5, // All future versions of Firefox are supported (bug 61335)
			k_name: 'Firefox'
		},
		Safari: {
			k_min: 5,
//			k_max: 9,   // All future versions of Safari are supported (WEBLIB-3910)
			k_name: 'Safari'
		},
		Chrome: {
			k_min: 31,
			//k_max: 8, // All future versions of Google Chrome are supported (bug 56199)
			k_name: 'Google Chrome'
		}
	},

	/**
	 * List of browsers and their versions blocked by WebLibs. It means that login from this browser is not allowed.
	 */
	k_blockedBrowsers: {
		MSIE: {
			k_min: 0,
			k_max: 6
		},
		Firefox: {
			k_min: 0,
			k_max: 2
		}
	},

	/**
	 * Privat variable to keep the current browser info. Intitialized and accessed by {@link #_k_getBrowserInfo}.
	 */
	_k_currentBrowser: null,

	/**
	 * Checks if the current browser is supported according to given argument.
	 *
	 * @param {Object/false} k_requiredBrowsers Object in following format:
	 * <code><pre>
	 {
		BROWSER_NAME: {k_min: MINIMAL_SUPPORTED_VERSION, k_max: MAXIMAL_SUPPORTED_VERSION},
		BROWSER_NAME ...
	 }
	 // e.g.
	 {
		MSIE: {k_min: 7, k_max: 8},
		Firefox: {k_min: 2, k_max: 3.6},
		Safari: {k_min: 3, k_max: 4}
	 }
	 * </pre><code>
	 * @param {String} k_type (optional, default: test if browser version in greater or equal than min supported and lesser or equal than max required).
	 *					@enum[
	 *						'k_min' : check minimal supported version
	 *						'k_max' : check maximal supported version
	 *					@enum]
	 * @return {Boolean} True for supported browser.
	 */
	k_isSupported: function(k_requiredBrowsers, k_type) {

		k_requiredBrowsers = this.k_mergeBrowsersVersions(k_requiredBrowsers, this.k_supportedBrowsers);

		if ('k_min' === k_type) {
			return this._k_isSupportedMin(k_requiredBrowsers);
		}

		if ('k_max' === k_type) {
			return this._k_isSupportedMax(k_requiredBrowsers);
		}

		return this._k_isSupportedMin(k_requiredBrowsers) && this._k_isSupportedMax(k_requiredBrowsers);
	},

	/**
	 * Determine if the browser vesion is equal or greater than the minimal supported version.
	 *
	 * @param {Object/false} k_requiredBrowsers Object in following format:
	 * <code><pre>
	 {
		BROWSER_NAME: {k_min: MINIMAL_SUPPORTED_VERSION, k_max: MAXIMAL_SUPPORTED_VERSION},
		BROWSER_NAME ...
	 }
	 // e.g.
	 {
		MSIE: {k_min: 7, k_max: 8},
		Firefox: {k_min: 2, k_max: 3.6},
		Safari: {k_min: 3, k_max: 4}
	 }
	 * </pre><code>
	 * @return {Boolean} True for supported browser.
	 */
	_k_isSupportedMin: function (k_requiredBrowsers) {
		var
			k_browserInfo = this._k_getBrowserInfo(),
			k_requiredVersion = k_requiredBrowsers[k_browserInfo.k_name];

		if (k_requiredVersion) {
			k_requiredVersion = k_requiredVersion.k_min;

			return k_browserInfo.k_version >= k_requiredVersion;
		}

		return false;
	},

	/**
	 * Determine if browser version is equal or lesser than maximal supported version
	 *
	 * @param {Object/false} k_requiredBrowsers Object in following format:
	 * <code><pre>
	 {
		BROWSER_NAME: {k_min: MINIMAL_SUPPORTED_VERSION, k_max: MAXIMAL_SUPPORTED_VERSION},
		BROWSER_NAME ...
	 }
	 // e.g.
	 {
		MSIE: {k_min: 7, k_max: 8},
		Firefox: {k_min: 2, k_max: 3.6},
		Safari: {k_min: 3, k_max: 4}
	 }
	 * </pre><code>
	 * @return {Boolean} True for supported browser.
	 */
	_k_isSupportedMax: function (k_requiredBrowsers) {
		var
			k_browserInfo = this._k_getBrowserInfo(),
			k_requiredVersion;

		if ('Chrome' === k_browserInfo.k_name || 'Firefox' === k_browserInfo.k_name || 'MS_Edge' === k_browserInfo.k_name || 'Safari' === k_browserInfo.k_name || k_browserInfo.k_isIPad || this.k_isSupportedAndroid()) {
			return true;
		}

		k_requiredVersion = k_requiredBrowsers[k_browserInfo.k_name];

		if (k_requiredVersion) {
			k_requiredVersion = k_requiredVersion.k_max;

			return k_browserInfo.k_version <= k_requiredVersion;
		}

		return false;
	},

	/**
	 * Checks whether android with supported screen resolution is used
	 *
	 * @param {void}
	 * @return {Boolean} True for android with supported screen resolution is used, false - either not and Android or too small resolution
	 */
	k_isSupportedAndroid: function() {
		var
			k_ANDROID_MINIMAL_SIZE = 600,
			k_browserInfo = this._k_getBrowserInfo();

		return k_browserInfo.k_isAndroidTablet && k_ANDROID_MINIMAL_SIZE <= k_browserInfo.k_androidProperties.k_smallerSize;
	},

	/**
	 * Checks if the current browser is blocked. If browser isn't determinated, it is not blocked
	 *
	 * @param {Object/false} k_blockedBrowsers Object in following format:
	 * <code><pre>
	 {
		BROWSER_NAME: {k_min: MINIMAL_SUPPORTED_VERSION, k_max: MAXIMAL_SUPPORTED_VERSION},
		BROWSER_NAME ...
	 }
	 // e.g.
	 {
		MSIE: {k_min: 7, k_max: 8},
		Firefox: {k_min: 2, k_max: 3.6},
		Safari: {k_min: 3, k_max: 4}
	 }
	 * </pre><code>
	 * @return {Boolean} True for blocked browser.
	 */
	k_isBlocked: function(k_blockedBrowsers) {
		//k_blockedBrowsers = this.k_mergeSupportedBrowsers(k_blockedBrowsers);
		var
			k_browserInfo = this._k_getBrowserInfo(),
			k_requiredVersion;

		k_blockedBrowsers = this.k_mergeBrowsersVersions(k_blockedBrowsers, this.k_blockedBrowsers);
		k_requiredVersion = k_blockedBrowsers[k_browserInfo.k_name];

		if (!k_requiredVersion) {
			return false; // if browser is not in list then it is not blocked
		}

		return k_browserInfo.k_version >= k_requiredVersion.k_min && k_browserInfo.k_version <= k_requiredVersion.k_max;
	},

	/**
	 * Provides name and version of the browser.
	 *
	 * @return {Object} browser name and version
	 */
	_k_getBrowserInfo: function () {

		if (this._k_currentBrowser) {
			return this._k_currentBrowser;
		}

		var
			k_BROWSER_CHROME = 'Chrome',
			k_navigator = navigator.userAgent.toLowerCase(),
			k_firefoxPattern = new RegExp('firefox[/\\s](\\d+)\\.(\\d+)'),
			k_safariPattern = new RegExp('safari/(\\d+)'),
			k_chromePattern = new RegExp('(?:chrome|crios)/(\\d+)'),
			k_msiePattern = new RegExp('msie (\\d+)\\.(\\d+)'),
			k_msieGeckoPattern = new RegExp('trident/.*like gecko'),  // MSIE 11
			k_operaWebkit = new RegExp('webkit.*\\Wopr/(\\d+)\\.(\\d+)'),
			k_msEdgePattern = new RegExp('edge/(\\d+)'),
			k_isAndroid = -1 !== k_navigator.indexOf('android'),
			k_browser = '',
			k_browserMajorVersion,
			k_browserMinorVersion,
			k_osVersion,
			k_size;

		if (window.opera || k_operaWebkit.test(k_navigator)) {
			k_browser = 'Opera';
		}
		else if (k_firefoxPattern.test(k_navigator)) {
			k_browser = 'Firefox';
		}
		else if (k_msEdgePattern.test(k_navigator)) {
			k_browser = 'MS_Edge';
		}
		else if (k_chromePattern.test(k_navigator)) {
			k_browser = k_BROWSER_CHROME;
		}
		else if (k_safariPattern.test(k_navigator)) {
			k_browser = 'Safari';
		}
		else if (k_msiePattern.test(k_navigator) || k_msieGeckoPattern.test(k_navigator)) {
			k_browser = 'MSIE';
		}
		else {
			k_browser = 'OTHER';
		}

		k_browserMajorVersion = Number(RegExp.$1);
		k_browserMinorVersion = Number(RegExp.$2);

		if ('MSIE' === k_browser) {
			// navigator.userAgent for Browser Mode: IE8 Compatibility View and Document Mode: IE8 Standards contains MSIE 7.0 instead of MSIE 8.0 therefore
			// we cannot use userAgent string to detect IE8. But there is a new property in IE8 'documentMode' which contains right document mode.
			// userAgent in IE8 Compatibility View:  Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0)
			// for more info about document modes in IE8 see http://msdn.microsoft.com/en-us/library/cc288325(VS.85).aspx
			if (document.documentMode) {
				k_browserMajorVersion = document.documentMode;
			}

			if (6 === k_browserMajorVersion) {
				// navigator.userAgent is buggy in MSIE: http://jamazon.co.uk/web/2008/07/23/an-ie7-bug-that-returns-msie-60-user-agent-string/
				//
				// Checking window.XMLHttpRequest is not 100% reliable - native XMLHttpRequest object can be disabled in:
				//   Interner option -> Advanced -> Security -> Enable native XMLHTTP support
				//
				// The best solution is probably: http://www.javascriptkit.com/javatutors/objdetect3.shtml

				if (document.documentElement && 'undefined' !== typeof document.documentElement.style.maxHeight) {
					k_browserMajorVersion = 7;
				}
			}
		}
		else if ('Safari' === k_browser) {

			// WebKit build number is used first
			k_browserMinorVersion = 0;

			if (k_browserMajorVersion > 419) {
				k_browserMajorVersion = 3;

				// Safari since 3.0 provides standard version info in navigator.userAgent string
				if (new RegExp('version/(\\d+)\\.(\\d+)').test(k_navigator)) {
					k_browserMajorVersion = Number(RegExp.$1);
					k_browserMinorVersion = Number(RegExp.$2);
				}
			}
			else if (k_browserMajorVersion > 412) {
				k_browserMajorVersion = 2;
			}
			else {
				k_browserMajorVersion = 1;
			}
		}
		else if ('Opera' === k_browser && window.opera) {
			k_browserMajorVersion = 0;
			k_browserMinorVersion = 0;

			if (window.opera.version) {
				k_browserMajorVersion = window.opera.version();

				if (new RegExp('(\\d+)\\.(\\d+)').test(k_browserMajorVersion)) {
					k_browserMajorVersion = Number(RegExp.$1);
					k_browserMinorVersion = Number(RegExp.$2);
				}
			}
		}
		else if ('MS_Edge' === k_browser) {
			// There is difference between version in the user-agent (EdgeHTML) string and the version displayed for user in the About (Edge)
			// Mark all EdgeHTML Version below 12 as unsuppurted and vice versa (WEBLIB-3890)
			// otherwise map the EdgeHTML version to Edge version according to the https://en.wikipedia.org/wiki/Microsoft_Edge
			if (k_browserMajorVersion < 12) {
				k_browserMajorVersion = 19;
			}
			else if (12 === k_browserMajorVersion) {
				k_browserMajorVersion = 20;
			}
			else if (13 === k_browserMajorVersion) {
				k_browserMajorVersion = 25;
			}
			else if (14 === k_browserMajorVersion) {
				k_browserMajorVersion = 31;
			}
			else {
				k_browserMajorVersion = 31; // last known version
			}
		}

		this._k_currentBrowser = {
			k_name: k_browser,
			k_version: Number(k_browserMajorVersion + '.' + k_browserMinorVersion) // create decimal number from major and minor versions
		};

		if (new RegExp('applewebkit/(\\d+)\\.(\\d+)').test(k_navigator)) {
			this._k_currentBrowser.k_webKitVersion = Number(RegExp.$1);
		}

		if (-1 !== navigator.platform.indexOf('iPad')) {
			// The browser name isn't checked here, because when the app is launched via the home screen icon instead from the browser,
			// the browser name doesn't contain "Safari", but "OTHER" ("applewebkit") and the real version number is not accessible.

			if (new RegExp('os (.*) like mac').test(k_navigator)) {
				k_osVersion = RegExp.$1.split('_');

				// iPad is supported since iOS version 5
				if (parseInt(k_osVersion[0], 10) >= 5) {
					this._k_currentBrowser.k_isIPad = true;

					if ('OTHER' === this._k_currentBrowser.k_name) {
						this._k_currentBrowser.k_name = 'Safari';
						this._k_currentBrowser.k_version = 'wk' + this._k_currentBrowser.k_webKitVersion;
					}
				}
			}
		}

		if (-1 !== navigator.platform.indexOf('iPhone')) {
			// The browser name isn't checked here, because when the app is launched via the home screen icon instead from the browser,
			// the browser name doesn't contain "Safari", but "OTHER" ("applewebkit") and the real version number is not accessible.

			this._k_currentBrowser.k_isIPhone = true;
			// The version is not checked, the iPhone is not officialy supported in any version (the flag is there only to display tablet version)

			if ('OTHER' === this._k_currentBrowser.k_name) {
				this._k_currentBrowser.k_name = 'Safari';
				this._k_currentBrowser.k_version = 'wk' + this._k_currentBrowser.k_webKitVersion;
			}
		}

		if (k_isAndroid) {
			// default browser on Android is identified as 'Safari', switch it to Chrome and its minimal supported version
			if ('Safari' === k_browser) {
				this._k_currentBrowser.k_name = k_BROWSER_CHROME;
				this._k_currentBrowser.k_version = this.k_supportedBrowsers.Chrome.k_min;
			}
			// smaller size of screen must be 600px at least
			k_size = Math.min(screen.width, screen.height);
			this._k_currentBrowser.k_isAndroidTablet = true;
			this._k_currentBrowser.k_androidProperties = {
				k_smallerSize: k_size
			};
		}

		return this._k_currentBrowser;
	},

	/**
	 * Merges browsers supported by WebLibs and supported by application and returns merged object.
	 *
	 * @param {Object} k_supportedBrowsers see (@link #k_isSupported} for details.
	 * @return {Object} Merge of supported browsers.
	 */
	k_mergeBrowsersVersions: function (k_browsers, k_weblibDefault) {
		var
			k_mergedBrowsers = {},
			k_weblibDefaultVersions,
			k_appRequiredVersions,
			k_browserName;

		if (undefined === k_browsers) {
			k_browsers = {};
		}

		// create deep copy of object
		for (k_browserName in k_weblibDefault) {
			k_weblibDefaultVersions = k_weblibDefault[k_browserName];
			k_appRequiredVersions = k_browsers[k_browserName];

			if (!k_appRequiredVersions) {
				k_mergedBrowsers[k_browserName] = k_weblibDefaultVersions;
			}
			else {
				k_mergedBrowsers[k_browserName] = {
					k_min: k_appRequiredVersions.k_min,
					k_max: k_appRequiredVersions.k_max,
					k_name: k_appRequiredVersions.k_name
				};

				if (undefined === k_appRequiredVersions.k_min) {
					k_mergedBrowsers[k_browserName].k_min = k_weblibDefaultVersions.k_min;
				}

				if (undefined === k_appRequiredVersions.k_max) {
					k_mergedBrowsers[k_browserName].k_max = k_weblibDefaultVersions.k_max;
				}

				if (undefined === k_appRequiredVersions.k_name) {
					k_mergedBrowsers[k_browserName].k_name = k_weblibDefaultVersions.k_name;
				}
			}
		}

		for (k_browserName in k_browsers) {
			if (undefined === k_mergedBrowsers[k_browserName]) {
				k_mergedBrowsers[k_browserName] = k_browsers[k_browserName];
			}
		}

		return k_mergedBrowsers;
	},

	/**
	 * Detects if browser is running on mobile device.
	 *
	 * @return {Boolean}
	 */
	k_isMobileDevice: function () {
		var k_mobileDeviceStrings;

		// list of known userAgent strings
		k_mobileDeviceStrings = [
			'avantgo',
			'blackberry',
			'bb10',
			'blazer',
			'compal',
			'elaine',
			'fennec',
			'hiptop',
			'iemobile',
			'ip(hone|od|ad)',
			'iris',
			'kindle',
			'lge ',
			'maemo',
			'midp',
			'mmp',
			'opera m(ob|in)i',
			'palm( os)?',
			'phone',
			'p(ixi|re)/',
			'plucker',
			'pocket',
			'psp',
			'symbian',
			'treo',
			'up.(browser|link)',
			'vodafone',
			'wap',
			'windows (ce|phone)',
			'xda',
			'xiino'
		];
		if (this.k_isSupportedAndroid()) {
			return false;
		}

		return new RegExp(k_mobileDeviceStrings.join('|'), 'i').test(navigator.userAgent);
	}
};  // end of kerio.lib.K_BrowserInfo

