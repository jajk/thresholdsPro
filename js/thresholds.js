/*
    @params: 
			msg<optional> 告警阈值字符串，如'< 1 ,(23:00 15:00) > 8 9 10,(02:00 20:00) = 5'
			parentContent<optional> 告警列表父对象，默认为body
*/
function ThresholdComponent(msg, parentContent){
	this.msg = msg || '';
    this.parentContent = parentContent || 'body';
	this.init();
}

var p = ThresholdComponent.prototype;

p.init = function(){
    var ThresholdList = this.getThresholdListFunc(),
		TimeBarList = this.getTimeBarListFunc();
	
	this.chartColor = ['#5f2f69', '#009edf', '#9cc416', '#0049a0', '#9e156d', '#10b50c'];
	this.id = 0;//用作告警视图与TimeBar视图一一对应以及取色
	this.thresholdsList = new ThresholdList;
	this.timeBarList = new TimeBarList;
    this.showThresholdsTable();		
}

p.showThresholdsTable = function(){
	var msgObj = this.parseMsg2Obj(),
		thresholds = msgObj.thresholds,
		timeBars = msgObj.timeBars,
		ThresholdTableView = this.getThresholdTableView(),
		i, 
		len = thresholds.length;
	
	if(len !== 0){
	    for(i = 0; i < len; i++){
		    this.thresholdsList.push(thresholds[i]);
            this.timeBarList.push(timeBars[i]);			
		}        	
	}
	new ThresholdTableView;
}

p.getColor = function(){
	return this.chartColor[this.id++%this.chartColor.length];
}

p.parseMsg2Obj = function(){
	var that = this,
		msg = this.msg,
		reg = /\s*(?:\((\w+:\w+)\s+(\w+:\w+)\))?\s*([^,])\s*(\d+)?\s*(\d+)?\s*(\d+)?/g,
		msgObj = {
			thresholds: [],
			timeBars: []		
		};
		
	msg.replace(reg, function(ws, $1, $2, $3, $4, $5, $6){
		var threshold = {}, 
			timeBar = {},
			id = that.id,
			barColor = that.getColor();
		
		threshold.id = id;
		threshold.startTime = $1 || 'allDay';
		threshold.endTime = $2 || '00:00';
		threshold.operator = $3;
		threshold.warning = $4 || '';
		threshold.error = $5 || '';
		threshold.critical = $6 || '';
		threshold.barColor = barColor;
		msgObj.thresholds.push(threshold);

		timeBar.barColor = barColor;
		timeBar.id = id;
		msgObj.timeBars.push(timeBar);
	});
	
	return msgObj;
}

p.getThresholdsMsgStr = function(){
    var thresholds = this.thresholdsList.models,
	    len = thresholds.length,
		tempObj = null,
		tempArr = [],
		allArr = [];
		
	while(len--){
	    tempObj = thresholds[len].attributes;
		if(tempObj['startTime'] !== 'allDay'){
		    tempArr.push('('+tempObj['startTime']+' '+tempObj['endTime']+')');    	
		}
		tempArr.push(tempObj['operator']);
		tempArr.push(tempObj['warning']);
		tempArr.push(tempObj['error']);	
		tempArr.push(tempObj['critical']);	

		allArr.push(tempArr.join(' ').replace(/\s+/g, ' '));
		tempArr = [];	
	}
    return allArr.join();	
}

p.getThresholdModel = function(){
    return Backbone.Model.extend({
		//每个报警拥有的基本数据
		defaults: function(){
			return {
				id: 0,
				startTime: 'allDay',
				endTime: '00:00',
				operator: '=',
				warning: '',
				error: '',
				critical: '',
				barColor: ''
			};
		}
	});	
}

