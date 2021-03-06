'use strict';

let mongoose = require('mongoose')
let Message = mongoose.model('Message')
let util = require('../../lib/util')
//列表
exports.list = function (req, res) {
  let condition = {};
  Message.count(condition, function (err, total) {
    let query = Message.find(condition);
    //分页
    let pageInfo = util.createPage(req.query.page, total);
    //console.log(pageInfo);
    query.skip(pageInfo.start);
    query.limit(pageInfo.pageSize);
    query.sort({ created: -1 });
    query.exec(function (err, results) {
      //console.log(err, results);
      res.render('server/message/list', {
        //title: '列表',
        Menu: 'list',
        messages: results,
        pageInfo: pageInfo
      });
    })
  })

};
//单条
exports.one = function (req, res) {
  let id = req.params.id;
  Message.findById(id).exec(function (err, result) {
    console.log(result);
    if (!result) {
      return res.render('server/info', {
        message: '该留言不存在'
      });
    }
    res.render('server/message/item', {
      title: result.name + '的留言',
      message: result
    });
  });
};
//删除
exports.del = function (req, res) {
  let id = req.params.id;
  Message.findById(id).exec(function (err, result) {
    if (!result) {
      return res.render('server/info', {
        message: '留言不存在'
      });
    }
    console.log(result)
    result.remove(function (err) {
      if (req.xhr) {
        return res.json({
          status: !err
        });
      }
      if (err) {
        return res.render('server/info', {
          message: '删除失败'
        });
      }
      res.render('server/info', {
        message: '删除成功'
      })
    });
  });
};
