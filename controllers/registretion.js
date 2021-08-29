const bcrypt = require('bcryptjs');
const saltRounds = 10;

let view = "registration.hbs";

function dbWork(connection, i18next, body, response){
    connection.query(`SELECT * FROM users WHERE name='${body.name}' OR email='${body.email}'`, function(err, results){
        if (err) return response.render(view, {message: i18next.t('dbError')});
        if (!results.length) return createUser(connection, i18next, body, response);
        response.render(view, {message: i18next.t('regDbHaveUser')});
    });
};

function validation(body){
    if (/^\w+$/.test(body.name) && body.name.length  < 250 && body.email.length  < 250 
        && body.password.length  < 250 && /^\w+@\w+\.\w+/.test(body.email) && /^.+$/.test(body.password) 
        && body.password == body.repeatPassword){
        return true;
    } else return false;
};

function regUser(connection, i18next, body, response){
    if(!body) return response.sendStatus(400);
    if (!validation(body)) return response.render(view, {message: i18next.t('regValidationError')});
    dbWork(connection, i18next, body, response);
};

function createUser(connection, i18next, body, response){
    let passwordHash = bcrypt.hashSync(body.password, saltRounds)
    connection.query(`INSERT INTO users (name, email, passwordHash) VALUES ('${body.name}', '${body.email}', '${passwordHash}')`, function(err, result){
        if (err) return response.render(view, {message: i18next.t('dbError')});
        response.render(view, {message: i18next.t('regSuccess')});
    });
};

module.exports.regUser = regUser;