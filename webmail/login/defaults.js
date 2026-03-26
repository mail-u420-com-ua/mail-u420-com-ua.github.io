var k_defaults = {
    k_title: "Kerio Connect Client",
    k_name: "Kerio Connect Client",
    k_pathToTranslations: "../translations",
    k_favIconUrl: "/favicon.ico?v=545c0e91ce9a37a41eb97a1641855615",
    k_iOsAppIcon: "/apple-touch-icon-precomposed.png?v=545c0e91ce9a37a41eb97a1641855615",
    k_preloadExtJs: !1,
    k_hideRememberMe: !0,
    k_preloadScripts: [ "../lib/ext4/ext.min.js" ],
    k_lowerMessage: '<div style="text-align:center;"><a href="/integration/" id="integrationLinks" style="font-size: 12px; color: rgb(100, 99, 99);">Integration</a></div>',
    k_lowerMessage2FALogin: '<div style="text-align:center;" id="2FAInfo">%2FAInfo%</div>',
    k_css: [ "/weblib/int/login/connect/webmail2.css" ],
    k_supportedBrowsers: {
        Firefox: {
            k_min: 23
        },
        Chrome: {
            k_min: 31
        },
        Safari: {
            k_min: 6
        },
        MS_Edge: {
            k_min: 20,
            k_max: 20,
            k_name: "Microsoft Edge"
        },
        MSIE: {
            k_min: 11,
            k_max: 11
        }
    },
    k_blockedBrowsers: {
        MSIE: {
            k_min: 0,
            k_max: 9
        }
    },
    k_minimalResolution: {
        k_minWidth: 1152,
        k_minHeight: 768
    },
    k_onAfterLoad: function() {
        var e, i, n, t = /linux/, o = /windows|win32/, a = /macintosh|mac os x/, r = /android|iphone|ipad|windows\ phone|bb10/, l = navigator.userAgent.toLowerCase(), s = document.getElementById("integrationLinks");
        if (r.test(l)) {
            n = kerio.lib.k_tr("Integration with device", "wlibLoginPage");
        } else {
            if (o.test(l)) {
                n = kerio.lib.k_tr("Integration with Windows", "wlibLoginPage");
            } else {
                if (a.test(l)) {
                    n = kerio.lib.k_tr("Integration with Mac", "wlibLoginPage");
                } else {
                    if (t.test(l)) {
                        n = kerio.lib.k_tr("Integration with Linux", "wlibLoginPage");
                    } else {
                        n = kerio.lib.k_tr("Integration with device", "wlibLoginPage");
                    }
                }
            }
        }
        if (null !== s) {
            s.innerHTML = n;
        }
        i = document.getElementById("additional-message-container").getElementsByTagName("a");
        for (e = 0; e < i.length; e++) {
            i[e].target = "_blank";
        }
        s = document.getElementById("2FAInfo");
        if (null !== s) {
            s.innerHTML = s.innerHTML.replace("%2FAInfo%", kerio.lib.k_tr("Please enter 2FA Code using Google or Microsoft Authenticator Apps", "wlibLoginPage"));
        }
    }
};