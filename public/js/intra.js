// Generated by CoffeeScript 1.6.2
(function() {
  var channel, delay, filename, interval, listScripts, listWorlds, loadCurrentWorld, loadNextScript, loadScripts, loadWorlds, loadedScripts, nextStatus, noraw, notIn, scripts, shorten, sortAndLoad, status, statusDelay, statuscnt, statuses, users, worlds;

  channel = window.channel;

  interval = function(ms, func) {
    return setInterval(func, ms);
  };

  delay = function(ms, func) {
    return setTimeout(func, ms);
  };

  window.users = {};

  users = window.users;

  channel.onopen = function(userid) {
    console.log('onopen ' + userid);
    channel.send({
      test: 'hello'
    });
    return users[userid] = {};
  };

  interval(1500, function() {
    console.log('trying to send');
    return channel.send("hey there");
  });

  channel.onleave = function(userid) {
    return delete users[userid];
  };

  channel.onmessage = function(message, userid) {
    return console.log("Message from " + userid + ": " + (JSON.stringify(message)));
  };

  channel.onerror = function(event) {
    console.log("Data channel error:");
    return console.log(event);
  };

  channel.onclose = function(event) {
    console.log("Data channel close!");
    return console.log(event);
  };

  shorten = function(url) {
    return url;
    if (url.length < 45) {
      return url;
    } else {
      return url.substr(0, 35) + '..' + url.substr(url.length - 25, 25);
    }
  };

  noraw = function(url) {
    if (url.indexOf('github') >= 0) {
      return url.replace('raw', 'blob');
    } else {
      return url;
    }
  };

  listScripts = function(data) {
    var e, found, s, script, _i, _j, _len, _len1;

    found = false;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      script = data[_i];
      if (script.url.indexOf('three.min.js') >= 0) {
        found = true;
      }
    }
    if (!found) {
      scripts.put({
        world: window.world,
        url: 'https://raw.github.com/mrdoob/three.js/master/build/three.min.js'
      }, function() {
        return loadScripts();
      });
    } else {
      s = '';
      for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
        script = data[_j];
        try {
          s += "<li class='scrname'><a style='display:inline;' href='javascript:removeScript(\"" + script.url + "\");'>X</a><a style='display:inline' target='_blank' href='" + (noraw(script.url)) + "'>" + (shorten(script.url)) + "</a></li>";
        } catch (_error) {
          e = _error;
          console.log(e);
        }
      }
      s += '<li><a data-toggle="modal" data-target="#addScript">Add Script</a></li>';
      return $('.scriptnav').html(s);
    }
  };

  loadedScripts = {};

  filename = function(scripturl) {
    var lastSlash;

    lastSlash = scripturl.lastIndexOf('/');
    return scripturl.substr(lastSlash + 1);
  };

  notIn = function(scriptList, toFind) {
    var item, _i, _len;

    for (_i = 0, _len = scriptList.length; _i < _len; _i++) {
      item = scriptList[_i];
      if (filename(item.url) === filename(toFind.url)) {
        return false;
      }
    }
    return true;
  };

  sortAndLoad = function(scripts) {
    var edges, fullscripts, item, mod, name, norequires, req, reqtype, reqtypestr, requires, script, scriptList, sorted, _i, _j, _k, _l, _len, _len1, _len2, _len3;

    fullscripts = {};
    edges = [];
    norequires = [];
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      script = scripts[_i];
      fullscripts[filename(script.url)] = script;
      reqtype = typeof script.requires;
      reqtypestr = reqtype.toString();
      if (script.requires == null) {
        norequires.push(script);
      } else {
        requires = script.requires.split(',');
        for (_j = 0, _len1 = requires.length; _j < _len1; _j++) {
          req = requires[_j];
          mod = $.trim(req);
          edges.push([filename(script.url), mod]);
        }
      }
    }
    sorted = window.toposort(edges);
    sorted = sorted.reverse();
    scriptList = [];
    for (_k = 0, _len2 = sorted.length; _k < _len2; _k++) {
      name = sorted[_k];
      if (fullscripts[name] != null) {
        scriptList.push(fullscripts[name]);
      } else {
        console.log("missing required script " + name);
      }
    }
    for (_l = 0, _len3 = norequires.length; _l < _len3; _l++) {
      item = norequires[_l];
      if (notIn(scriptList, item)) {
        scriptList.push(item);
      }
    }
    return loadNextScript(scriptList, 0);
  };

  statuscnt = 0;

  statuses = [];

  statusDelay = false;

  status = function(text) {
    console.log(text);
    statuses.push(text);
    if (!statusDelay) {
      statusDelay = true;
      return delay(60, nextStatus);
    }
  };

  nextStatus = function() {
    if (statuses.length > 0) {
      $('.statusinfo').html(statuses.shift() + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ');
    }
    if (statuses.length > 0) {
      statusDelay = true;
      return delay(60, nextStatus);
    } else {
      return statusDelay = false;
    }
  };

  loadNextScript = function(list, i) {
    var script;

    if (i > list.length - 1) {
      status("" + i + " scripts loaded.");
      listScripts(list);
    } else {
      script = list[i];
      if ((script != null) && (loadedScripts[script.url] == null)) {
        status('LOADING SCRIPT WITH URL ' + script.url);
        return $.ajax({
          url: script.url,
          crossDomain: true,
          dataType: "script",
          success: function() {
            status('Done loading script.');
            loadedScripts[script.url] = true;
            return delay(20, function() {
              return loadNextScript(list, i + 1);
            });
          },
          error: function(er) {
            console.log('ERROR loading script with url ' + script.url);
            console.log(er);
            return loadNextScript(list, i + 1);
          }
        });
      } else {
        status('Already loaded ' + script.url + ', you must refresh to load again.');
        return loadNextScript(list, i + 1);
      }
    }
  };

  loadScripts = function() {
    var allScripts, keyRange, onScript;

    allScripts = [];
    onScript = function(script, cursor, trans) {
      var e1;

      try {
        return allScripts.push(script);
      } catch (_error) {
        e1 = _error;
        console.log("Error in onScript");
        return console.log(e1);
      }
    };
    keyRange = scripts.makeKeyRange({
      lower: window.world,
      upper: window.world
    });
    return scripts.iterate(onScript, {
      index: 'world',
      order: 'ASC',
      keyRange: keyRange,
      filterDuplicates: false,
      writeAccess: false,
      onEnd: function() {
        return sortAndLoad(allScripts);
      },
      onError: function(err) {
        console.log('there was an error iterating over scripts');
        return console.log(err);
      }
    });
  };

  scripts = new IDBStore({
    storeName: 'script',
    keyPath: 'id',
    autoIncrement: true,
    dbVersion: 3,
    onStoreReady: loadScripts,
    indexes: [
      {
        name: 'world',
        keyPath: 'world',
        unique: false
      }
    ]
  });

  window.scripts = scripts;

  window.world = 'default';

  listWorlds = function(data) {
    var s, world, _i, _len;

    s = '';
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      world = data[_i];
      s += "<li class='scrname'><a style='display:inline;' href='javascript:removeWorld(\"" + world.name + "\");'>X</a><a style='display:inline' target='_blank' href='javascript:loadWorld(\"" + world.name + "\")'>" + world.name + "</a></li>";
    }
    s += '<li><a data-toggle="modal" data-target="#addWorld">Add World</a></li>';
    return $('.worldnav').html(s);
  };

  loadWorlds = function() {
    return worlds.getAll(function(data) {
      if (data.length === 0) {
        worlds.put({
          name: 'default'
        });
        return loadWorlds();
      }
      return listWorlds(data);
    });
  };

  worlds = new IDBStore({
    storeName: 'world',
    keyPath: 'name',
    onStoreReady: loadWorlds
  });

  window.worlds = worlds;

  loadCurrentWorld = function() {
    status("Loading world " + window.world + "..");
    $('#currworld').html(window.world);
    return loadScripts();
  };

  $(function() {
    status('Initializing..');
    $('.dropdown-toggle').dropdown();
    $('.dropdown input, .dropdown label').click(function(e) {
      return e.stopPropagation();
    });
    window.toggleNav = function() {
      return $('.navbar').slideToggle();
    };
    window.removeScript = function(url) {
      return scripts.remove(url, loadScripts);
    };
    window.addScript = function() {
      var newScript;

      newScript = {
        url: $('#scripturl').val(),
        world: window.world,
        requires: $('#scriptrequires').val()
      };
      return scripts.put(newScript, function() {
        $('#addScript').modal('hide');
        return loadScripts();
      });
    };
    window.removeWorld = function(url) {
      return worlds.remove(url, loadWorlds);
    };
    window.addWorld = function() {
      var newWorld;

      console.log('adding world');
      newWorld = {
        name: $('#worldname').val()
      };
      worlds.put(newWorld, function() {
        $('#addWorld').modal('hide');
        return loadWorlds();
      });
    };
    window.loadWorld = function(name) {
      status('Loading world ' + name);
      window.world = name;
      return loadCurrentWorld();
    };
    return delay(100, function() {
      return loadCurrentWorld();
    });
  });

}).call(this);
