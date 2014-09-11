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

exports.throw = function (bottle, callback) {
	throwOneBottle(bottle, function (result) {
		callback(result);
	})
}