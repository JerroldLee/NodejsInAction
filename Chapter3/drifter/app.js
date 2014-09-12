var express = require('express');
var redis = require('./models/redis.js');
var mongodb = require('./models/mongodb.js');

var app = express();
app.use(express.bodyParser());

//扔一个漂流瓶
//POST owner=xxx&type=xxx&content=xxx[&time=xxx]
app.post('/', function (req, res) {
	if (!(req.body.owner && req.body.type && req.body.content)) {
		return res.json({
			code: 0,
			msg: "信息不完整"
		});
	}
	if (req.body.type && (["male", "female"].indexOf(req.body.type) === -1)) {
		return res.json({code: 0, msg: "类型错误"});
	}
	redis.throw(req.body, function (result) {
		res.json(result);
	})
});

//捡一个漂流瓶
//GET /?user=xxx[&type=xxx]
app.get('/', function (req, res) {
	if (!req.query.user) {
		return res.json({code: 0, msg: "信息不完整"});
	}
	if (req.query.type && (["male", "female", "all"].indexOf(req.query.type) === -1)) {
		return res.json({code: 0, msg: "类型错误"});
	}
	redis.pick(req.query, function (result) {
		if (result.code === 1) {
			mongodb.save(req.query.user, result.msg, function (err) {
				if (err) {
					return res.json({code: 0, msg: "获得漂流瓶失败，请重试"});
				}
			});
		}
		res.json(result);
	});
});

app.listen(3000);