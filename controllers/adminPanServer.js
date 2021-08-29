async function adminMove(request, response, move, connection){
    if(request.isAuthenticated() && request.query.ids && request.user.adminLvl){
        let line;
        switch(move){
            case 'block':
                line = `UPDATE users SET status=1 WHERE id IN (${request.query.ids.join(', ')}) AND adminLVL <= ${request.user.adminLvl}`;
                break;
            case 'unblock':
                line = `UPDATE users SET status=0 WHERE id IN (${request.query.ids.join(', ')})`;
                break;
            case 'delete':
                line = `DELETE FROM users WHERE id IN (${request.query.ids.join(', ')}) AND adminLvl <= ${request.user.adminLvl}`;
                break;
            case 'admUp':
                line = `UPDATE users SET adminLvl=adminLvl+1 WHERE id IN (${request.query.ids.join(', ')}) AND adminLvl < ${request.user.adminLvl}`;
                break;
            case 'admDown':
                line = `UPDATE users SET adminLvl=adminLvl-1 WHERE id IN (${request.query.ids.join(', ')}) AND adminLvl > 0 AND adminLvl <= ${request.user.adminLvl}`;
                break;
        }
        let prom = connection.promise();
        await prom.query(line);
    }
    response.redirect('/admin');
};

module.exports.adminMove = adminMove;