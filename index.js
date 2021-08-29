const i18next = require('i18next');
const en = require('./locales/en.json');
const ru = require('./locales/ru.json');
const config = require('./configs/config.js');
const reg = require('./controllers/registretion.js');
const admPan = require('./controllers/adminPanServer.js');
const mysql = require('mysql2');
const hbs = require('hbs');
const express = require('express');
const passport = require('passport');
const infoFunctions = require('./controllers/infoFunctions.js');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const app = express();
const upload = multer();
const connection = mysql.createConnection(config.dbconf);

cloudinary.config(config.cloudinaryConf);

app.set('view engine', 'hbs');
app.engine('hbs', hbs.__express);

require('./configs/configHbs.js').hbsCfg(hbs);
require('./configs/configApp.js').appConfig(app, connection);

i18next.init({
    lng: 'en',
    resources: {
        en: {
            translation: en
        },
        ru: {
            translation: ru
        }
    }
});

app.use(function(request, response, next){
    let lng;
    request.session.lng ? lng = request.session.lng : lng = 'en';
    i18next.changeLanguage(lng)
    next();
});

app.get("/", async function(request, response){
    response.render('main.hbs', {
        loginedUser: infoFunctions.loginedUserInfo(request),
        items: await infoFunctions.f_query(connection, `SELECT items.id AS id, items.collection_id AS col_id, items.name AS item_name, items.tags AS tags, items.user_id AS user_id, DATE_FORMAT(items.creating_date, '%d.%m.%Y %T') AS cr_date, collections.name AS col_name FROM items LEFT JOIN collections ON items.collection_id=collections.id ORDER BY creating_date DESC LIMIT 5`),
        collections: await infoFunctions.f_query(connection, `SELECT collections.id AS id, collections.name AS col_name, collections.theme_id AS theme, COUNT(items.collection_id) AS count FROM collections LEFT JOIN items ON collections.id=items.collection_id GROUP BY collections.id ORDER BY count DESC LIMIT 5;`)
    });
});

app.get("/admin", async function(request, response){
    if (!request.isAuthenticated() || !request.user.adminLvl) return response.redirect("/");
    response.render("adminpan.hbs", {
        loginedUser: infoFunctions.loginedUserInfo(request),
        users: await infoFunctions.f_query(connection, `SELECT id, name, email, status, adminLvl FROM users`)
    });
});

app.get("/login", function(request, response){
    response.render("login.hbs", {loginedUser: infoFunctions.loginedUserInfo(request), message: i18next.t(`${request.flash('error')}`)});
});

app.post("/login", passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.get('/google_login', passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }));

app.get('/google_login/callback', passport.authenticate('google', { failureRedirect: '/login', successRedirect: "/" }));

app.get("/facebook_login", passport.authenticate('facebook'));

app.get("/facebook_login/callback", passport.authenticate('facebook', {failureRedirect: "/login", successRedirect: "/"}));

app.get("/logout", function(request, response){
    if (request.isAuthenticated()) request.logout();
    response.redirect(request.headers.referer);
});

app.get("/registration", function(request, response){
    response.render("registration.hbs", {loginedUser: infoFunctions.loginedUserInfo(request)});
});

app.post("/registration", function(request, response){
    reg.regUser(connection, i18next, request.body, response);
});

app.get("/search", function(request, response){
    response.render("search.hbs", {loginedUser: infoFunctions.loginedUserInfo(request)});
});

app.get("/user", async function(request, response){
    if(!request.query.id) return response.redirect("/");
    response.render("userCollections.hbs", {
        loginedUser: infoFunctions.loginedUserInfo(request),
        pageOwnerInfo: await infoFunctions.getOwnerInfoAndCollections(request, connection),
        message: i18next.t(`${request.flash('newConnectionInfo')}`)
        });
});

