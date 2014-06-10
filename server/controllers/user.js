'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Role = mongoose.model('Role'),
    config = require('../../config');

var translateAdminDir = function(path) {
    var newPath = (config.admin.dir ? '/' + config.admin.dir : '') + path;
    return newPath;
};
//检查用户是否指定角色
var checkRole = exports.checkRole = function(role, id, success, failure) {
    User.findById(id).populate('roles').exec(function(err, user) {
        if(err || !user) {
            return failure && failure.call(null, err);
        }
        if(user.hasRole(role)) {
            success && success.call(null, err, user);
        }else{
            failure && failure.call(null, err, user);
        }
    });
};

//检查用户是否有指定操作权限
var checkAction = exports.checkAction = function(action, id, success, failure) {
    User.findById(id).populate('roles').exec(function(err, user) {
        if(err || !user) {
            return failure && failure.call(null, err);
        }
        if(user.hasAction(action)) {
            success && success.call(null, err, user);
        }else{
            failure && failure.call(null, err, user);
        }
    });
};
/*
用法：
checkAction('dev', user._id, function(u) {
    console.log('鉴定成功', u);
}, function(u) {
    console.log('鉴定失败', u)
});*/
//用户登录校验
exports.authenticate = function(req, res, next) {
    if (!req.session.user) {
        var path = translateAdminDir('/user/login');
        return res.redirect(path);
    } else {
        next();
    }
};
//用户列表
exports.list = function(req, res) {
    User.find(function(err, results) {
        res.render('server/user/list', {
            users: results
        });
    })
}
//单个用户
exports.one = function(req, res) {
    var id = req.param('id');
    User.findById(id).populate('roles').exec(function(err, result) {
        res.render('server/user/item', {
            user: result
        });
    });
}
//注册
exports.register = function(req, res) {
    var method = req.method;
    if (method === 'GET') {
        res.render('server/user/register', {});
    } else if (method === 'POST') {
        var obj = req.body;
        console.log(obj);
        var user = new User(obj);
        user.save(function(err, result) {
            console.log(result);
            if (err) {
                console.log(err);
                return res.render('server/message', {
                    msg: '注册失败'
                });
            }
            res.render('server/message', {
                msg: '注册成功'
            });
        });
    }
};

//编辑
exports.edit = function(req, res) {
    if(req.method === 'GET') {
        var id = req.params.id;
        User.findById(id, function(err, result) {
            try{
                Role.find(function(err, results) {
                    if(!err && results) {
                        res.render('server/user/edit', {
                            user: result,
                            roles: results
                        });
                    }
                }) 
            }catch(e) {
               res.render('server/user/edit', {
                    user: result
                });
            }
        })
    } else if(req.method === 'POST') {
        var id = req.params.id;
        var obj = req.body;
        User.findByIdAndUpdate(id, obj).populate('roles').exec(function(err, user) {
            console.log(err, user);
            if(!err) {
                req.session.user = user;
                res.locals.User = user;
                res.render('server/message', {
                    msg: '更新成功'
                });
            }
        })
    }
};

//删除
exports.del = function(req, res) {
    /*if(!req.session.user) {
        return res.render('server/message', {
            msg: '请先登录'
        });
    }*/
    var id = req.params.id;
    User.findById(id, function(err, result) {
        if(!result) {
            return res.render('server/message', {
                msg: '用户不存在'
            });
        }
        //TODO:判断权限
        //if(result._id == req.session.user._id) {
            result.remove(function(err) {
                if(err) {
                    return res.render('server/message', {
                        msg: '删除失败222'
                    });
                }
                res.render('server/message', {
                    msg: '删除成功'
                })
            });
        /*}else {
            return res.render('server/message', {
                msg: '你没有权限删除这篇文章'
            });
        }*/
    });
}

//登录
exports.login = function(req, res) {
    if (req.method === 'GET') {
        res.render('server/user/login');
    } else if (req.method === 'POST') {
        var username = req.body.username;
        var password = req.body.password;
        User.findOne({
            username: username
        }).populate('roles').exec(function(err, user) {
            //var ruleObj = user.roleToObj();
            //console.log(ruleObj)
            //console.log(user.hasRole('admin'));
            //console.log(user.hasAction('read'));
            if (!user) {
                return res.render('server/message', {
                    msg: '登录失败, 查无此人'
                });
            }
            /*checkAction('dev', user._id, function(u) {
                console.log('鉴定成功', u);
            }, function(u) {
                console.log('鉴定失败', u)
            });*/
            if (user.authenticate(password)) {
                console.log('登录成功');
                console.log(user);
                req.session.user = user;
                var path = translateAdminDir('/');
                res.redirect(path);
            } else {
                res.render('server/message', {
                    msg: '密码不正确'
                });
            }
        });
    }

};

//注销
exports.logout = function(req, res) {
    if (req.session) {
        req.session.destroy();
        res.locals.user = null;
        console.log('注销成功');
        res.render('server/message', {
            msg: '注销成功'
        });
    } else {
        res.render('server/message', {
            msg: '注销失败'
        });
    }
};

//修改密码
exports.changePassword = function(req, res) {
    var obj = req.body;
    User.findById(obj.id, function(err, user) {
        user.password = obj.password;
        user.save(function(err, result) {
            res.render('server/message', {
                msg: '修改密码成功'
            });
            console.log('修改密码成功', result);
        })
    });
};