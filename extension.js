var vscode = require('vscode');
var path = require("path") 
var fs = require("fs") 

var jstobasecssExtension = function() {

    var outputChannel;
    var rootPath = "";
    var ignore = [];
    var rule ={};
    outputChannel = vscode.window.createOutputChannel("JsToBaseCss");

    Array.prototype.unique = function(){
        var result = [], hash = {};
        for (var i = 0, elem; (elem = this[i]) != null; i++) {
            if (!hash[elem]) {
                result.push(elem);
                hash[elem] = true;
            }
        }
        return result;
    };
    function arraycontains(arr, obj) {  
        var i = arr.length;  
        while (i--) {  
            if (arr[i] === obj) {  
                return true;  
            }  
        }  
        return false;  
    }  

    function SingleReadDirSync(p){  
        var f = [];
        var pa = fs.readdirSync(p);  
        for (var i = 0; i < pa.length; i++) {
            var FilePath = path.join(p,pa[i]);
            var info = fs.statSync(FilePath)
            if (!arraycontains(ignore,path.relative(vscode.workspace.rootPath,FilePath))){
                if(!info.isDirectory()){  
                    f.push(FilePath);
                } 
            }  
        }
        return f;
    }  


	function ChildReadDirSync(p){  
        var f = [];
        var pa = fs.readdirSync(p);  
        for (var i = 0; i < pa.length; i++) {
            var FilePath = path.join(p,pa[i]);
            var info = fs.statSync(FilePath)
            if (!arraycontains(ignore,path.relative(vscode.workspace.rootPath,FilePath))){
                if(info.isDirectory()){  
                    f = f.concat(ChildReadDirSync(FilePath));
                }else{  
                    f.push(FilePath);
                }  
            }
 
        }
        return f;
    }  


    return {
        OnSave: function (document) {
            var configuration = vscode.workspace.getConfiguration('jstobasecss');
            ignore = configuration.ignoreDir;
            rootPath = vscode.workspace.rootPath;
            if (configuration.compileAfterSave) {
                this.CompileAll();
                outputChannel.appendLine("Compile Success , File To : "+path.join(rootPath,configuration.outDir,configuration.outFile));
            }

        },
        CompileAll: function() {
            var configuration = vscode.workspace.getConfiguration('jstobasecss');
            ignore = configuration.ignoreDir;
            rootPath = vscode.workspace.rootPath;
            rule = configuration.rule;
            var filea = [];
            if (configuration.child){
                filea = ChildReadDirSync(rootPath);
            }else{
                filea = SingleReadDirSync(rootPath);
            }
            var files = [];
            for (var i = 0; i < filea.length; i++) {
                if (new RegExp(configuration.excludeRegex).test(filea[i])){
                    files.push(filea[i]);
                }
            }
            var classarr =[];
            for (var i = 0; i < files.length; i++) {
                var filename = files[i];
                var classstr=fs.readFileSync(filename); 
                var Re = new RegExp("class ?= ?[\"']([^'\"]+)[\"']","gm");
                while ((rs = Re.exec(classstr)) != null)
                {
                    var tmp = rs[1];
                    if (tmp.indexOf(" ")>0){
                        ca = tmp.split(" ");
                        classarr = classarr.concat(ca);
                    }else{
                        classarr.push(tmp);
                    }
                }
            }
            var classstr = classarr.unique().join("\n");
            var cssstr = "";
            for (var key in rule) {
                if (rule.hasOwnProperty(key)) {
                    var element = rule[key];
                    var Re = new RegExp(key,"gm");
                    while ((rs = Re.exec(classstr)) != null)
                    {
                        var style = "." +
                            rs[0] +
                            "{" +
                            element[0].replace("{$$}",rs[1]) +
                            "}";
                        cssstr += style;
                    }
                }
            }
            fs.writeFileSync(path.join(rootPath,configuration.outDir,configuration.outFile),cssstr);
            //outputChannel.appendLine(cssstr);
        }
    }
};
function activate(context) {
    console.log('Congratulations, your extension "jstobasecss-for-vscode" is now active!');
    var extension = jstobasecssExtension();
    vscode.workspace.onDidSaveTextDocument(function(document) { extension.OnSave(document) });
    let disposable = vscode.commands.registerCommand('jstobasecss.compileall', function () {
        extension.CompileAll();
        vscode.window.showInformationMessage('Compile Success!');
    });
    context.subscriptions.push(disposable);
}
function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;