app.post("/newcollection", upload.fields([]), async function(request, response){
    if (infoFunctions.newCollectionValidator(request) && infoFunctions.creatorValudation(request, request.query.user_id) && (await infoFunctions.user_idValudation(request, connection))){
        if (!request.body.img) request.body.img = 'https://res.cloudinary.com/dezblnxgl/image/upload/v1629454855/default_upglk6.jpg';
        await infoFunctions.f_query(connection, `INSERT INTO collections (user_id, name, theme_id, description, img_link) VALUES (${request.query.user_id}, '${request.body.name}', ${request.body.theme}, '${request.body.description}', '${request.body.img}')`);
        request.flash('newConnectionInfo', 'successfulCollectionCreate');
    };
    response.redirect(301, request.query.user_id ? `/user?id=${request.query.user_id}` : '/');
});

app.get("/item", async function(request, response){
    if(!request.query.id) return response.redirect('/');
    response.render("item.hbs", {
        loginedUser: infoFunctions.loginedUserInfo(request),
        item: await infoFunctions.getFirstResult(connection, `SELECT * FROM items WHERE id=${request.query.id}`),
        comments: await infoFunctions.f_query(connection, `SELECT * FROM comments WHERE item_id=${request.query.id} ORDER BY creating_date`),
        like: request.isAuthenticated() ? await infoFunctions.getFirstResult(connection, `SELECT * FROM likes WHERE item_id=${request.query.id} AND user_id=${request.user.id}`) : false,
        likes_count: await infoFunctions.getFirstResult(connection, `SELECT COUNT(*) AS count FROM likes WHERE item_id=${request.query.id}`),
        message: i18next.t(`${request.flash('comment')}`)
    });
});

app.get("/like", async function(request, response){
    if(request.query.item_id && request.isAuthenticated()){
        await infoFunctions.f_query(connection, `INSERT INTO likes (item_id, user_id) VALUES (${request.query.item_id}, ${request.user.id})`);
    };
    response.redirect(request.headers.referer);
});

app.post("/send_comment", async function(request, response){ 
    if (request.query.item_id && request.body && request.isAuthenticated() && infoFunctions.commentValidation(request.body, request)){
        await infoFunctions.f_query(connection, `INSERT INTO comments (user_id, user_name, comment, item_id) VALUES (${request.user.id}, '${request.user.name}', '${request.body.comment}', ${request.query.item_id})`);
        request.flash('comment', 'newCommentSuccessful');
    }
    response.redirect(request.headers.referer);
});

app.post("/new_item", async function(request, response){
    if (request.query.col_id && request.body && request.isAuthenticated() && infoFunctions.newItemValidation(request.body, request) && (await infoFunctions.itemOwnerValidation(connection, request.user.id, request.query.col_id))){
        await infoFunctions.f_query(connection, `INSERT INTO items (collection_id, name, tags, user_id) VALUES (${request.query.col_id}, '${request.body.name}', '${request.body.tags}', ${request.user.id})`);
        request.flash('comment', 'newItemSeccessful')
    };
    response.redirect(request.headers.referer);
});

app.get('/edit_item', async function(request, response){
    if(request.query.id){ 
        let item = await infoFunctions.getFirstResult(connection, `SELECT * FROM items WHERE id=${request.query.id}`);
        if (item) return response.render("itemEditor.hbs", { loginedUser: infoFunctions.loginedUserInfo(request), item: item });
    };
    return response.redirect(request.headers.referer);
});

app.post("/edit_item", async function(request, response){
    if (request.query.id && request.body){
        let owner = await infoFunctions.getFirstResult(connection, `SELECT user_id FROM items WHERE id=${request.query.id}`);
        if (owner && infoFunctions.creatorValudation(request, owner.user_id) && infoFunctions.newItemValidation(request.body, request)){
            await infoFunctions.f_query(connection, `UPDATE items SET name='${request.body.name}', tags='${request.body.tags}' WHERE id=${request.query.id}`);
            request.flash('comment', 'successfulItemEdit');
        };
    };
    response.redirect(request.query.col_id ? `/collection?id=${request.query.col_id}` : '/')
});

