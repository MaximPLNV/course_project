function loginedUserInfo(req){
    return {logined: req.isAuthenticated(), userInfo: req.user};
};

async function f_query(connection, line){
    const connectionPromise = connection.promise();
    const [rows, fields] = await connectionPromise.query(line);
    return rows;
};

async function getFirstResult(connection, line){
    const rows = await f_query(connection, line);
    return rows? rows[0] : null;
};

function newCollectionValidator(req){
    if (/^.+/.test(req.body.name) && req.body.name.length < 200 && /^.+/.test(req.body.description) && req.body.description.length < 1800){
        return true;
    } else {
        req.flash('newConnectionInfo', 'incorrectData')
        return false;
    }
};

function creatorValudation(req, owner_id){
    if (req.isAuthenticated()){
        if (req.user.id == owner_id || req.user.adminLvl) return true;
    }
    return false;
};

async function user_idValudation(req, connection){
    if (await f_query(connection, `SELECT name FROM users WHERE id=${req.query.user_id}`)) return true;
    return false;
};

function commentValidation(body, req){
    if (/^.+/.test(body.comment) && body.comment.length <= 1800) return true;
    req.flash('comment', 'commentValidationError');
    return false;
};

function newItemValidation(body, req){
    if (/^.+/.test(body.name) && body.name.length < 45) return true;
    req.flash("comment", 'newItemValidationFail')
    return false;
};

async function itemOwnerValidation(con, user_id, col_id){
    let owner = await getFirstResult(con, `SELECT user_id FROM collections WHERE id=${col_id}`);
    if (user_id == owner.user_id) return true;
    return false; 
};

async function getOwnerInfoAndCollections(req, connection){
    return {
        user: await getFirstResult(connection, `SELECT id, name FROM users WHERE id=${req.query.id}`),
        collections: await f_query(connection, `SELECT id, name, theme_id FROM collections WHERE user_id=${req.query.id}`)
    };
};

module.exports.loginedUserInfo = loginedUserInfo;
module.exports.newCollectionValidator = newCollectionValidator;
module.exports.creatorValudation = creatorValudation;
module.exports.f_query = f_query;
module.exports.user_idValudation = user_idValudation;
module.exports.getFirstResult = getFirstResult;
module.exports.commentValidation = commentValidation;
module.exports.newItemValidation = newItemValidation;
module.exports.itemOwnerValidation = itemOwnerValidation;
module.exports.getOwnerInfoAndCollections = getOwnerInfoAndCollections;