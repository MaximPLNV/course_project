const i18next = require('i18next');
const showdown = require('showdown');
const converter = new showdown.Converter();

function hbsCfg(hbs){
    hbs.registerHelper('__', function (key) {
        return i18next.t(key);
    });

    hbs.registerHelper('lang', function () {
        return i18next.language;
    });

    hbs.registerHelper('if_user_eq', function(a, b, opts){
        if (a == b.id || b.adminLvl > 0){
            return opts.fn(this);
        } else {
            return opts.inverse(this);  
        };
    });
    
    hbs.registerHelper('sum', function(a, b){
        return a+b;
    });

    hbs.registerHelper('markdown', function(markdown){
        return converter.makeHtml(markdown);
    });

    hbs.registerHelper('theme', function (theme_id) {
        switch(theme_id){
            case 1: return i18next.t('books');
            case 2: return i18next.t('stamps');
            case 3: return i18next.t('icons');
            case 4: return i18next.t('whiskey');
        };
    });

    hbs.registerPartials(__dirname + "./../views/partials");
}

module.exports.hbsCfg = hbsCfg;