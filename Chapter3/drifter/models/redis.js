var redis = require('redis');
var uuid = require('node-uuid');
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
	name: 'redisPool',
	create: function (callback) {
		var client = redis.createClient();
		callback(null, client);
	},
	destroy: function (client) {
		client.quit();
	},
	max: 100,
	min: 5,
	idleTimeoutMillis: 30000,
	log: true
});

//扔一个瓶子
function throwOneBottle(bottle, callback) {
	bottle.time = bottle.time || Date.now();
	//为每个漂流瓶随机生成一个id
	var bottleId = uuid.v4();
	var type = {male: 0, female: 1};
	pool.acquire(function (err, client) {
		if (err) {
			return callback({code: 0, msg: err});
		}
		client.SELECT(type[bottle.type], function () {
			//以hash类型保存漂流瓶对象
			client.HMSET(bottleId, bottle, function (err, result) {
				if (err) {
					return callback({code: 0, msg: "过会儿再试试吧！"});
				}
				//设置漂流瓶生存期
				client.EXPIRE(bottleId, 86400, function () {
					//释放连接
					pool.release(client);
				});
				//返回结果，陈宫是返回OK
				callback({code: 1, msg: result});
			});
		});
		
	});
}

//捡一个漂流瓶
function pickOneBottle(info, callback) {
	var type = {
		all: Math.round(Math.random()),
		male: 0,
		female: 1
	};
	info.type = info.type || 'all';
	pool.acquire(function (err, client) {
		if (err) {
			return callback({code: 0, msg: err});
		}
		console.log('info.type:' + info.type);
		//根据请求的瓶子类型到不同的数据库中取
		client.SELECT(type[info.type], function () {
			//随机返回一个漂流瓶id
			client.RANDOMKEY(function (err, bottleId) {
				if (err) {
					return callback({code: 0, msg: err});
				}
				if (!bottleId) {
					return callback({code: 0, msg: "海星"});
				}
				//根据漂流瓶id取到漂流瓶完整信息
				client.HGETALL(bottleId, function (err, bottle) {
					if (err) {
						return callback({code: 0, msg: "漂流瓶破损了..."});
					}
					//从redis中删除该漂流瓶
					client.DEL(bottleId, function () {
						//释放连接
						pool.release(client);
					});
					//返回结果。成功时包含捡到的漂流瓶信息
					callback({code: 1, msg: bottle});
				});
			});
		});
	});
}

exports.throw = function (bottle, callback) {
	throwOneBottle(bottle, function (result) {
		callback(result);
	})
}

exports.pick = function (info, callback) {
	//20%概率捡到海星
	if (Math.random() <= 0.2) {
		return callback({code: 1, msg: "海星"});
	}
	pickOneBottle(info, function (result) {
		callback(result);
	});
}