p.getThresholdView = function(){
    var that = this;
	
	return Backbone.View.extend({
		tagName:  "div",
		className: 'thresholdsRow editing',
		events: {
			"change select": "updateData",
			"blur input": "updateData",
			"click img.delete": 'clear'
		},
		template: _.template($('#threshold-template').html()),
		initialize: function(){
			this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		clear: function(e){
			//this.model.destroy();
			that.thresholdsList.remove(this.model);
			this.remove();
			e.stopPropagation();
		},
		updateData: function(e){
			var $target = $(e.target),
				key = $target.attr('name'),
				val = $target.val();
				
			this.model.set(key, val);
		}
	});	
}

p.getThresholdListFunc = function(){
    var that = this;
	
	return Backbone.Collection.extend({
		model: that.getThresholdModel()
	});	
}

p.getTimeBarModel = function(){
    return Backbone.Model.extend({
		//每个timeBar拥有的基本数据
		defaults: function(){
			return {
				id: 0,
				leftWidth: '0%',
				selfLeft: '0%',
				rightWidth: '0%',
				barHeight: '32px',
				barBottom: '-80px',
				barColor: '#ffffff'
			};
		}
	});	
}

p.getTimeBarView = function(){
    return Backbone.View.extend({
		tagName:  "div",
		template: _.template($('#timeBar-template').html()),
		initialize: function(){
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});	
}

p.getTimeBarListFunc = function(){
    var that = this;
	
	return Backbone.Collection.extend({
		model: that.getTimeBarModel()
	});	
}

p.getThresholdTableView = function(){
    var that = this;
	
	return Backbone.View.extend({
		tagName:  "div",
		className: 'thresholdsTable',
		events: {
			"click": "stopCancelBubble",
			"click .thresholdsRow": "showEditMode",
			"click #addThreshold":  "createThreshold",
			"click .saveBtn": "submitThresholdsData"
		},
		template: _.template($('#thresholdTable-template').html()),
		initialize: function(){
			var selfThis = this;
			
			$(document).on('keydown', function(e){
			    switch (e.which) {
					case 107: //+ key
						selfThis.createThreshold();
						break;
					case 27: //'esc' key
						selfThis.removeEditMode();
						break;
				}	
			}).on('click', function(){
			    selfThis.removeEditMode();	
			});
			//将该视图加入到指定Dom中，默认为body
			$(that.parentContent).append(selfThis.render().el);
			
			selfThis.tBody = selfThis.$('.thresholdsTbody');
			selfThis.timesSlot = selfThis.$('.timesSlot');
			selfThis.listenTo(that.thresholdsList, 'add', selfThis.addOneThreshold);
			selfThis.listenTo(that.thresholdsList, 'change', selfThis.updateTimeBarOne);
			selfThis.listenTo(that.thresholdsList, 'remove', selfThis.removeOneTimeBar);
			
			if(that.thresholdsList.length !== 0){
			    selfThis.addAll();	
			}
		},
		render: function(){
			this.$el.html(this.template());
			return this;
		},
		stopCancelBubble: function(e){
		    e.stopPropagation();	
		},
		removeEditMode: function(){
		    var $oldEdit = this.tBody.find('.thresholdsRow.editing').eq(0),
				$oldError = null,
				$oldCritical = null;

			if($oldEdit){
				$oldError = $oldEdit.find('.errorSec'),
				$oldCritical = $oldEdit.find('.criticalSec')
				
				if(!$oldError.find('input:first').val()){
					$oldError.slideUp();	
				}
				if(!$oldCritical.find('input:first').val()){
					$oldCritical.slideUp();	
				}
				$oldEdit.removeClass('editing');
			}			
		},
		showEditMode: function(e){
			var $el = $(e.currentTarget);
			
			if(!$el.hasClass('editing')){
			    this.removeEditMode();
				
				$el.find('.errorSec').slideDown();
                $el.find('.criticalSec').slideDown();
                
				$el.addClass("editing");
				if(!$el.find(':focus').length){
					$el.find('select').eq(0).focus();	
				}
			}
		},
		updateTimeBar: function(id, startTime, endTime){
		    var thisTimeBar = that.timeBarList.get(id),
				reg4Time = /(\d+):(\d+)/,
				getStartTimeVals = null,
				getEndTimeVals = null,
				startVal = 0,
				endVal = 0,
				diff = 0,
				tempTimeObj = {};

			if(startTime !== 'allDay'){
				getStartTimeVals = startTime.match(reg4Time);
				getEndTimeVals = endTime.match(reg4Time);
				startVal = 60 * parseInt(getStartTimeVals[1]) + parseInt(getStartTimeVals[2]);
				endVal = 60 * parseInt(getEndTimeVals[1]) + parseInt(getEndTimeVals[2]);
				diff = endVal - startVal;
				if(diff >= 0){//width=diff/1440  left=startVal/1440
					tempTimeObj.leftWidth = (diff/1440*100)+'%';
					tempTimeObj.selfLeft = (startVal/1440*100)+'%';
					tempTimeObj.rightWidth = '0%';  				
				}else{
					tempTimeObj.leftWidth = (endVal/1440*100)+'%';
					tempTimeObj.selfLeft = '0%';
					tempTimeObj.rightWidth = ((1440-startVal)/1440*100)+'%'; 	
				}
				tempTimeObj.barHeight = '32px';
				tempTimeObj.barBottom = '-80px';			
			}else{
				tempTimeObj.leftWidth = '100%';
				tempTimeObj.selfLeft = '0%';
				tempTimeObj.rightWidth = '0%';
				tempTimeObj.barHeight = '18px';
				tempTimeObj.barBottom = '-72px';					
			}
			thisTimeBar.set(tempTimeObj);
		},
		//将新增报警添加到对应插槽
		addOneThreshold: function(threshold){
			var ThresholdView = that.getThresholdView(),
				itemView = new ThresholdView({model: threshold}),
				id = threshold.get('id');
			
			this.removeEditMode();
			this.tBody.prepend(itemView.render().el);
			itemView.$el.find('select[name="startTime"]').trigger('change');
			
			this.addOneTimeBar(that.timeBarList.get(id));
			this.updateTimeBar(id, 
				threshold.get('startTime'), 
				threshold.get('endTime'));
		},
		//将新增timeBar添加到对应插槽
		addOneTimeBar: function(timeBar){
			var TimeBarView = that.getTimeBarView(),
				itemView = new TimeBarView({model: timeBar});
			
			this.timesSlot.prepend(itemView.render().el);
		},
		removeOneTimeBar: function(threshold){
			var id = threshold.get('id'),
			    barClass = '.time'+id;
				
			this.timesSlot.find(barClass).parent().remove();
			that.timeBarList.remove({id: id});
		},
		addAll: function() {
			that.thresholdsList.each(this.addOneThreshold, this);
			this.removeEditMode();
		},
		//新增一个报警
		createThreshold: function(){ 
			var id = that.id,
				bgColor = that.getColor();
			
			that.timeBarList.push({id: id, barColor: bgColor});
			that.thresholdsList.push({id: id, barColor: bgColor});			
		},
		updateTimeBarOne: function(threshold){
			this.updateTimeBar(threshold.get('id'), 
				threshold.get('startTime'), 
				threshold.get('endTime'));
		},
		submitThresholdsData: function(){
			var msg = that.getThresholdsMsgStr();
			
			this.removeEditMode();
			console.log(msg);//test
			return msg; 
		}
    });	
}