app.get("/collection", async function(request, response){
    if(!request.query.id) return response.redirect('/');
    response.render("collection.hbs", {
        loginedUser: infoFunctions.loginedUserInfo(request),
        owner: await infoFunctions.getFirstResult(connection, `SELECT user_id FROM collections WHERE id=${request.query.id}`),
        collection: await infoFunctions.getFirstResult(connection, `SELECT * FROM collections WHERE id=${request.query.id}`),
        items: await infoFunctions.f_query(connection, `SELECT * FROM items WHERE collection_id=${request.query.id}`),
        message: i18next.t(`${request.flash('comment')}`)
    });
});

app.get("/delete_item", async function(request, response){
    if (request.query.id){
        let owner = await infoFunctions.f_query(connection, `SELECT user_id FROM items WHERE id=${request.query.id}`);
        if (owner[0] && infoFunctions.creatorValudation(request, owner[0])){
            await infoFunctions.f_query(connection, `DELETE FROM items WHERE id=${request.query.id}`);
            await infoFunctions.f_query(connection, `DELETE FROM comments WHERE item_id=${request.query.id}`);
        };
    };
    response.redirect(request.headers.referer);    
});

app.get("/edit_collection", async function(request, response){
    if (request.query.col_id){
        let collection = await infoFunctions.getFirstResult(connection, `SELECT * FROM collections WHERE id=${request.query.col_id}`)
        if (collection && infoFunctions.creatorValudation(request, collection.user_id)){
            return response.render("collectionEditor.hbs", {
                loginedUser: infoFunctions.loginedUserInfo(request),
                collectionInfo: collection});
        };
    };
    response.redirect(request.headers.referer);
});

app.post('/edit_collection', upload.fields([]), async function(request, response){
    if (request.query.col_id && request.body){
        let collection = await infoFunctions.getFirstResult(connection, `SELECT user_id FROM collections WHERE id=${request.query.col_id}`)
        if (collection && infoFunctions.creatorValudation(request, collection.user_id) && infoFunctions.newCollectionValidator(request)){
            await infoFunctions.f_query(connection, `UPDATE collections SET name='${request.body.name}', theme_id=${request.body.theme}, description='${request.body.description}'${request.body.img ? ", img_link='" + request.body.img + "'": ""} WHERE id=${request.query.col_id}`);
            request.flash('message', 'successfulCollectionEdit')
        };
    };
    response.redirect(301, request.query.user_id ? `/user?id=${request.query.user_id}` : "/");
});

app.get("/delete_collection", async function(request, response){
    if (request.query.col_id){
        let owner = await infoFunctions.f_query(connection, `SELECT user_id FROM collections WHERE id=${request.query.col_id}`);
        if (owner[0] && infoFunctions.creatorValudation(request, owner[0])) await infoFunctions.f_query(connection, `DELETE FROM collections WHERE id=${request.query.col_id}`);
    }
    response.redirect(request.headers.referer);
});

app.get("/comments_update",async function(request, response){
    if (!request.query.id) return response.sendStatus(406);
    let comments = await infoFunctions.f_query(connection, `SELECT * FROM comments WHERE item_id=${request.query.id} ORDER BY creating_date`);
    return response.json(comments);
});

app.get('/languageupdate', function(request, response){
    if(!request.query.lg || (request.query.lg != 'en' && request.query.lg != 'ru')) return response.sendStatus(400);
    request.session.lng = request.query.lg;
    response.redirect(request.headers.referer);
});

app.get('/block', async function(request, response){
    await admPan.adminMove(request, response, 'block', connection);
});

app.get('/unblock', async function(request, response){
    await admPan.adminMove(request, response, 'unblock', connection);
});

app.get('/delete', async function(request, response){
    await admPan.adminMove(request, response, 'delete', connection);
});

app.get('/adminup', async function(request, response){
    await admPan.adminMove(request, response, 'admUp', connection);
});

app.get('/admindown', async function(request, response){
    await admPan.adminMove(request, response, 'admDown', connection);
});

app.listen(config.PORT, function(){
    console.log(`Server has been started on PORT ${config.PORT}`);
});