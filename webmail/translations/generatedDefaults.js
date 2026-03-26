window.kerio = window.kerio || {};
kerio.lib = kerio.lib || {};
kerio.engine = 
{
	settings: {
		webmail: {
		}
	},
	constants: {
		ACCEPT_LANGUAGES: ['en'],
		SUPPORTED_LANGUAGES: ['cs', 'de', 'en', 'en', 'es', 'fr', 'hr', 'hu', 'it', 'ja', 'nl', 'pl', 'pt', 'ru', 'sk', 'sv', 'zh'],
		DETECTED_LANGUAGE: "en",
		DEFAULT_TIME_ZONE: "(GMT +00:00) (UTC) Universal Coordinated Time",
		DETECTED_LOCALES: "en-us",
		IS_NATIVE_HTML_PARSER_ENABLED: true,
		IS_MULTI_SERVER: false,
		CUSTOM_LOGIN_LOGO_URL: "",
		CUSTOM_LOGIN_TEXT_COLOR: "",
		CUSTOM_LOGIN_BACKGROUND_COLOR: "",
		CUSTOM_LOGIN_ADDITIONAL_INFO: "",
		CUSTOM_CLIENT_LOGO_URL: ""
	},
	ssoLogin: {
		offerUsernamePassword: "",
		AssertionConsumerURL: "https://mail.u420.com.ua/webmail/sso/jwt",
		identityProviders: []
	}
};
