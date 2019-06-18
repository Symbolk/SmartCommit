// AMD require version to 
(function () {
    var nodeRequire = global.require
    const path = require('path');
    const amdLoader = require('./node_modules/monaco-editor/min/vs/loader.js');
    var amdRequire = global.require
    global.require = nodeRequire
    amdRequire = amdLoader.require;
    const amdDefine = amdLoader.require.define;

    function uriFromPath(_path) {
        var pathName = path.resolve(_path).replace(/\\/g, '/');
        if (pathName.length > 0 && pathName.charAt(0) !== '/') {
            pathName = '/' + pathName;
        }
        return encodeURI('file://' + pathName);
    }

    amdRequire.config({
        baseUrl: uriFromPath(path.join(__dirname, './node_modules/monaco-editor/min'))
    });

    // workaround monaco-css not understanding the environment
    self.module = undefined;

    amdRequire(['vs/editor/editor.main'], function () {
        var diffEditor = monaco.editor.createDiffEditor(document.getElementById('monaco'), {
            // theme: "vs-dark",
            scrollBeyondLastLine: false
        });

        monaco.Promise.join([xhr('changes.js'), xhr('diffview.js')]).then(function (r) {
            var originalTxt = r[0].responseText;
            var modifiedTxt = r[1].responseText;

            diffEditor.setModel({
                original: monaco.editor.createModel(originalTxt, 'javascript'),
                modified: monaco.editor.createModel(modifiedTxt, 'javascript'),
            })
        });
    });

    function xhr(url) {
        var req = null;
        return new monaco.Promise(function (c, e, p) {
            req = new XMLHttpRequest();
            req.onreadystatechange = function () {
                if (req._canceled) {
                    return;
                }

                if (req.readyState === 4) {
                    if ((req.status >= 200 && req.status < 300) || req.status === 1223) {
                        c(req);
                    } else {
                        e(req);
                    }
                    req.onreadystatechange = function () {};
                } else {
                    p(req);
                }
            };

            req.open("GET", url, true);
            req.responseType = "";

            req.send(null);
        }, function () {
            req._canceled = true;
            req.abort();
        });
    }
})();