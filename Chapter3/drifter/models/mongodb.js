var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/drifter', {
	server: {
		poolSize: 10
	}
});

//定义漂流瓶模型，并设置数据存储到bottles集合
var bottleModel = mongoose.model('Bottle', new mongoose.Schema({
	bottle: Array,
	message: Array
}, {
	collection: 'bottles'
}));

//将用户捡到