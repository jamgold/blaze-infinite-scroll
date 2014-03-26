Articles = new Meteor.Collection('articles');

if (Meteor.isClient) {
  var ITEMS_INCREMENT = 1;
  var OFFSET_TOP_ADJUSTMENT = -7;

  Session.setDefault('itemsLimit', ITEMS_INCREMENT);
  Session.setDefault('timeout', 1400);
  Session.setDefault('totalArticles', 0);

  // whenever #showMoreResults becomes visible, retrieve more results
  function showMoreVisible()
  {
    var timeout = Session.get('timeout');
    var threshold, offset, target = $('#showMoreResults');
    if (!target.length) return;
    //
    // threshold is half of #showMoreResults is visible
    //
    offset = parseInt(target.offset().top) + OFFSET_TOP_ADJUSTMENT;
    threshold = $(window).scrollTop() + $(window).height() - target.height();
    // console.log(target.height());
    if (offset <= threshold) 
    {
        // console.log('visible '+parseInt(target.offset().top) );
        if ( !target.data('visible') )
        {
            console.log('target became visible (inside viewable area)');
            target.data('visible', true);
            //
            // allow user to see the Loading ...
            //
            Session.set('message','load next in '+timeout+' threshold='+threshold+' offset.top='+target.offset().top);
            Meteor.setTimeout(function() {
              Session.set('itemsLimit', Session.get('itemsLimit') + ITEMS_INCREMENT);
            }, timeout);
        }
    } else {
      // console.log('not visible');
        if ( target.data('visible') )
        {
            // console.log('target became invisible (below viewable area)');
            target.data('visible', false);
        }
    }        
  };

  Template.scrolling.totalArticles = function () {
    return Session.get('totalArticles');
  };

  Template.scrolling.loadedArticles = function() {
    return Articles.find().count();
  };

  Template.scrolling.timeout = function() {
    return Session.get('timeout');
  };

  Template.scrolling.message = function() {
    return Session.get('message');
  };

  Template.scrolling.release = function() {
    return Meteor.release;
  };

  Template.scrolling.ITEMS_INCREMENT = function() {
    return ITEMS_INCREMENT;
  };

  Template.scrolling.events({
    'change input.timeout': function(e, t) {
      e.preventDefault();
      Session.set('timeout',parseInt(e.target.value));
      console.log('timeout set to '+Session.get('timeout'));
    },
    'click a.article-reset': function(e, t) {
      var threshold,offset,target = $('#showMoreResults');
      $('#showMoreResults').data('visible', false);
      Session.set('itemsLimit', 1);
      if(target.length>0)
      {
        threshold = $(window).scrollTop() + $(window).height() - target.height();
        offset = parseInt(target.offset().top) + OFFSET_TOP_ADJUSTMENT;
        Session.set('message','threshold='+threshold+' offset.top='+offset);
      }
      showMoreVisible();
    },
    'click a.article-new': function(e,t) {
      e.preventDefault();
      Articles.insert({title: 'Something random '+new Date(), created:new Date()});
      Meteor.call('totalArticles',function(error, result){
        Session.set('totalArticles', result);
      });
    },
  });

  Template.showMoreResults.moreResults = function(t) {
    var d = Session.get('totalArticles') - Articles.find().count();
    var $m = $('#showMoreResults');
    // console.log('moreResults totalArticles - count = '+d);
    if($m.length)
    {
      if($m.data('visible') == undefined)
        showMoreVisible();
    }
    return parseInt(d)>0;
  };
  //
  // attach to window scroll event
  //
  Template.scrolling.rendered = function() {
    console.log('scrolling.rendered')
    $(window).on('scroll', function(){
      showMoreVisible();
    });
  };

  Template.articles.rendered = function() {
    console.log('articles.rendered')
    // $(window).on('scroll', function(){
    //   showMoreVisible();
    // });
  };

  Template.art.rendered = function() {
    // console.log(this);
    var id = this.$('h1.title').attr('id');
    var o = this.$('h1.title').html();
    this.$('h1.title').editable({type : "textarea", action : "click"}, function(e){
      var n = e.value;
      if(n!=o)
      {
        var a = Articles.findOne({_id: id});
        a.title = n;
        a.updated = new Date().getTime();
        Articles.update({_id: id},a);
      }
    });
  };

  Template.art.destroyd = function() {
    console.log('art destroyed');
  };

  Template.art.events({
    'click span': function(e, t){
      // console.log(e.target.id);
      Articles.remove({_id: e.target.id});
    }
  });

  Template.articles.article = function() {
    return Articles.find({},{sort: {created: 1}});
  };

  Deps.autorun(function() {
    Meteor.subscribe('articles', Session.get('itemsLimit'), function(){
      // console.log('articles subscribed');
      Session.set('message','');
    });

    Meteor.call('totalArticles',function(error, result){
      Session.set('totalArticles', result);
    });
  });
}

if (Meteor.isServer) {
  Meteor.publish('articles', function(limit){
    if(limit == undefined) limit = 1;
    return Articles.find({},{limit: limit, sort: {created: 1}});
  });

  Meteor.methods({
    totalArticles: function() {
      return Articles.find().count();
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
    Articles.update({created:{$exists:0}},{$set:{created: new Date()}}, {multi:1})
  });
}
